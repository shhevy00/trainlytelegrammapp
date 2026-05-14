import "server-only";

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { AppDatabase } from "@/db/client";
import * as schema from "@/db/schema";

declare global {
  var __trainlyPgPool: pg.Pool | undefined;
  var __trainlyDb: AppDatabase | undefined;
}

export function getPgPool(): pg.Pool {
  if (globalThis.__trainlyPgPool != null) return globalThis.__trainlyPgPool;
  const url = process.env.DATABASE_URL;
  if (url == null || url.length === 0) {
    const suffix =
      process.env.NODE_ENV === "production"
        ? " Trainly production requires PostgreSQL (see README «Источник данных»)."
        : "";
    throw new Error(`DATABASE_URL is not set.${suffix}`);
  }
  const pool = new pg.Pool({
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
  });
  globalThis.__trainlyPgPool = pool;
  return pool;
}

export function getDb(): AppDatabase {
  if (globalThis.__trainlyDb != null) return globalThis.__trainlyDb;
  const db = drizzle(getPgPool(), { schema });
  globalThis.__trainlyDb = db;
  return db;
}
