/**
 * Применяет SQL-миграции из папки `drizzle/` (обход drizzle-kit migrate при необходимости в CI).
 * Требуется `DATABASE_URL`.
 * Подхватывает `.env` и `.env.local` из корня репозитория (как при локальной разработке), не перезаписывая уже заданные в shell переменные.
 */
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { getRepoRoot, loadRepoEnvFiles } from "./loadRepoEnv";

loadRepoEnvFiles();
const repoRoot = getRepoRoot();

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url == null || url.length === 0) {
    const tried = [path.join(repoRoot, ".env"), path.join(repoRoot, ".env.local")]
      .filter((p) => fs.existsSync(p))
      .join(", ");
    throw new Error(
      `DATABASE_URL is not set. Добавьте строку DATABASE_URL=postgresql://... в .env.local (в корне проекта) и повторите команду.${
        tried.length > 0 ? ` Найдены файлы: ${tried}.` : " Файлы .env / .env.local не найдены."
      }`,
    );
  }
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool);
  const migrationsFolder = path.join(repoRoot, "drizzle");
  await migrate(db, { migrationsFolder });

  // Drizzle кладёт все миграции в одну транзакцию: новые значения enum нельзя использовать в частичном индексе до COMMIT.
  // После migrate() транзакция закоммичена — добавляем индексы и CHECK отдельно (идемпотентно).
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "workouts_one_active_logger_per_trainer_client_idx"
      ON "workouts" USING btree ("trainer_id","client_id")
      WHERE "workouts"."status" IN ('draft'::workout_status, 'in_progress'::workout_status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "workouts_draft_trainer_client_idx"
      ON "workouts" USING btree ("trainer_id","client_id")
      WHERE "workouts"."status" IN ('draft'::workout_status, 'in_progress'::workout_status);
    `);
    await client.query(`
      DO $body$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'workouts_completed_at_matches_status'
        ) THEN
          ALTER TABLE "workouts" ADD CONSTRAINT "workouts_completed_at_matches_status" CHECK (
            ("workouts"."status"::text IN ('draft', 'in_progress', 'cancelled') AND "workouts"."completed_at" IS NULL)
            OR ("workouts"."status"::text IN ('completed', 'completed_as_note') AND "workouts"."completed_at" IS NOT NULL)
          );
        END IF;
      END $body$;
    `);
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
