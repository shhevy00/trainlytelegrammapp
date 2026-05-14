/**
 * Создание платежа в API ЮKassa (v3).
 * Секреты только из server env; не вызывать из клиента напрямую.
 */
function basicAuthHeader(shopId: string, secretKey: string): string {
  const token = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${token}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function postYookassaCreatePayment(input: {
  shopId: string;
  secretKey: string;
  idempotencyKey: string;
  amountValue: string;
  currency: string;
  returnUrl: string;
  description: string;
  metadata: Record<string, string>;
}): Promise<{ ok: true; paymentId: string; confirmationUrl: string } | { ok: false; error: string }> {
  const body = {
    amount: { value: input.amountValue, currency: input.currency },
    confirmation: { type: "redirect", return_url: input.returnUrl },
    capture: true,
    description: input.description,
    metadata: input.metadata,
  };

  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(input.shopId, input.secretKey),
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = (await res.json()) as unknown;
  } catch {
    return { ok: false, error: `yookassa_bad_json_http_${res.status}` };
  }

  if (!res.ok) {
    const msg = isRecord(data) && typeof data.description === "string" ? data.description : `http_${res.status}`;
    return { ok: false, error: msg };
  }

  if (!isRecord(data)) {
    return { ok: false, error: "yookassa_invalid_response" };
  }
  const id = data.id;
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "yookassa_missing_payment_id" };
  }
  const confirmation = data.confirmation;
  if (!isRecord(confirmation)) {
    return { ok: false, error: "yookassa_missing_confirmation" };
  }
  const url = confirmation.confirmation_url;
  if (typeof url !== "string" || url.length === 0) {
    return { ok: false, error: "yookassa_missing_confirmation_url" };
  }
  return { ok: true, paymentId: id, confirmationUrl: url };
}
