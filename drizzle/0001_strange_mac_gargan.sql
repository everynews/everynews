ALTER TABLE "stories" DROP CONSTRAINT "stories_url_prompt_hash_language_code_unique";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "prompt_hash";--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_url_prompt_id_language_code_unique" UNIQUE("url","prompt_id","language_code");