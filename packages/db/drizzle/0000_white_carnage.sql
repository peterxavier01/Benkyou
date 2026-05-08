CREATE TYPE "public"."course_visibility" AS ENUM('private', 'unlisted', 'public');--> statement-breakpoint
CREATE TYPE "public"."generation_job_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transcript_source" AS ENUM('youtube_captions', 'manual', 'sample');--> statement-breakpoint
CREATE TYPE "public"."video_provider" AS ENUM('youtube', 'vimeo', 'loom');--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "video_provider" NOT NULL,
	"provider_video_id" text NOT NULL,
	"source_url" text NOT NULL,
	"canonical_url" text,
	"title" text,
	"description" text,
	"thumbnail_url" text,
	"channel_name" text,
	"channel_url" text,
	"duration_seconds" integer,
	"transcript_source" "transcript_source",
	"transcript_text" text,
	"raw_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"course_id" uuid NOT NULL,
	"chapter_id" uuid,
	"timestamp_seconds" integer NOT NULL,
	"title" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "chapter_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"chapter_id" uuid NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_notes_user_chapter_unique" UNIQUE NULLS NOT DISTINCT("user_id","chapter_id")
);
--> statement-breakpoint
CREATE TABLE "chapter_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"chapter_id" uuid NOT NULL,
	"watched_seconds" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_progress_user_chapter_unique" UNIQUE NULLS NOT DISTINCT("user_id","chapter_id")
);
--> statement-breakpoint
CREATE TABLE "course_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"order_index" integer NOT NULL,
	"start_seconds" integer NOT NULL,
	"end_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"status" "generation_job_status" DEFAULT 'queued' NOT NULL,
	"transcript_source" "transcript_source",
	"failure_reason" text,
	"retryable" boolean DEFAULT false NOT NULL,
	"raw_output" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"course_id" uuid NOT NULL,
	"resume_seconds" integer DEFAULT 0 NOT NULL,
	"completion_percent" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_progress_user_course_unique" UNIQUE NULLS NOT DISTINCT("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"owner_id" text,
	"title" text NOT NULL,
	"description" text,
	"visibility" "course_visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_chapter_id_course_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."course_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_notes" ADD CONSTRAINT "chapter_notes_chapter_id_course_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."course_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_chapter_id_course_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."course_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_chapters" ADD CONSTRAINT "course_chapters_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_generation_jobs" ADD CONSTRAINT "course_generation_jobs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "videos_provider_video_idx" ON "videos" USING btree ("provider","provider_video_id");--> statement-breakpoint
CREATE INDEX "bookmarks_course_idx" ON "bookmarks" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "bookmarks_user_idx" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookmarks_active_course_idx" ON "bookmarks" USING btree ("course_id") WHERE "bookmarks"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "chapter_notes_chapter_idx" ON "chapter_notes" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "chapter_progress_chapter_idx" ON "chapter_progress" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "course_chapters_course_idx" ON "course_chapters" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_chapters_course_order_idx" ON "course_chapters" USING btree ("course_id","order_index");--> statement-breakpoint
CREATE INDEX "course_generation_jobs_course_idx" ON "course_generation_jobs" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_generation_jobs_status_idx" ON "course_generation_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "course_progress_course_idx" ON "course_progress" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "courses_owner_idx" ON "courses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "courses_video_idx" ON "courses" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "courses_active_owner_idx" ON "courses" USING btree ("owner_id") WHERE "courses"."deleted_at" is null;