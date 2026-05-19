import { timingSafeEqualHex } from "@/lib/auth/secureCompare";
import { buildTelegramDataCheckString, signTelegramDataCheckString } from "@/lib/auth/telegramInitData";

export interface TelegramAuthUser {
  id: number;
  firstName?: string;
  username?: string;
}

/**
 * Проверка подписи Telegram WebApp `initData` (login).
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramWebAppInitData(
  initData: string,
  botToken: string,
  maxAgeSec: number,
): TelegramAuthUser {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (hash == null || hash.length === 0) {
    throw new Error("telegram_missing_hash");
  }
  params.delete("hash");
  const dataCheckString = buildTelegramDataCheckString(params);
  const calculated = signTelegramDataCheckString(dataCheckString, botToken);
  if (!timingSafeEqualHex(calculated, hash)) {
    throw new Error("telegram_bad_hash");
  }

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw != null ? Number(authDateRaw) : NaN;
  if (!Number.isFinite(authDate)) {
    throw new Error("telegram_bad_auth_date");
  }
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age < 0 || age > maxAgeSec) {
    throw new Error("telegram_auth_expired");
  }

  const userJson = params.get("user");
  if (userJson == null || userJson.length === 0) {
    throw new Error("telegram_missing_user");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(userJson) as unknown;
  } catch {
    throw new Error("telegram_user_not_json");
  }
  if (typeof parsed !== "object" || parsed === null || !("id" in parsed)) {
    throw new Error("telegram_user_invalid");
  }
  const rec = parsed as { id: unknown; first_name?: unknown; username?: unknown };
  const id = typeof rec.id === "number" ? rec.id : Number(rec.id);
  if (!Number.isFinite(id)) {
    throw new Error("telegram_user_bad_id");
  }

  return {
    id,
    firstName: typeof rec.first_name === "string" ? rec.first_name : undefined,
    username: typeof rec.username === "string" ? rec.username : undefined,
  };
}
