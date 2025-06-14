ALTER TABLE "stories" DROP CONSTRAINT "stories_url_unique";--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_url_prompt_id_unique" UNIQUE("url","prompt_id");