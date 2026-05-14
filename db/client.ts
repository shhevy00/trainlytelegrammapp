import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/db/schema";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Создаёт пул и экземпляр Drizzle. Вызывающий код отвечает за `await pool.end()` при остановке процесса.
 * В serverless лучше не держать глобальный пул без лимитов — см. документацию провайдера (Neon, Supabase и т.д.).
 */
export function createDb(connectionString: string): { pool: pg.Pool; db: AppDatabase } {
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema });
  return { pool, db };
}

/** Читает `DATABASE_URL` из окружения; бросает, если переменная не задана. */
export function createDbFromEnv(): { pool: pg.Pool; db: AppDatabase } {
  const url = process.env.DATABASE_URL;
  if (url == null || url.length === 0) {
    throw new Error("DATABASE_URL is not set");
  }
  return createDb(url);
}
