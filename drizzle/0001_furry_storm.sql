ALTER TABLE "stories" DROP CONSTRAINT "stories_url_prompt_id_unique";--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "prompt_hash" text;--> statement-breakpoint
-- Set a default hash for existing records (using a placeholder value)
UPDATE "stories" SET "prompt_hash" = 'legacy-prompt-' || COALESCE("prompt_id", 'default') WHERE "prompt_hash" IS NULL;--> statement-breakpoint
-- Now make the column NOT NULL
ALTER TABLE "stories" ALTER COLUMN "prompt_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_url_prompt_hash_unique" UNIQUE("url","prompt_hash");