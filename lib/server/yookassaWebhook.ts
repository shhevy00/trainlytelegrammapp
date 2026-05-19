import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import {
  accessValidDaysForBillingPeriod,
  getPaidPlanCheckoutQuote,
  normalizePaidPlanSlug,
  parseBillingPeriodParam,
  type BillingPeriod,
  type PaidPlanSlug,
} from "@/lib/billing/planDefinitions";
import { billingWebhookEvents, trainlyOrders, trainerProductAccess } from "@/db/schema";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseMetadata(raw: unknown): Record<string, string> {
  if (!isRecord(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}

function addDaysUtc(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

/**
 * Подтверждение статуса платежа через API ЮKassa (рекомендуется в production).
 */
async function fetchYookassaPayment(
  paymentId: string,
): Promise<{ status: string; metadata: Record<string, string>; amountValue?: string } | null> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return null;
  const token = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: { Authorization: `Basic ${token}` },
  });
  if (!res.ok) return null;
  let data: unknown;
  try {
    data = (await res.json()) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(data)) return null;
  const status = data.status;
  if (typeof status !== "string") return null;
  const amount = data.amount;
  let amountValue: string | undefined;
  if (isRecord(amount) && typeof amount.value === "string") {
    amountValue = amount.value;
  }
  return { status, metadata: parseMetadata(data.metadata), amountValue };
}

/**
 * Обрабатывает тело уведомления ЮKassa: запись в `billing_webhook_events` по уникальному ключу,
 * затем идемпотентное обновление доступа тренера и заказа Trainly (если переданы метаданные).
 * Повтор с тем же ключом: если прошлый прогон завершился без handlerStatus 200, обработка выполняется снова
 * (восстановление после сбоя между insert и mark).
 */
