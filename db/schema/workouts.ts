import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { workoutSetTypeEnum, workoutStatusEnum } from "@/db/schema/enums";
import { clients } from "@/db/schema/clients";
import { scheduleItems } from "@/db/schema/schedule";
import { trainers } from "@/db/schema/trainers";
import { workoutTemplates } from "@/db/schema/workout-templates";

/**
 * Тренировка: черновик логгера или запись журнала.
 * Упражнения и подходы — дочерние строки (нормализация + целостность).
 */
export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    scheduleItemId: uuid("schedule_item_id").references(() => scheduleItems.id, { onDelete: "set null" }),
    templateId: uuid("template_id").references(() => workoutTemplates.id, { onDelete: "set null" }),
    status: workoutStatusEnum("status").notNull().default("draft"),
    title: varchar("title", { length: 200 }).notNull(),
    workoutComment: text("workout_comment").notNull().default(""),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    durationMinutes: integer("duration_minutes"),
    filledSetCount: integer("filled_set_count"),
    volumeKg: numeric("volume_kg", { precision: 12, scale: 2 }),
    summaryHint: varchar("summary_hint", { length: 500 }),
    /** Подтверждение старта при нуле/долге (WorkoutSessionState.debtAcknowledged). */
    debtAcknowledged: boolean("debt_acknowledged").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("workouts_trainer_client_idx").on(t.trainerId, t.clientId),
    index("workouts_trainer_status_completed_idx").on(t.trainerId, t.status, t.completedAt),
    /** Лента журнала: только завершённые факты. */
    index("workouts_journal_trainer_completed_idx")
      .on(t.trainerId, t.completedAt)
      .where(sql`${t.status}::text IN ('completed', 'completed_as_note')`),
    /** Быстрый поиск активных черновиков / in_progress по клиенту. */
    index("workouts_draft_trainer_client_idx")
      .on(t.trainerId, t.clientId)
      .where(sql`${t.status} IN ('draft'::workout_status, 'in_progress'::workout_status)`),
    /** Не более одной «открытой» тренировки на пару тренер–клиент. */
    uniqueIndex("workouts_one_active_logger_per_trainer_client_idx")
      .on(t.trainerId, t.clientId)
      .where(sql`${t.status} IN ('draft'::workout_status, 'in_progress'::workout_status)`),
    check(
      "workouts_completed_at_matches_status",
      sql`(${t.status}::text IN ('draft', 'in_progress', 'cancelled') AND ${t.completedAt} IS NULL) OR (${t.status}::text IN ('completed', 'completed_as_note') AND ${t.completedAt} IS NOT NULL)`,
    ),
    check("workouts_duration_non_negative", sql`${t.durationMinutes} IS NULL OR ${t.durationMinutes} >= 0`),
    check("workouts_filled_set_non_negative", sql`${t.filledSetCount} IS NULL OR ${t.filledSetCount} >= 0`),
  ],
);

export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    comment: text("comment").notNull().default(""),
    skipped: boolean("skipped").notNull().default(false),
  },
  (t) => [
    index("workout_exercises_workout_order_idx").on(t.workoutId, t.orderIndex),
    check("workout_exercises_order_non_negative", sql`${t.orderIndex} >= 0`),
  ],
);

export const workoutSets = pgTable(
  "workout_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    workoutExerciseId: uuid("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    setType: workoutSetTypeEnum("set_type").notNull().default("working"),
    /** Как в UI: строковые поля ввода до парсинга. */
    weight: varchar("weight", { length: 32 }).notNull().default(""),
    reps: varchar("reps", { length: 32 }).notNull().default(""),
    durationSec: varchar("duration_sec", { length: 32 }).notNull().default(""),
    comment: text("comment").notNull().default(""),
    done: boolean("done").notNull().default(false),
    isDrop: boolean("is_drop").notNull().default(false),
    parentSetId: uuid("parent_set_id").references((): AnyPgColumn => workoutSets.id, { onDelete: "set null" }),
  },
  (t) => [index("workout_sets_exercise_idx").on(t.workoutExerciseId)],
);
