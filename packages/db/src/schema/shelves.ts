import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { courses } from "./courses";
import {
	createdAtColumn,
	deletedAtColumn,
	idColumn,
	updatedAtColumn,
} from "./shared";

/**
 * A learner's named group of notebooks, such as a course split across
 * several videos. Every shelf has an owner, signed in or anonymous.
 */
export const shelves = pgTable(
	"shelves",
	{
		id: idColumn(),
		ownerId: text("owner_id").notNull(),
		name: text("name").notNull(),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
		deletedAt: deletedAtColumn(),
	},
	(table) => [
		index("shelves_active_owner_updated_idx")
			.on(table.ownerId, table.updatedAt)
			.where(sql`${table.deletedAt} is null`),
	],
);

/**
 * Which notebooks sit on which shelf, in order. A notebook can be on
 * several shelves; `position` orders notebooks within one shelf.
 */
export const shelfCourses = pgTable(
	"shelf_courses",
	{
		shelfId: uuid("shelf_id")
			.notNull()
			.references(() => shelves.id, { onDelete: "cascade" }),
		courseId: uuid("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		primaryKey({ columns: [table.shelfId, table.courseId] }),
		index("shelf_courses_course_idx").on(table.courseId),
	],
);

export const shelvesRelations = relations(shelves, ({ many }) => ({
	courses: many(shelfCourses),
}));

export const shelfCoursesRelations = relations(shelfCourses, ({ one }) => ({
	shelf: one(shelves, {
		fields: [shelfCourses.shelfId],
		references: [shelves.id],
	}),
	course: one(courses, {
		fields: [shelfCourses.courseId],
		references: [courses.id],
	}),
}));
