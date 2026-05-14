import { sql } from "drizzle-orm";
import {
  bigint,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { trainerProductAccessEnum } from "@/db/schema/enums";

/** Учётная запись тренера (идентичность позже: Telegram + JWT). */
export const trainers = pgTable("trainers", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Telegram user id; уникален среди тренеров после привязки. */
  telegramUserId: bigint("telegram_user_id", { mode: "bigint" }).unique(),
  displayName: varchar("display_name", { length: 200 }).notNull().default(""),
  specialization: varchar("specialization", { length: 300 }),
  city: varchar("city", { length: 120 }),
  /** IANA, например Europe/Moscow. */
  timezone: varchar("timezone", { length: 64 }).notNull().default("Europe/Moscow"),
  /** ISO 4217 для отображения и биллинга. */
  currency: varchar("currency", { length: 3 }).notNull().default("RUB"),
  legalAcceptedAt: timestamp("legal_accepted_at", { withTimezone: true, mode: "date" }),
  onboardingSeenAt: timestamp("onboarding_seen_at", { withTimezone: true, mode: "date" }),
  /** Контекстные генерации ИИ (не тариф Trainly). */
  aiCreditsBalance: integer("ai_credits_balance").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .default(sql`now()`),
});

/**
 * Одна строка на тренера: доступ Trainly (YooKassa, webhooks — позже).
 * Цены и период считаются на сервере; здесь только зафиксированный результат.
 */
export const trainerProductAccess = pgTable("trainer_product_access", {
  trainerId: uuid("trainer_id")
    .primaryKey()
    .references(() => trainers.id, { onDelete: "cascade" }),
  accessStatus: trainerProductAccessEnum("access_status").notNull().default("demo_unlimited"),
  planCode: varchar("plan_code", { length: 64 }),
  validUntil: timestamp("valid_until", { withTimezone: true, mode: "date" }),
  /** Идемпотентность вебхуков: последний обработанный идентификатор ЮKassa (позже). */
  lastYookassaPaymentId: text("last_yookassa_payment_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .default(sql`now()`),
});
