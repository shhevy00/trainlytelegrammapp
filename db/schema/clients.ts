import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { clientLifecycleEnum } from "@/db/schema/enums";
import { trainers } from "@/db/schema/trainers";

/**
 * Клиент тренера. Всегда принадлежит ровно одному trainer_id (изоляция данных).
 * Денормализованные KPI (последняя тренировка и т.д.) считаются в lib/ или материализуются позже.
 */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    goal: text("goal"),
    limitation: text("limitation"),
    /** Свободные заметки тренера по клиенту. */
    generalNotes: text("general_notes"),
    /** Остаток оплаченных занятий; изменяется при оплатах и завершённых тренировках (правила в lib/coach). */
    remainingSessions: integer("remaining_sessions").notNull().default(0),
    lifecycle: clientLifecycleEnum("lifecycle").notNull().default("active"),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    telegramUsername: varchar("telegram_username", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("clients_trainer_id_idx").on(t.trainerId), index("clients_trainer_lifecycle_idx").on(t.trainerId, t.lifecycle)],
);
