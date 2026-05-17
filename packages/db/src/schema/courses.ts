import { relations, sql } from "drizzle-orm";
import {
	boolean,
	doublePrecision,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import {
	courseVisibilityEnum,
	generationJobStatusEnum,
	transcriptSourceEnum,
} from "./enums";
import {
	createdAtColumn,
	deletedAtColumn,
	idColumn,
	updatedAtColumn,
} from "./shared";
import { videos } from "./videos";

export const courses = pgTable(
	"courses",
	{
		id: idColumn(),
		videoId: uuid("video_id")
			.notNull()
			.references(() => videos.id, { onDelete: "restrict" }),
		ownerId: text("owner_id"),
		title: text("title").notNull(),
		description: text("description"),
		visibility: courseVisibilityEnum("visibility").notNull().default("private"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
		deletedAt: deletedAtColumn(),
	},
	(table) => [
		index("courses_owner_idx").on(table.ownerId),
		index("courses_video_idx").on(table.videoId),
		index("courses_active_owner_idx")
			.on(table.ownerId)
			.where(sql`${table.deletedAt} is null`),
	],
);

export const videosRelations = relations(videos, ({ many }) => ({
	courses: many(courses),
}));

export const courseChapters = pgTable(
	"course_chapters",
	{
		id: idColumn(),
		courseId: uuid("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		summary: text("summary"),
		orderIndex: integer("order_index").notNull(),
		startSeconds: integer("start_seconds").notNull(),
		endSeconds: integer("end_seconds"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		index("course_chapters_course_idx").on(table.courseId),
		uniqueIndex("course_chapters_course_order_idx").on(
			table.courseId,
			table.orderIndex,
		),
	],
);

export const courseGenerationJobs = pgTable(
	"course_generation_jobs",
	{
		id: idColumn(),
		courseId: uuid("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		status: generationJobStatusEnum("status").notNull().default("queued"),
		transcriptSource: transcriptSourceEnum("transcript_source"),
		failureReason: text("failure_reason"),
		retryable: boolean("retryable").notNull().default(false),
		rawOutput: jsonb("raw_output").$type<Record<string, unknown>>(),
		startedAt: timestamp("started_at", { withTimezone: true }),
		metadataCompletedAt: timestamp("metadata_completed_at", {
			withTimezone: true,
		}),
		transcriptCompletedAt: timestamp("transcript_completed_at", {
			withTimezone: true,
		}),
		chaptersCompletedAt: timestamp("chapters_completed_at", {
			withTimezone: true,
		}),
		playerCompletedAt: timestamp("player_completed_at", {
			withTimezone: true,
		}),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		index("course_generation_jobs_course_idx").on(table.courseId),
		index("course_generation_jobs_status_idx").on(table.status),
	],
);

export const courseGenerationRateLimits = pgTable(
	"course_generation_rate_limits",
	{
		id: idColumn(),
		key: text("key").notNull(),
		keyType: text("key_type").notNull(),
		createdAt: createdAtColumn(),
	},
	(table) => [
		index("course_generation_rate_limits_key_created_idx").on(
			table.key,
			table.createdAt,
		),
		index("course_generation_rate_limits_created_idx").on(table.createdAt),
	],
);

export const chapterNotes = pgTable(
	"chapter_notes",
	{
		id: idColumn(),
		userId: text("user_id"),
		chapterId: uuid("chapter_id")
			.notNull()
			.references(() => courseChapters.id, { onDelete: "cascade" }),
		markdown: text("markdown").notNull().default(""),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		index("chapter_notes_chapter_idx").on(table.chapterId),
		unique("chapter_notes_user_chapter_unique")
			.on(table.userId, table.chapterId)
			.nullsNotDistinct(),
	],
);

export const courseProgress = pgTable(
	"course_progress",
	{
		id: idColumn(),
		userId: text("user_id"),
		courseId: uuid("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		resumeSeconds: integer("resume_seconds").notNull().default(0),
		completionPercent: doublePrecision("completion_percent")
			.notNull()
			.default(0),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		index("course_progress_course_idx").on(table.courseId),
		unique("course_progress_user_course_unique")
			.on(table.userId, table.courseId)
			.nullsNotDistinct(),
	],
);

export const chapterProgress = pgTable(
	"chapter_progress",
	{
		id: idColumn(),
		userId: text("user_id"),
		chapterId: uuid("chapter_id")
			.notNull()
			.references(() => courseChapters.id, { onDelete: "cascade" }),
		watchedSeconds: integer("watched_seconds").notNull().default(0),
		completed: boolean("completed").notNull().default(false),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		index("chapter_progress_chapter_idx").on(table.chapterId),
		unique("chapter_progress_user_chapter_unique")
			.on(table.userId, table.chapterId)
			.nullsNotDistinct(),
	],
);

export const bookmarks = pgTable(
	"bookmarks",
	{
		id: idColumn(),
		userId: text("user_id"),
		courseId: uuid("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		chapterId: uuid("chapter_id").references(() => courseChapters.id, {
			onDelete: "set null",
		}),
		timestampSeconds: integer("timestamp_seconds").notNull(),
		title: text("title"),
		note: text("note"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
		deletedAt: deletedAtColumn(),
	},
	(table) => [
		index("bookmarks_course_idx").on(table.courseId),
		index("bookmarks_user_idx").on(table.userId),
		index("bookmarks_active_course_idx")
			.on(table.courseId)
			.where(sql`${table.deletedAt} is null`),
	],
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
	video: one(videos, {
		fields: [courses.videoId],
		references: [videos.id],
	}),
	chapters: many(courseChapters),
	generationJobs: many(courseGenerationJobs),
	progress: many(courseProgress),
	bookmarks: many(bookmarks),
}));

export const courseChaptersRelations = relations(
	courseChapters,
	({ one, many }) => ({
		course: one(courses, {
			fields: [courseChapters.courseId],
			references: [courses.id],
		}),
		notes: many(chapterNotes),
		progress: many(chapterProgress),
		bookmarks: many(bookmarks),
	}),
);

export const courseGenerationJobsRelations = relations(
	courseGenerationJobs,
	({ one }) => ({
		course: one(courses, {
			fields: [courseGenerationJobs.courseId],
			references: [courses.id],
		}),
	}),
);

export const chapterNotesRelations = relations(chapterNotes, ({ one }) => ({
	chapter: one(courseChapters, {
		fields: [chapterNotes.chapterId],
		references: [courseChapters.id],
	}),
}));

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
	course: one(courses, {
		fields: [courseProgress.courseId],
		references: [courses.id],
	}),
}));

export const chapterProgressRelations = relations(
	chapterProgress,
	({ one }) => ({
		chapter: one(courseChapters, {
			fields: [chapterProgress.chapterId],
			references: [courseChapters.id],
		}),
	}),
);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
	course: one(courses, {
		fields: [bookmarks.courseId],
		references: [courses.id],
	}),
	chapter: one(courseChapters, {
		fields: [bookmarks.chapterId],
		references: [courseChapters.id],
	}),
}));
