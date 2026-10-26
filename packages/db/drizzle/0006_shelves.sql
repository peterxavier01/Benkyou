CREATE TABLE "shelf_courses" (
	"shelf_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shelf_courses_shelf_id_course_id_pk" PRIMARY KEY("shelf_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "shelves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "shelf_courses" ADD CONSTRAINT "shelf_courses_shelf_id_shelves_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelf_courses" ADD CONSTRAINT "shelf_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shelf_courses_course_idx" ON "shelf_courses" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "shelves_active_owner_updated_idx" ON "shelves" USING btree ("owner_id","updated_at") WHERE "shelves"."deleted_at" is null;