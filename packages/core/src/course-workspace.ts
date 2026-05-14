import type {
	CreateBookmarkRequestV1,
	DeleteBookmarkRequestV1,
	DeleteCourseRequestV1,
	GetCoursePlayerDataRequestV1,
	UpdateBookmarkRequestV1,
	UpsertChapterNoteRequestV1,
	UpsertChapterProgressRequestV1,
	UpsertCourseProgressRequestV1,
} from "@benkyou/types";
import { z } from "zod";
import {
	MAX_BOOKMARK_NOTE_LENGTH,
	MAX_BOOKMARK_TITLE_LENGTH,
	MAX_NOTE_MARKDOWN_LENGTH,
} from "./constants";

export const courseIdRequestV1Schema = z.object({
	courseId: z.uuid("Course id is invalid."),
});

export const getCoursePlayerDataRequestV1Schema =
	courseIdRequestV1Schema satisfies z.ZodType<GetCoursePlayerDataRequestV1>;

export const deleteCourseRequestV1Schema =
	courseIdRequestV1Schema satisfies z.ZodType<DeleteCourseRequestV1>;

export const upsertCourseProgressRequestV1Schema = z.object({
	courseId: z.uuid("Course id is invalid."),
	resumeSeconds: z.number().int().nonnegative(),
	completionPercent: z.number().min(0).max(100),
}) satisfies z.ZodType<UpsertCourseProgressRequestV1>;

export const upsertChapterProgressRequestV1Schema = z.object({
	chapterId: z.uuid("Chapter id is invalid."),
	watchedSeconds: z.number().int().nonnegative(),
	completed: z.boolean(),
}) satisfies z.ZodType<UpsertChapterProgressRequestV1>;

export const upsertChapterNoteRequestV1Schema = z.object({
	chapterId: z.uuid("Chapter id is invalid."),
	markdown: z
		.string()
		.max(MAX_NOTE_MARKDOWN_LENGTH, "Note is too long to save."),
	expectedUpdatedAt: z.iso.datetime().nullable(),
}) satisfies z.ZodType<UpsertChapterNoteRequestV1>;

const optionalBookmarkTitleSchema = z
	.string()
	.max(MAX_BOOKMARK_TITLE_LENGTH, "Bookmark title is too long.")
	.nullish();

const optionalBookmarkNoteSchema = z
	.string()
	.max(MAX_BOOKMARK_NOTE_LENGTH, "Bookmark note is too long.")
	.nullish();

export const createBookmarkRequestV1Schema = z.object({
	courseId: z.uuid("Course id is invalid."),
	timestampSeconds: z.number().int().nonnegative(),
	title: optionalBookmarkTitleSchema,
	note: optionalBookmarkNoteSchema,
}) satisfies z.ZodType<CreateBookmarkRequestV1>;

export const updateBookmarkRequestV1Schema = z.object({
	bookmarkId: z.uuid("Bookmark id is invalid."),
	title: optionalBookmarkTitleSchema,
	note: optionalBookmarkNoteSchema,
}) satisfies z.ZodType<UpdateBookmarkRequestV1>;

export const deleteBookmarkRequestV1Schema = z.object({
	bookmarkId: z.uuid("Bookmark id is invalid."),
}) satisfies z.ZodType<DeleteBookmarkRequestV1>;
