/**
 * Единая точка экспорта схемы для Drizzle (`drizzle-kit`, `drizzle(pool, { schema })`).
 * Порядок файлов не важен: FK разрешены между таблицами.
 */
export * from "@/db/schema/enums";
export * from "@/db/schema/trainers";
export * from "@/db/schema/clients";
export * from "@/db/schema/coach-ledger";
export * from "@/db/schema/workout-templates";
export * from "@/db/schema/schedule";
export * from "@/db/schema/workouts";
export * from "@/db/schema/billing-webhooks";
export * from "@/db/schema/trainly-orders";
export * from "@/db/schema/legal";
