ALTER TABLE "course_generation_jobs" ADD COLUMN "metadata_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_generation_jobs" ADD COLUMN "transcript_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_generation_jobs" ADD COLUMN "chapters_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_generation_jobs" ADD COLUMN "player_completed_at" timestamp with time zone;