export async function processYookassaWebhook(
  db: AppDatabase,
  rawBody: unknown,
): Promise<{ httpStatus: number; message: string }> {
  if (!isRecord(rawBody)) {
    return { httpStatus: 400, message: "invalid_body" };
  }
  const event = rawBody.event;
  const object = rawBody.object;
  if (typeof event !== "string" || !isRecord(object)) {
    return { httpStatus: 400, message: "invalid_shape" };
  }
  const paymentId = object.id;
  if (typeof paymentId !== "string" || paymentId.length === 0) {
    return { httpStatus: 400, message: "missing_payment_id" };
  }

  const idempotencyKey = `${event}:${paymentId}`;

  const inserted = await db
    .insert(billingWebhookEvents)
    .values({
      idempotencyKey,
      payloadJson: rawBody,
    })
    .onConflictDoNothing({ target: billingWebhookEvents.idempotencyKey })
    .returning({ id: billingWebhookEvents.id });

  let webhookRowId: string;

  if (inserted.length > 0) {
    webhookRowId = inserted[0]!.id;
  } else {
    const existing = await db
      .select({
        id: billingWebhookEvents.id,
        processedAt: billingWebhookEvents.processedAt,
        handlerStatus: billingWebhookEvents.handlerStatus,
      })
      .from(billingWebhookEvents)
      .where(eq(billingWebhookEvents.idempotencyKey, idempotencyKey))
      .limit(1);
    const row = existing[0];
    if (row == null) {
      return { httpStatus: 500, message: "idempotency_row_missing" };
    }
    if (row.processedAt != null && row.handlerStatus === 200) {
      return { httpStatus: 200, message: "duplicate" };
    }
    webhookRowId = row.id;
  }

  const mark = async (handlerStatus: number, errorMessage: string | null): Promise<void> => {
    await db
      .update(billingWebhookEvents)
      .set({
        processedAt: new Date(),
        handlerStatus,
        errorMessage,
      })
      .where(eq(billingWebhookEvents.id, webhookRowId));
  };

  try {
    if (event !== "payment.succeeded") {
      await mark(200, null);
      return { httpStatus: 200, message: "ignored_event" };
    }

    const isProduction = process.env.NODE_ENV === "production";
    const verified = await fetchYookassaPayment(paymentId);
    const notifyStatus = typeof object.status === "string" ? object.status : "";
    const metadata = verified?.metadata ?? parseMetadata(object.metadata);
    const statusToCheck = verified?.status ?? notifyStatus;

    if (isProduction && verified == null) {
      await mark(503, "yookassa_api_verify_failed_or_unconfigured");
      return { httpStatus: 503, message: "verify_required" };
    }

    if (statusToCheck !== "succeeded") {
      await mark(200, `skipped_status_${statusToCheck}`);
      return { httpStatus: 200, message: "skipped_not_succeeded" };
    }

    const trainerId = metadata.trainly_trainer_id ?? metadata.trainlyTrainerId;
    const planCodeRaw = metadata.plan_code ?? metadata.planCode;
    const orderId = metadata.trainly_order_id ?? metadata.trainlyOrderId;

    if (typeof trainerId !== "string" || trainerId.length === 0 || typeof planCodeRaw !== "string") {
      await mark(200, "no_trainly_metadata");
      return { httpStatus: 200, message: "no_trainly_metadata" };
    }

    const planSlug = normalizePaidPlanSlug(planCodeRaw);
    if (planSlug == null) {
      await mark(200, "invalid_plan_code");
      return { httpStatus: 200, message: "invalid_plan_code" };
    }

    if (isProduction && (typeof orderId !== "string" || orderId.length === 0)) {
      await mark(200, "missing_order_id");
      return { httpStatus: 200, message: "missing_order_id" };
    }

    let billingPeriod: BillingPeriod = parseBillingPeriodParam(
      metadata.billing_period ?? metadata.billingPeriod,
    );
    let orderAmountRub: number | null = null;

    if (typeof orderId === "string" && orderId.length > 0) {
      const orderRows = await db
        .select({
          id: trainlyOrders.id,
          planCode: trainlyOrders.planCode,
          amountRub: trainlyOrders.amountRub,
          status: trainlyOrders.status,
          yookassaPaymentId: trainlyOrders.yookassaPaymentId,
          metadataJson: trainlyOrders.metadataJson,
        })
        .from(trainlyOrders)
        .where(and(eq(trainlyOrders.id, orderId), eq(trainlyOrders.trainerId, trainerId)))
        .limit(1);
      const order = orderRows[0];
      if (order == null) {
        await mark(200, "order_not_found");
        return { httpStatus: 200, message: "order_not_found" };
      }
      const orderPlanSlug = normalizePaidPlanSlug(order.planCode);
      if (orderPlanSlug !== planSlug) {
        await mark(200, "order_plan_mismatch");
        return { httpStatus: 200, message: "order_plan_mismatch" };
      }
      if (
        order.yookassaPaymentId != null &&
        order.yookassaPaymentId.length > 0 &&
        order.yookassaPaymentId !== paymentId
      ) {
        await mark(200, "payment_id_mismatch");
        return { httpStatus: 200, message: "payment_id_mismatch" };
      }
      const orderMeta = order.metadataJson;
      if (isRecord(orderMeta) && typeof orderMeta.billingPeriod === "string") {
        billingPeriod = parseBillingPeriodParam(orderMeta.billingPeriod);
      }
      orderAmountRub = order.amountRub;
    }

    const quote = getPaidPlanCheckoutQuote(planSlug, billingPeriod);

    if (verified?.amountValue != null) {
      const got = Number.parseFloat(verified.amountValue.replace(",", "."));
      if (!Number.isFinite(got) || Math.round(got) !== quote.amountRub) {
        await mark(200, `amount_mismatch_expected_${quote.amountRub}`);
        return { httpStatus: 200, message: "amount_mismatch" };
      }
    }

    if (orderAmountRub != null && orderAmountRub !== quote.amountRub) {
      await mark(200, "order_amount_mismatch");
      return { httpStatus: 200, message: "order_amount_mismatch" };
    }

    const until = addDaysUtc(new Date(), accessValidDaysForBillingPeriod(billingPeriod));

    await db.transaction(async (tx) => {
      if (typeof orderId === "string" && orderId.length > 0) {
        await tx
          .update(trainlyOrders)
          .set({
            status: "succeeded",
            yookassaPaymentId: paymentId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(trainlyOrders.id, orderId),
              eq(trainlyOrders.trainerId, trainerId),
              eq(trainlyOrders.status, "pending"),
            ),
          );
      }

      await tx
        .insert(trainerProductAccess)
        .values({
          trainerId,
          accessStatus: "active",
          planCode: planSlug,
          validUntil: until,
          lastYookassaPaymentId: paymentId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: trainerProductAccess.trainerId,
          set: {
            accessStatus: "active",
            planCode: planSlug,
            validUntil: until,
            lastYookassaPaymentId: paymentId,
            updatedAt: new Date(),
          },
        });
    });

    await mark(200, null);
    return { httpStatus: 200, message: "applied" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    await mark(500, msg);
    return { httpStatus: 500, message: msg };
  }
}
