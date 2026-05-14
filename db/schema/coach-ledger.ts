import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { coachQuickNoteTypeEnum } from "@/db/schema/enums";
import { clients } from "@/db/schema/clients";
import { trainers } from "@/db/schema/trainers";

/**
 * Оплата занятий клиентом тренеру (не биллинг Trainly).
 * Сумма в рублях целым числом (как в моке); при необходимости копейки — миграция на minor unit.
 */
export const clientSessionPayments = pgTable(
  "client_session_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    sessionsAdded: integer("sessions_added").notNull(),
    amountRub: integer("amount_rub"),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("client_payments_trainer_client_idx").on(t.trainerId, t.clientId),
    check("client_payments_sessions_positive", sql`${t.sessionsAdded} > 0`),
    check("client_payments_amount_non_negative", sql`${t.amountRub} IS NULL OR ${t.amountRub} >= 0`),
  ],
);

/** Быстрые заметки тренера (PRODUCT_FLOWS § quick note). */
export const coachQuickNotes = pgTable(
  "coach_quick_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    /** general-заметка может быть без привязки к клиенту. */
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    noteType: coachQuickNoteTypeEnum("note_type").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("coach_notes_trainer_created_idx").on(t.trainerId, t.createdAt)],
);
