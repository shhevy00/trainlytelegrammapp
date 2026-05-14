import { getDb } from "@/lib/db/server";
import { processYookassaWebhook } from "@/lib/server/yookassaWebhook";

function verifyWebhookSecret(req: Request, secret: string): boolean {
  const header = req.headers.get("x-trainly-yookassa-secret");
  if (header === secret) return true;
  const allowQuery = process.env.TRAINLY_YOOKASSA_WEBHOOK_ALLOW_QUERY_SECRET === "true";
  if (!allowQuery) return false;
  const url = new URL(req.url);
  const q = url.searchParams.get("trainly_webhook_secret");
  return q === secret;
}

/**
 * Уведомления ЮKassa (payment.succeeded и др.).
 * Идемпотентность: `billing_webhook_events.idempotency_key` = `${event}:${payment.id}`.
 * Секрет: заголовок `X-Trainly-Yookassa-Secret` или при `TRAINLY_YOOKASSA_WEBHOOK_ALLOW_QUERY_SECRET=true` — query `trainly_webhook_secret` (только staging).
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.TRAINLY_YOOKASSA_WEBHOOK_SECRET;
  if (secret == null || secret.length === 0) {
    return new Response("webhook secret not configured", { status: 503 });
  }
  if (!verifyWebhookSecret(req, secret)) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const db = getDb();
  const { httpStatus, message } = await processYookassaWebhook(db, body);
  return new Response(message, { status: httpStatus });
}
