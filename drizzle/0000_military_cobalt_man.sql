CREATE TABLE "accounts" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"created_at" timestamp NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"created_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"config" json NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"last_run" timestamp,
	"last_sent" timestamp,
	"next_run" timestamp,
	"strategy" json NOT NULL,
	"wait" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"news_id" text NOT NULL,
	"snippet" text,
	"title" text NOT NULL,
	"url" text NOT NULL,
	CONSTRAINT "stories_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;