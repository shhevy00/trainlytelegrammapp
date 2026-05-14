ALTER TYPE "public"."trainer_product_access_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."workout_status" ADD VALUE 'in_progress' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "public"."workout_status" ADD VALUE 'cancelled' BEFORE 'completed';--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_code" varchar(64) NOT NULL,
	"version" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"requires_acceptance" boolean DEFAULT true NOT NULL,
	"effective_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_documents_code_version_unique" UNIQUE("document_code","version")
);
--> statement-breakpoint
CREATE TABLE "trainer_access_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"event_kind" varchar(64) NOT NULL,
	"access_status" varchar(32),
	"source" varchar(64) NOT NULL,
	"payload_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_consents" (
	"trainer_id" uuid PRIMARY KEY NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"marketing_updated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_legal_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"document_code" varchar(64) NOT NULL,
	"version" integer NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata_json" jsonb,
	CONSTRAINT "trainer_legal_accept_trainer_doc_ver_unique" UNIQUE("trainer_id","document_code","version")
);
--> statement-breakpoint
ALTER TABLE "workouts" DROP CONSTRAINT "workouts_completed_at_matches_status";--> statement-breakpoint
DROP INDEX "workouts_one_draft_per_trainer_client_idx";--> statement-breakpoint
DROP INDEX "workouts_draft_trainer_client_idx";--> statement-breakpoint
ALTER TABLE "trainer_access_events" ADD CONSTRAINT "trainer_access_events_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_consents" ADD CONSTRAINT "trainer_consents_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_legal_acceptances" ADD CONSTRAINT "trainer_legal_acceptances_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trainer_access_events_trainer_created_idx" ON "trainer_access_events" USING btree ("trainer_id","created_at");--> statement-breakpoint
CREATE INDEX "trainer_legal_acceptances_trainer_idx" ON "trainer_legal_acceptances" USING btree ("trainer_id");--> statement-breakpoint
INSERT INTO "legal_documents" ("document_code", "version", "title", "requires_acceptance") VALUES
('trainly_terms', 1, 'Условия использования Trainly (черновик)', true),
('trainly_privacy', 1, 'Персональные данные Trainly (черновик)', true),
('trainly_core_mvp', 1, 'Пакет обязательных документов MVP (черновик)', true)
ON CONFLICT ("document_code", "version") DO NOTHING;--> statement-breakpoint
INSERT INTO "trainer_legal_acceptances" ("trainer_id", "document_code", "version", "accepted_at")
SELECT "id", 'trainly_core_mvp', 1, "legal_accepted_at" FROM "trainers" WHERE "legal_accepted_at" IS NOT NULL
ON CONFLICT ("trainer_id", "document_code", "version") DO NOTHING;