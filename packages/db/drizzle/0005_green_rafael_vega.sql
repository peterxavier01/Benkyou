CREATE INDEX "bookmarks_active_user_updated_idx" ON "bookmarks" USING btree ("user_id","updated_at") WHERE "bookmarks"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "course_generation_jobs_course_created_idx" ON "course_generation_jobs" USING btree ("course_id","created_at");--> statement-breakpoint
CREATE INDEX "courses_active_owner_updated_idx" ON "courses" USING btree ("owner_id","updated_at") WHERE "courses"."deleted_at" is null;
