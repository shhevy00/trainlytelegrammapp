"use server";

import { revalidateTrainlyBillingPaths } from "@/lib/server/revalidatePaths";
import { eq } from "drizzle-orm";
import { getTrainerSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/server";
import {
  getPaidPlanCheckoutQuote,
  isPaidPlanSlug,
  parseBillingPeriodParam,
  type BillingPeriod,
} from "@/lib/billing/planDefinitions";
import { postYookassaCreatePayment } from "@/lib/server/yookassaCreatePayment";
import { trainlyOrders } from "@/db/schema";

function publicAppBaseUrl(): string {
  const raw = process.env.TRAINLY_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export async function createTrainlyYookassaCheckoutAction(
  planSlug: string,
  billingPeriodRaw: string,
): Promise<{ ok: true; confirmationUrl: string } | { ok: false; error: string }> {
  if (!isPaidPlanSlug(planSlug)) {
    return { ok: false, error: "Некорректный тариф." };
  }
  const billingPeriod: BillingPeriod = parseBillingPeriodParam(billingPeriodRaw);
  const session = await getTrainerSession();
  if (session == null) {
    return { ok: false, error: "Нужна сессия тренера." };
  }
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (shopId == null || shopId.length === 0 || secretKey == null || secretKey.length === 0) {
    return { ok: false, error: "ЮKassa не настроена (YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY)." };
  }

  const quote = getPaidPlanCheckoutQuote(planSlug, billingPeriod);
  const db = getDb();
  const trainerId = session.trainerId;

  const [order] = await db
    .insert(trainlyOrders)
    .values({
      trainerId,
      planCode: planSlug,
      amountRub: quote.amountRub,
      status: "pending",
      metadataJson: {
        source: "billing_checkout",
        planName: quote.name,
        billingPeriod: quote.billingPeriod,
      },
    })
    .returning({ id: trainlyOrders.id });

  if (order == null) {
    return { ok: false, error: "Не удалось создать заказ." };
  }

  const orderId = order.id;
  const amountValue = quote.amountRub.toFixed(2);
  const base = publicAppBaseUrl();
  const returnUrl = `${base}/billing/success?orderId=${encodeURIComponent(orderId)}&plan=${encodeURIComponent(planSlug)}&period=${encodeURIComponent(quote.billingPeriod)}`;

  const payment = await postYookassaCreatePayment({
    shopId,
    secretKey,
    idempotencyKey: orderId,
    amountValue,
    currency: "RUB",
    returnUrl,
    description: `Trainly ${quote.name} (${quote.periodLabelRu})`,
    metadata: {
      trainly_trainer_id: trainerId,
      trainly_order_id: orderId,
      plan_code: planSlug,
      billing_period: quote.billingPeriod,
    },
  });

  if (!payment.ok) {
    await db
      .update(trainlyOrders)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(eq(trainlyOrders.id, orderId));
    return { ok: false, error: payment.error };
  }

  await db
    .update(trainlyOrders)
    .set({ yookassaPaymentId: payment.paymentId, updatedAt: new Date() })
    .where(eq(trainlyOrders.id, orderId));

  revalidateTrainlyBillingPaths();
  return { ok: true, confirmationUrl: payment.confirmationUrl };
}
