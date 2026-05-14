CREATE TABLE "learning_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"playback_speed" double precision DEFAULT 1 NOT NULL,
	"manual_completion_only" boolean DEFAULT false NOT NULL,
	"autoplay_next_chapter" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_preferences" ADD CONSTRAINT "learning_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;