import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { trainlyOrderStatusEnum } from "@/db/schema/enums";
import { trainers } from "@/db/schema/trainers";

export const trainlyOrders = pgTable(
  "trainly_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    planCode: varchar("plan_code", { length: 64 }).notNull(),
    amountRub: integer("amount_rub").notNull(),
    status: trainlyOrderStatusEnum("status").notNull().default("pending"),
    /** Идентификатор платежа в ЮKassa для связи с вебхуками. */
    yookassaPaymentId: text("yookassa_payment_id").unique(),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("trainly_orders_trainer_created_idx").on(t.trainerId, t.createdAt),
    index("trainly_orders_trainer_status_idx").on(t.trainerId, t.status),
  ],
);
