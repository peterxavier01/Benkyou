CREATE TABLE "course_generation_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"key_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "course_generation_rate_limits_key_created_idx" ON "course_generation_rate_limits" USING btree ("key","created_at");
--> statement-breakpoint
CREATE INDEX "course_generation_rate_limits_created_idx" ON "course_generation_rate_limits" USING btree ("created_at");
