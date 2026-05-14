CREATE TABLE "billing_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(32) DEFAULT 'yookassa' NOT NULL,
	"idempotency_key" text NOT NULL,
	"trainer_id" uuid,
	"payload_json" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"handler_status" integer,
	"error_message" text,
	CONSTRAINT "billing_webhook_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "billing_webhook_events" ADD CONSTRAINT "billing_webhook_events_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_webhook_trainer_received_idx" ON "billing_webhook_events" USING btree ("trainer_id","received_at");--> statement-breakpoint
CREATE INDEX "billing_webhook_unprocessed_idx" ON "billing_webhook_events" USING btree ("received_at") WHERE "billing_webhook_events"."processed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "schedule_trainer_date_active_idx" ON "schedule_items" USING btree ("trainer_id","scheduled_date") WHERE "schedule_items"."status" IN ('planned'::schedule_item_status, 'upcoming'::schedule_item_status);--> statement-breakpoint
CREATE INDEX "workouts_journal_trainer_completed_idx" ON "workouts" USING btree ("trainer_id","completed_at") WHERE "workouts"."status" IN ('completed'::workout_status, 'completed_as_note'::workout_status);--> statement-breakpoint
CREATE INDEX "workouts_draft_trainer_client_idx" ON "workouts" USING btree ("trainer_id","client_id") WHERE "workouts"."status" = 'draft';--> statement-breakpoint
CREATE UNIQUE INDEX "workouts_one_draft_per_trainer_client_idx" ON "workouts" USING btree ("trainer_id","client_id") WHERE "workouts"."status" = 'draft';--> statement-breakpoint
ALTER TABLE "client_session_payments" ADD CONSTRAINT "client_payments_sessions_positive" CHECK ("client_session_payments"."sessions_added" > 0);--> statement-breakpoint
ALTER TABLE "client_session_payments" ADD CONSTRAINT "client_payments_amount_non_negative" CHECK ("client_session_payments"."amount_rub" IS NULL OR "client_session_payments"."amount_rub" >= 0);--> statement-breakpoint
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_tpl_ex_order_non_negative" CHECK ("workout_template_exercises"."order_index" >= 0);--> statement-breakpoint
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_tpl_ex_planned_sets_range" CHECK ("workout_template_exercises"."planned_sets" IS NULL OR ("workout_template_exercises"."planned_sets" >= 1 AND "workout_template_exercises"."planned_sets" <= 20));--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_duration_reasonable" CHECK ("schedule_items"."duration_minutes" >= 1 AND "schedule_items"."duration_minutes" <= 1440);--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_order_non_negative" CHECK ("workout_exercises"."order_index" >= 0);--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_completed_at_matches_status" CHECK (("workouts"."status"::text = 'draft' AND "workouts"."completed_at" IS NULL) OR ("workouts"."status"::text IN ('completed', 'completed_as_note') AND "workouts"."completed_at" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_duration_non_negative" CHECK ("workouts"."duration_minutes" IS NULL OR "workouts"."duration_minutes" >= 0);--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_filled_set_non_negative" CHECK ("workouts"."filled_set_count" IS NULL OR "workouts"."filled_set_count" >= 0);