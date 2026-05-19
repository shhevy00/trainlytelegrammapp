import crypto from "node:crypto";

/** Строка для HMAC по спецификации Telegram WebApp initData. */
export function buildTelegramDataCheckString(params: URLSearchParams): string {
  return [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export function signTelegramDataCheckString(dataCheckString: string, botToken: string): string {
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  return crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
}
