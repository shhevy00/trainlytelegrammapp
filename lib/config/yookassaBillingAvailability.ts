/**
 * Сервер-only: настроены ли ключи API ЮKassa для создания платежей.
 */
export function isYookassaBillingConfigured(): boolean {
  const shop = process.env.YOOKASSA_SHOP_ID?.trim() ?? "";
  const secret = process.env.YOOKASSA_SECRET_KEY?.trim() ?? "";
  return shop.length > 0 && secret.length > 0;
}

/**
 * Сервер-only: задан ли секрет для `POST /api/webhooks/yookassa` (заголовок X-Trainly-Yookassa-Secret).
 */
export function isYookassaWebhookSecretConfigured(): boolean {
  return (process.env.TRAINLY_YOOKASSA_WEBHOOK_SECRET?.trim().length ?? 0) > 0;
}
