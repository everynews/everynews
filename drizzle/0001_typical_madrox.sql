ALTER TABLE "alert" ADD COLUMN "threshold" integer DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "irrelevant" boolean;
