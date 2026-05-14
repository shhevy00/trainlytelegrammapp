/**
 * Режим данных приложения: мок в памяти или PostgreSQL.
 *
 * Production:
 * - без `DATABASE_URL` mock не используется (исключение: фаза `npm run build` без URL — временный mock для SSG);
 * - `TRAINLY_USE_MOCK_DATA=true` в production runtime запрещён.
 *
 * Development: без `DATABASE_URL` по умолчанию mock; с URL — postgres.
 */

export type TrainlyDataSource = "mock" | "postgres";

const PROD_DB_ERROR =
  "Trainly production is misconfigured: DATABASE_URL is required. In-memory mock data is not permitted in production.";

const PROD_MOCK_FLAG_ERROR =
  "Trainly production is misconfigured: TRAINLY_USE_MOCK_DATA=true is not permitted in production runtime.";

/** `npm run build` выставляет `npm_lifecycle_event=build` — нужен для локальной сборки без DATABASE_URL. */
function isNpmBuildLifecycle(): boolean {
  return process.env.npm_lifecycle_event === "build";
}

export function getTrainlyDataSource(): TrainlyDataSource {
  const explicit = process.env.TRAINLY_USE_MOCK_DATA;
  const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
  const isProd = process.env.NODE_ENV === "production";

  if (explicit === "true") {
    if (isProd && !isNpmBuildLifecycle()) {
      throw new Error(PROD_MOCK_FLAG_ERROR);
    }
    return "mock";
  }
  if (explicit === "false") {
    if (isProd && dbUrl.length === 0) {
      if (isNpmBuildLifecycle()) {
        return "mock";
      }
      throw new Error(PROD_DB_ERROR);
    }
    return "postgres";
  }

  if (isProd) {
    if (dbUrl.length === 0) {
      if (isNpmBuildLifecycle()) {
        return "mock";
      }
      throw new Error(PROD_DB_ERROR);
    }
    return "postgres";
  }

  return dbUrl.length > 0 ? "postgres" : "mock";
}

export function isTrainlyMockDataSource(): boolean {
  return getTrainlyDataSource() === "mock";
}
