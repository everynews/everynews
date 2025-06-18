ALTER TABLE "stories" RENAME COLUMN "irrelevant" TO "user_marked_irrelevant";--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "system_marked_irrelevant" boolean DEFAULT false;