/**
 * Проверка подключения к PostgreSQL (итерация A плана).
 * Загружает `.env` / `.env.local` как `scripts/db-migrate.ts`.
 */
import pg from "pg";
import { loadRepoEnvFiles } from "./loadRepoEnv";

loadRepoEnvFiles();

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url == null || url.length === 0) {
    throw new Error("DATABASE_URL is not set (.env.local)");
  }
  const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 8000 });
  try {
    const r = await pool.query<{ one: number }>("SELECT 1 AS one");
    if (r.rows[0]?.one !== 1) {
      throw new Error("unexpected SELECT result");
    }
    console.log("db:smoke OK — подключение к PostgreSQL работает.");
  } finally {
    await pool.end();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
