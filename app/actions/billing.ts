"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getTrainerSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/server";
import { PAID_PLAN_CHECKOUT, type PaidPlanSlug } from "@/lib/billing/planDefinitions";
import { postYookassaCreatePayment } from "@/lib/server/yookassaCreatePayment";
import { trainlyOrders } from "@/db/schema";

function publicAppBaseUrl(): string {
  const raw = process.env.TRAINLY_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

function isPaidPlanSlug(v: string): v is PaidPlanSlug {
  return v === "start" || v === "pro" || v === "max";
}

export async function createTrainlyYookassaCheckoutAction(
  planSlug: string,
): Promise<{ ok: true; confirmationUrl: string } | { ok: false; error: string }> {
  if (!isPaidPlanSlug(planSlug)) {
    return { ok: false, error: "Некорректный тариф." };
  }
  const session = await getTrainerSession();
  if (session == null) {
    return { ok: false, error: "Нужна сессия тренера." };
  }
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (shopId == null || shopId.length === 0 || secretKey == null || secretKey.length === 0) {
    return { ok: false, error: "ЮKassa не настроена (YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY)." };
  }

  const plan = PAID_PLAN_CHECKOUT[planSlug];
  const db = getDb();
  const trainerId = session.trainerId;

  const [order] = await db
    .insert(trainlyOrders)
    .values({
      trainerId,
      planCode: planSlug,
      amountRub: plan.amountRub,
      status: "pending",
      metadataJson: { source: "billing_checkout", planName: plan.name },
    })
    .returning({ id: trainlyOrders.id });

  if (order == null) {
    return { ok: false, error: "Не удалось создать заказ." };
  }

  const orderId = order.id;
  const amountValue = plan.amountRub.toFixed(2);
  const base = publicAppBaseUrl();
  const returnUrl = `${base}/billing/success?orderId=${encodeURIComponent(orderId)}&plan=${encodeURIComponent(planSlug)}`;

  const payment = await postYookassaCreatePayment({
    shopId,
    secretKey,
    idempotencyKey: orderId,
    amountValue,
    currency: "RUB",
    returnUrl,
    description: `Trainly ${plan.name}`,
    metadata: {
      trainly_trainer_id: trainerId,
      trainly_order_id: orderId,
      plan_code: planSlug,
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

  revalidatePath("/billing");
  return { ok: true, confirmationUrl: payment.confirmationUrl };
}
