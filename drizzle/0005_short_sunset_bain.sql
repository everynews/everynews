ALTER TABLE "users" DROP CONSTRAINT "users_phone_number_unique";--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone_number";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone_number_verified";