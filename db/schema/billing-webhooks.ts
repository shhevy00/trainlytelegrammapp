import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { trainers } from "@/db/schema/trainers";

/**
 * Входящие уведомления платёжного провайдера (ЮKassa и др.).
 * Уникальный `idempotencyKey` гарантирует, что одно и то же событие не обработается дважды.
 * `trainerId` может быть NULL до сопоставления платежа с тренером.
 */
export const billingWebhookEvents = pgTable(
  "billing_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: varchar("provider", { length: 32 }).notNull().default("yookassa"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    trainerId: uuid("trainer_id").references(() => trainers.id, { onDelete: "set null" }),
    payloadJson: jsonb("payload_json").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
    /** HTTP-статус ответа обработчика или внутренний код успеха/ошибки. */
    handlerStatus: integer("handler_status"),
    errorMessage: text("error_message"),
  },
  (t) => [
    index("billing_webhook_trainer_received_idx").on(t.trainerId, t.receivedAt),
    index("billing_webhook_unprocessed_idx")
      .on(t.receivedAt)
      .where(sql`${t.processedAt} IS NULL`),
  ],
);
