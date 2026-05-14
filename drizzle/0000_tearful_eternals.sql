CREATE TYPE "public"."client_lifecycle" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."coach_quick_note_type" AS ENUM('general', 'limitation', 'payment', 'progress', 'complaint');--> statement-breakpoint
CREATE TYPE "public"."schedule_item_status" AS ENUM('planned', 'upcoming', 'completed', 'missed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."trainer_product_access_status" AS ENUM('demo_unlimited', 'trial', 'active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."workout_set_type" AS ENUM('working', 'warmup', 'drop', 'failure', 'amrap', 'time');--> statement-breakpoint
CREATE TYPE "public"."workout_status" AS ENUM('draft', 'completed', 'completed_as_note');--> statement-breakpoint
CREATE TABLE "trainer_product_access" (
	"trainer_id" uuid PRIMARY KEY NOT NULL,
	"access_status" "trainer_product_access_status" DEFAULT 'demo_unlimited' NOT NULL,
	"plan_code" varchar(64),
	"valid_until" timestamp with time zone,
	"last_yookassa_payment_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_user_id" bigint,
	"display_name" varchar(200) DEFAULT '' NOT NULL,
	"specialization" varchar(300),
	"city" varchar(120),
	"timezone" varchar(64) DEFAULT 'Europe/Moscow' NOT NULL,
	"currency" varchar(3) DEFAULT 'RUB' NOT NULL,
	"legal_accepted_at" timestamp with time zone,
	"onboarding_seen_at" timestamp with time zone,
	"ai_credits_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trainers_telegram_user_id_unique" UNIQUE("telegram_user_id")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"goal" text,
	"limitation" text,
	"general_notes" text,
	"remaining_sessions" integer DEFAULT 0 NOT NULL,
	"lifecycle" "client_lifecycle" DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"telegram_username" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_session_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"sessions_added" integer NOT NULL,
	"amount_rub" integer,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_quick_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid,
	"note_type" "coach_quick_note_type" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_template_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"planned_sets" integer,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "workout_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"scheduled_time" time NOT NULL,
	"duration_minutes" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"status" "schedule_item_status" DEFAULT 'planned' NOT NULL,
	"template_id" uuid,
	"template_name_snapshot" varchar(200),
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"workout_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"skipped" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"workout_exercise_id" uuid NOT NULL,
	"set_type" "workout_set_type" DEFAULT 'working' NOT NULL,
	"weight" varchar(32) DEFAULT '' NOT NULL,
	"reps" varchar(32) DEFAULT '' NOT NULL,
	"duration_sec" varchar(32) DEFAULT '' NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"is_drop" boolean DEFAULT false NOT NULL,
	"parent_set_id" uuid
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"schedule_item_id" uuid,
	"template_id" uuid,
	"status" "workout_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(200) NOT NULL,
	"workout_comment" text DEFAULT '' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_minutes" integer,
	"filled_set_count" integer,
	"volume_kg" numeric(12, 2),
	"summary_hint" varchar(500),
	"debt_acknowledged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trainer_product_access" ADD CONSTRAINT "trainer_product_access_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_session_payments" ADD CONSTRAINT "client_session_payments_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_session_payments" ADD CONSTRAINT "client_session_payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_quick_notes" ADD CONSTRAINT "coach_quick_notes_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_quick_notes" ADD CONSTRAINT "coach_quick_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_exercise_id_workout_exercises_id_fk" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_parent_set_id_workout_sets_id_fk" FOREIGN KEY ("parent_set_id") REFERENCES "public"."workout_sets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_schedule_item_id_schedule_items_id_fk" FOREIGN KEY ("schedule_item_id") REFERENCES "public"."schedule_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_trainer_id_idx" ON "clients" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "clients_trainer_lifecycle_idx" ON "clients" USING btree ("trainer_id","lifecycle");--> statement-breakpoint
CREATE INDEX "client_payments_trainer_client_idx" ON "client_session_payments" USING btree ("trainer_id","client_id");--> statement-breakpoint
CREATE INDEX "coach_notes_trainer_created_idx" ON "coach_quick_notes" USING btree ("trainer_id","created_at");--> statement-breakpoint
CREATE INDEX "workout_template_exercises_template_order_idx" ON "workout_template_exercises" USING btree ("template_id","order_index");--> statement-breakpoint
CREATE INDEX "workout_templates_trainer_client_idx" ON "workout_templates" USING btree ("trainer_id","client_id");--> statement-breakpoint
CREATE INDEX "schedule_trainer_date_idx" ON "schedule_items" USING btree ("trainer_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "schedule_trainer_client_idx" ON "schedule_items" USING btree ("trainer_id","client_id");--> statement-breakpoint
CREATE INDEX "workout_exercises_workout_order_idx" ON "workout_exercises" USING btree ("workout_id","order_index");--> statement-breakpoint
CREATE INDEX "workout_sets_exercise_idx" ON "workout_sets" USING btree ("workout_exercise_id");--> statement-breakpoint
CREATE INDEX "workouts_trainer_client_idx" ON "workouts" USING btree ("trainer_id","client_id");--> statement-breakpoint
CREATE INDEX "workouts_trainer_status_completed_idx" ON "workouts" USING btree ("trainer_id","status","completed_at");