import { getTrainlyDataSource } from "@/lib/config/dataSource";

/**
 * Сервер-only: доступен ли вход через Telegram Mini App (PostgreSQL + токен бота).
 */
export function isTelegramMiniAppAuthConfigured(): boolean {
  try {
    if (getTrainlyDataSource() !== "postgres") return false;
  } catch {
    return false;
  }
  return (process.env.TELEGRAM_BOT_TOKEN?.length ?? 0) > 0;
}
