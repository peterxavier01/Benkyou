import { getCurrentUserFromHeaders } from "@benkyou/auth/server";
import {
	createBookmarkRequestV1Schema,
	deleteBookmarkRequestV1Schema,
	deleteCourseRequestV1Schema,
	getCoursePlayerDataRequestV1Schema,
	updateBookmarkRequestV1Schema,
	upsertChapterNoteRequestV1Schema,
	upsertChapterProgressRequestV1Schema,
	upsertCourseProgressRequestV1Schema,
} from "@benkyou/core";
import {
	createBookmark as createBookmarkRecord,
	deleteBookmark as deleteBookmarkRecord,
	getBookmarks as getBookmarkRecords,
	getCourseByChapter,
	getCourseLibrary as getCourseLibraryRecords,
	getCoursePlayerData as getCoursePlayerDataRecord,
	softDeleteCourse,
	updateBookmark as updateBookmarkRecord,
	upsertChapterNoteIfCurrent as upsertChapterNoteIfCurrentRecord,
	upsertChapterProgress as upsertChapterProgressRecord,
	upsertCourseProgress as upsertCourseProgressRecord,
} from "@benkyou/db";
import type {
	CreateBookmarkResponseV1,
	DeleteBookmarkResponseV1,
	DeleteCourseResponseV1,
	GetBookmarksResponseV1,
	GetCourseLibraryResponseV1,
	GetCoursePlayerDataResponseV1,
	UpdateBookmarkResponseV1,
	UpsertChapterNoteResponseV1,
	UpsertChapterProgressResponseV1,
	UpsertCourseProgressResponseV1,
} from "@benkyou/types";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const getCourseLibrary = createServerFn({ method: "GET" }).handler(
	async (): Promise<GetCourseLibraryResponseV1> => {
		const ownerId = await getOptionalUserId();
		const items = await getCourseLibraryRecords(ownerId);

		return { items };
	},
);

export const getBookmarks = createServerFn({ method: "GET" }).handler(
	async (): Promise<GetBookmarksResponseV1> => {
		const ownerId = await getOptionalUserId();
		const items = await getBookmarkRecords(ownerId);

		return { items };
	},
);

export const getCoursePlayerData = createServerFn({ method: "POST" })
	.inputValidator((input) => getCoursePlayerDataRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<GetCoursePlayerDataResponseV1> => {
		const ownerId = await getOptionalUserId();
		const playerData = await getCoursePlayerDataRecord(data.courseId, ownerId);

		if (!playerData || !canAccessCourse(playerData.course.ownerId, ownerId)) {
			throw new Error("Course was not found.");
		}

		return { data: playerData };
	});

export const upsertCourseProgress = createServerFn({ method: "POST" })
	.inputValidator((input) => upsertCourseProgressRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpsertCourseProgressResponseV1> => {
		const ownerId = await getOptionalUserId();
		const playerData = await getCoursePlayerDataRecord(data.courseId, ownerId);

		if (!playerData || !canAccessCourse(playerData.course.ownerId, ownerId)) {
			throw new Error("Course was not found.");
		}

		const progress = await upsertCourseProgressRecord(ownerId, data.courseId, {
			resumeSeconds: data.resumeSeconds,
			completionPercent: data.completionPercent,
		});

		return { progress };
	});

export const upsertChapterProgress = createServerFn({ method: "POST" })
	.inputValidator((input) => upsertChapterProgressRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpsertChapterProgressResponseV1> => {
		const ownerId = await getOptionalUserId();
		const course =
			(await getCourseByChapter(data.chapterId, ownerId)) ??
			(ownerId ? await getCourseByChapter(data.chapterId, null) : null);

		if (!course) {
			throw new Error("Chapter was not found.");
		}

		const progress = await upsertChapterProgressRecord(
			ownerId,
			data.chapterId,
			{
				watchedSeconds: data.watchedSeconds,
				completed: data.completed,
			},
		);

		return { progress };
	});

export const upsertChapterNote = createServerFn({ method: "POST" })
	.inputValidator((input) => upsertChapterNoteRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpsertChapterNoteResponseV1> => {
		const ownerId = await getOptionalUserId();
		const course =
			(await getCourseByChapter(data.chapterId, ownerId)) ??
			(ownerId ? await getCourseByChapter(data.chapterId, null) : null);

		if (!course) {
			throw new Error("Chapter was not found.");
		}

		const note = await upsertChapterNoteIfCurrentRecord({
			userId: ownerId,
			chapterId: data.chapterId,
			markdown: data.markdown,
			expectedUpdatedAt: data.expectedUpdatedAt,
		});

		if (!note) {
			throw new Error(
				"Notes changed in another session. Copy your draft before reloading.",
			);
		}

		return { note };
	});

export const createBookmark = createServerFn({ method: "POST" })
	.inputValidator((input) => createBookmarkRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<CreateBookmarkResponseV1> => {
		const ownerId = await getOptionalUserId();
		const playerData = await getCoursePlayerDataRecord(data.courseId, ownerId);

		if (!playerData || !canAccessCourse(playerData.course.ownerId, ownerId)) {
			throw new Error("Course was not found.");
		}

		const chapter = findChapterAtTime(
			playerData.chapters,
			data.timestampSeconds,
		);
		const bookmark = await createBookmarkRecord({
			userId: ownerId,
			courseId: data.courseId,
			chapterId: chapter?.id ?? null,
			timestampSeconds: data.timestampSeconds,
			title: normalizeOptionalText(data.title),
			note: normalizeOptionalText(data.note),
		});

		return { bookmark };
	});

export const updateBookmark = createServerFn({ method: "POST" })
	.inputValidator((input) => updateBookmarkRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpdateBookmarkResponseV1> => {
		const ownerId = await getOptionalUserId();
		const bookmark = await updateBookmarkRecord(data.bookmarkId, ownerId, {
			title: normalizeOptionalText(data.title),
			note: normalizeOptionalText(data.note),
		});

		if (!bookmark) {
			throw new Error("Bookmark was not found.");
		}

		return { bookmark };
	});

export const deleteBookmark = createServerFn({ method: "POST" })
	.inputValidator((input) => deleteBookmarkRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<DeleteBookmarkResponseV1> => {
		const ownerId = await getOptionalUserId();
		const deleted = await deleteBookmarkRecord(data.bookmarkId, ownerId);

		return { deleted };
	});

export const deleteCourse = createServerFn({ method: "POST" })
	.inputValidator((input) => deleteCourseRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<DeleteCourseResponseV1> => {
		const ownerId = await getOptionalUserId();
		const deleted = await softDeleteCourse(data.courseId, ownerId);

		return { deleted };
	});

async function getOptionalUserId() {
	const user = await getCurrentUserFromHeaders(
		new Headers(getRequestHeaders()),
	);

	return user?.id ?? null;
}

function canAccessCourse(courseOwnerId: string | null, userId: string | null) {
	return courseOwnerId === userId || courseOwnerId === null;
}

function findChapterAtTime(
	chapters: Array<{
		id: string;
		startSeconds: number;
		endSeconds: number | null;
	}>,
	seconds: number,
) {
	return (
		chapters.find((chapter, index) => {
			const nextChapter = chapters[index + 1];
			const endSeconds =
				chapter.endSeconds ?? nextChapter?.startSeconds ?? Infinity;

			return seconds >= chapter.startSeconds && seconds < endSeconds;
		}) ?? null
	);
}

function normalizeOptionalText(value: string | null | undefined) {
	const trimmed = value?.trim();

	return trimmed ? trimmed : null;
}
