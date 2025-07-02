ALTER TABLE "alerts" RENAME COLUMN "last_sent" TO "slow_last_sent";--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "fast_last_sent" timestamp;