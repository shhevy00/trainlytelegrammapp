CREATE TYPE "public"."trainly_order_status" AS ENUM('pending', 'succeeded', 'canceled');--> statement-breakpoint
CREATE TABLE "trainly_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"plan_code" varchar(64) NOT NULL,
	"amount_rub" integer NOT NULL,
	"status" "trainly_order_status" DEFAULT 'pending' NOT NULL,
	"yookassa_payment_id" text,
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trainly_orders_yookassa_payment_id_unique" UNIQUE("yookassa_payment_id")
);
--> statement-breakpoint
ALTER TABLE "trainly_orders" ADD CONSTRAINT "trainly_orders_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trainly_orders_trainer_created_idx" ON "trainly_orders" USING btree ("trainer_id","created_at");--> statement-breakpoint
CREATE INDEX "trainly_orders_trainer_status_idx" ON "trainly_orders" USING btree ("trainer_id","status");