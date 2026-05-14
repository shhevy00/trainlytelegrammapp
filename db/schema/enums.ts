import { pgEnum } from "drizzle-orm/pg-core";

/** Клиент в работе или в архиве (опасные действия из UI_STRUCTURE §14). */
export const clientLifecycleEnum = pgEnum("client_lifecycle", ["active", "archived"]);

/** Плановый слот: см. PRODUCT_FLOWS — schedule item ≠ workout fact. */
export const scheduleItemStatusEnum = pgEnum("schedule_item_status", [
  "planned",
  "upcoming",
  "completed",
  "missed",
  "cancelled",
]);

/**
 * Черновик / активная сессия логгера / отмена без факта в журнале / завершённые факты.
 */
export const workoutStatusEnum = pgEnum("workout_status", [
  "draft",
  "in_progress",
  "cancelled",
  "completed",
  "completed_as_note",
]);

export const coachQuickNoteTypeEnum = pgEnum("coach_quick_note_type", [
  "general",
  "limitation",
  "payment",
  "progress",
  "complaint",
]);

/** Тип подхода — как в lib/workout/types.ts WorkoutSetType. */
export const workoutSetTypeEnum = pgEnum("workout_set_type", [
  "working",
  "warmup",
  "drop",
  "failure",
  "amrap",
  "time",
]);

/** Доступ к продукту Trainly (не путать с оплатами занятий клиентом). Имя типа в PG ≠ имя таблицы `trainer_product_access`. */
export const trainerProductAccessEnum = pgEnum("trainer_product_access_status", [
  "demo_unlimited",
  "trial",
  "active",
  "expired",
  "cancelled",
]);

/** Заказ доступа Trainly (ЮKassa); сумма и тариф только с сервера. */
export const trainlyOrderStatusEnum = pgEnum("trainly_order_status", ["pending", "succeeded", "canceled"]);
