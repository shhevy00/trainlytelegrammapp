import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { clients } from "@/db/schema/clients";
import { trainers } from "@/db/schema/trainers";

/** Шаблон тренировки в разрезе клиента (lib/workout/templates.ts). */
export const workoutTemplates = pgTable(
  "workout_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("workout_templates_trainer_client_idx").on(t.trainerId, t.clientId)],
);

export const workoutTemplateExercises = pgTable(
  "workout_template_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    plannedSets: integer("planned_sets"),
    comment: text("comment"),
  },
  (t) => [
    index("workout_template_exercises_template_order_idx").on(t.templateId, t.orderIndex),
    check("workout_tpl_ex_order_non_negative", sql`${t.orderIndex} >= 0`),
    check(
      "workout_tpl_ex_planned_sets_range",
      sql`${t.plannedSets} IS NULL OR (${t.plannedSets} >= 1 AND ${t.plannedSets} <= 20)`,
    ),
  ],
);
