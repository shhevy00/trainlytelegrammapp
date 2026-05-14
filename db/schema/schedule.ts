import { sql } from "drizzle-orm";
import { check, date, index, integer, pgTable, text, time, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { scheduleItemStatusEnum } from "@/db/schema/enums";
import { clients } from "@/db/schema/clients";
import { trainers } from "@/db/schema/trainers";
import { workoutTemplates } from "@/db/schema/workout-templates";

/**
 * Плановый слот (план). Факт — в `workouts` + статус слота.
 * Связь с фактом: `workouts.schedule_item_id` (одиночная ссылка без цикла FK).
 */
export const scheduleItems = pgTable(
  "schedule_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
    /** Локальное время записи (часовой пояс — профиль тренера). */
    scheduledTime: time("scheduled_time").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    status: scheduleItemStatusEnum("status").notNull().default("planned"),
    templateId: uuid("template_id").references(() => workoutTemplates.id, { onDelete: "set null" }),
    /** Подпись на момент создания (если шаблон переименуют). */
    templateNameSnapshot: varchar("template_name_snapshot", { length: 200 }),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("schedule_trainer_date_idx").on(t.trainerId, t.scheduledDate),
    index("schedule_trainer_client_idx").on(t.trainerId, t.clientId),
    /** Часто нужны только «живые» слоты в UI расписания. */
    index("schedule_trainer_date_active_idx")
      .on(t.trainerId, t.scheduledDate)
      .where(
        sql`${t.status} IN ('planned'::schedule_item_status, 'upcoming'::schedule_item_status)`,
      ),
    check(
      "schedule_duration_reasonable",
      sql`${t.durationMinutes} >= 1 AND ${t.durationMinutes} <= 1440`,
    ),
  ],
);
