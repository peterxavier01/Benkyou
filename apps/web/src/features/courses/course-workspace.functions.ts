import { getCurrentUserFromHeaders } from "@benkyou/auth/server";
import {
	createBookmarkRequestV1Schema,
	deleteBookmarkRequestV1Schema,
	deleteCourseRequestV1Schema,
	exportCourseMarkdownRequestV1Schema,
	formatCourseMarkdownExport,
	getCourseManagementDataRequestV1Schema,
	getCoursePlayerDataRequestV1Schema,
	getDefaultLearningPreferences,
	regenerateChaptersRequestV1Schema,
	updateBookmarkRequestV1Schema,
	updateChapterRequestV1Schema,
	updateCourseMetadataRequestV1Schema,
	updateLearningPreferencesRequestV1Schema,
	upsertChapterNoteRequestV1Schema,
	upsertChapterProgressRequestV1Schema,
	upsertCourseProgressRequestV1Schema,
	validateChapterTimeRange,
} from "@benkyou/core";
import {
	createBookmark as createBookmarkRecord,
	createRegenerationJob as createRegenerationJobRecord,
	deleteBookmark as deleteBookmarkRecord,
	getBookmarks as getBookmarkRecords,
	getCourseByChapter,
	getCourseLibrary as getCourseLibraryRecords,
	getCourseManagementData as getCourseManagementDataRecord,
	getCoursePlayerData as getCoursePlayerDataRecord,
	getLearningPreferences as getLearningPreferencesRecord,
	softDeleteCourse,
	updateBookmark as updateBookmarkRecord,
	updateChapter as updateChapterRecord,
	updateCourseMetadata as updateCourseMetadataRecord,
	upsertChapterNoteIfCurrent as upsertChapterNoteIfCurrentRecord,
	upsertChapterProgress as upsertChapterProgressRecord,
	upsertCourseProgress as upsertCourseProgressRecord,
	upsertLearningPreferences as upsertLearningPreferencesRecord,
} from "@benkyou/db";
import type {
	CreateBookmarkResponseV1,
	DeleteBookmarkResponseV1,
	DeleteCourseResponseV1,
	ExportCourseMarkdownResponseV1,
	GetBookmarksResponseV1,
	GetCourseLibraryResponseV1,
	GetCourseManagementDataResponseV1,
	GetCoursePlayerDataResponseV1,
	GetLearningPreferencesResponseV1,
	RegenerateChaptersResponseV1,
	UpdateBookmarkResponseV1,
	UpdateChapterResponseV1,
	UpdateCourseMetadataResponseV1,
	UpdateLearningPreferencesResponseV1,
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

export const getCourseManagementData = createServerFn({ method: "POST" })
	.inputValidator((input) =>
		getCourseManagementDataRequestV1Schema.parse(input),
	)
	.handler(async ({ data }): Promise<GetCourseManagementDataResponseV1> => {
		const ownerId = await getOptionalUserId();
		const managementData = await getCourseManagementDataRecord(
			data.courseId,
			ownerId,
		);

		if (!managementData) {
			throw new Error("Course was not found.");
		}

		return { data: managementData };
	});

export const updateCourseMetadata = createServerFn({ method: "POST" })
	.inputValidator((input) => updateCourseMetadataRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpdateCourseMetadataResponseV1> => {
		const ownerId = await getOptionalUserId();
		const course = await updateCourseMetadataRecord(data.courseId, ownerId, {
			title: data.title,
			description: data.description,
		});

		if (!course) {
			throw new Error("Course was not found.");
		}

		return { course };
	});

export const updateChapter = createServerFn({ method: "POST" })
	.inputValidator((input) => updateChapterRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpdateChapterResponseV1> => {
		const ownerId = await getOptionalUserId();
		const course = await getCourseByChapter(data.chapterId, ownerId);

		if (!course) {
			throw new Error("Chapter was not found.");
		}

		const managementData = await getCourseManagementDataRecord(
			course.id,
			ownerId,
		);

		if (!managementData) {
			throw new Error("Course was not found.");
		}

		const range = validateChapterTimeRange({
			chapterId: data.chapterId,
			startSeconds: data.startSeconds,
			endSeconds: data.endSeconds ?? null,
			videoDurationSeconds: managementData.video.durationSeconds,
			chapters: managementData.chapters.map((chapter) => ({
				chapterId: chapter.id,
				startSeconds: chapter.startSeconds,
				endSeconds: chapter.endSeconds,
			})),
		});

		if (!range.ok) {
			throw new Error(range.message);
		}

		const chapter = await updateChapterRecord(data.chapterId, ownerId, {
			title: data.title,
			summary: data.summary,
			startSeconds: data.startSeconds,
			endSeconds: data.endSeconds,
		});

		if (!chapter) {
			throw new Error("Chapter was not found.");
		}

		return { chapter };
	});

export const regenerateChapters = createServerFn({ method: "POST" })
	.inputValidator((input) => regenerateChaptersRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<RegenerateChaptersResponseV1> => {
		const ownerId = await getOptionalUserId();
		const job = await createRegenerationJobRecord(data.courseId, ownerId);

		if (!job) {
			throw new Error("Course was not found.");
		}

		return { courseId: job.course.id, generationJobId: job.job.id };
	});

export const exportCourseMarkdown = createServerFn({ method: "POST" })
	.inputValidator((input) => exportCourseMarkdownRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<ExportCourseMarkdownResponseV1> => {
		const ownerId = await getOptionalUserId();
		const playerData = await getCoursePlayerDataRecord(data.courseId, ownerId);

		if (!playerData || !canAccessCourse(playerData.course.ownerId, ownerId)) {
			throw new Error("Course was not found.");
		}

		return {
			filename: `${slugifyFilename(playerData.course.title)}.md`,
			markdown: formatCourseMarkdownExport(playerData),
		};
	});

export const getLearningPreferences = createServerFn({ method: "GET" }).handler(
	async (): Promise<GetLearningPreferencesResponseV1> => {
		const ownerId = await getOptionalUserId();

		if (!ownerId) {
			return { preferences: getDefaultLearningPreferences() };
		}

		const preferences = await getLearningPreferencesRecord(ownerId);

		return { preferences: preferences ?? getDefaultLearningPreferences() };
	},
);

export const updateLearningPreferences = createServerFn({ method: "POST" })
	.inputValidator((input) =>
		updateLearningPreferencesRequestV1Schema.parse(input),
	)
	.handler(async ({ data }): Promise<UpdateLearningPreferencesResponseV1> => {
		const ownerId = await getOptionalUserId();

		if (!ownerId) {
			return { preferences: data };
		}

		const preferences = await upsertLearningPreferencesRecord(ownerId, data);

		return { preferences };
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

function slugifyFilename(value: string) {
	const slug = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);

	return slug || "benkyou-course";
}
