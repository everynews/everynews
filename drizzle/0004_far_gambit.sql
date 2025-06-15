ALTER TABLE "newsletter" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "language_code" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "prompt" DROP COLUMN "language";