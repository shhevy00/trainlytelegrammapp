import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { trainers } from "@/db/schema/trainers";

/**
 * Каталог юридических документов (версии). Тексты страниц остаются в приложении до lawyer review.
 */
export const legalDocuments = pgTable(
  "legal_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentCode: varchar("document_code", { length: 64 }).notNull(),
    version: integer("version").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    requiresAcceptance: boolean("requires_acceptance").notNull().default(true),
    effectiveAt: timestamp("effective_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [unique("legal_documents_code_version_unique").on(t.documentCode, t.version)],
);

/**
 * Факт принятия конкретной версии документа тренером.
 */
export const trainerLegalAcceptances = pgTable(
  "trainer_legal_acceptances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    documentCode: varchar("document_code", { length: 64 }).notNull(),
    version: integer("version").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
    metadataJson: jsonb("metadata_json"),
  },
  (t) => [
    index("trainer_legal_acceptances_trainer_idx").on(t.trainerId),
    unique("trainer_legal_accept_trainer_doc_ver_unique").on(t.trainerId, t.documentCode, t.version),
  ],
);

/**
 * Опциональные согласия (маркетинг и т.д.), отдельно от обязательных acceptances.
 */
export const trainerConsents = pgTable("trainer_consents", {
  trainerId: uuid("trainer_id")
    .primaryKey()
    .references(() => trainers.id, { onDelete: "cascade" }),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  marketingUpdatedAt: timestamp("marketing_updated_at", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().default(sql`now()`),
});

/**
 * Аудит изменений доступа Trainly (append-only). Источник истины по состоянию — `trainer_product_access`.
 */
export const trainerAccessEvents = pgTable(
  "trainer_access_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => trainers.id, { onDelete: "cascade" }),
    eventKind: varchar("event_kind", { length: 64 }).notNull(),
    accessStatus: varchar("access_status", { length: 32 }),
    source: varchar("source", { length: 64 }).notNull(),
    payloadJson: jsonb("payload_json"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("trainer_access_events_trainer_created_idx").on(t.trainerId, t.createdAt)],
);
