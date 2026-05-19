/** Понятное сообщение для UI при сбое PostgreSQL (dev / auth). */
export function formatPgErrorForUi(err: unknown): string {
  const root = unwrapPgError(err);
  const code =
    root != null && typeof root === "object" && "code" in root
      ? String((root as { code: unknown }).code)
      : "";

  if (code === "ECONNREFUSED") {
    return "PostgreSQL не запущен или неверный порт в DATABASE_URL. Запустите: docker compose up -d postgres, затем npm run db:migrate:run";
  }
  if (code === "ENOTFOUND" || code === "EHOSTUNREACH") {
    return "Хост PostgreSQL недоступен. Проверьте DATABASE_URL в .env.local";
  }
  if (code === "28P01" || code === "28000") {
    return "Неверный логин или пароль PostgreSQL. Проверьте DATABASE_URL";
  }
  if (code === "3D000") {
    return "База данных не существует. Создайте БД trainly или исправьте DATABASE_URL";
  }
  if (code === "42P01") {
    return "Таблицы не созданы. Выполните: npm run db:migrate:run";
  }

  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("DATABASE_URL is not set")) {
    return "Не задан DATABASE_URL в .env.local";
  }
  return "Не удалось подключиться к PostgreSQL. Проверьте, что БД запущена и миграции применены (npm run db:migrate:run)";
}

function unwrapPgError(err: unknown): unknown {
  if (err == null || typeof err !== "object") return err;
  if ("cause" in err && err.cause != null) return unwrapPgError(err.cause);
  return err;
}
