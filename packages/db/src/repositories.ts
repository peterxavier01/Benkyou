import type {
	BookmarkDTO,
	ChapterNoteDTO,
	ChapterProgressDTO,
	CourseChapterDTO,
	CourseDTO,
	CourseGenerationJobDTO,
	CourseLibraryItemDTO,
	CoursePlayerDataDTO,
	CourseProgressDTO,
	VideoDTO,
	VideoProvider,
} from "@benkyou/types";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import { db } from "./drizzle";
import {
	bookmarks,
	chapterNotes,
	chapterProgress,
	courseChapters,
	courseGenerationJobs,
	courseProgress,
	courses,
	videos,
} from "./schema";

type UserId = string | null;

export interface UpsertVideoInput {
	sourceUrl: string;
	canonicalUrl?: string | null;
	title?: string | null;
	description?: string | null;
	thumbnailUrl?: string | null;
	channelName?: string | null;
	channelUrl?: string | null;
	durationSeconds?: number | null;
	transcriptSource?: "youtube_captions" | "manual" | "sample" | null;
	transcriptText?: string | null;
	rawMetadata?: Record<string, unknown> | null;
}

export interface GenerationJobWithContextDTO {
	job: CourseGenerationJobDTO;
	course: CourseDTO;
	video: VideoDTO;
}

export interface GenerationJobDetailRecordDTO
	extends GenerationJobWithContextDTO {
	chapterCount: number;
}

export interface CreateCourseFromUrlRecordInput extends UpsertVideoInput {
	ownerId: UserId;
	provider: VideoProvider;
	providerVideoId: string;
}

export interface CreateCourseFromUrlRecordResult
	extends GenerationJobWithContextDTO {
	reusedExistingCourse: boolean;
}

export interface GeneratedChapterRecordInput {
	title: string;
	summary?: string | null;
	orderIndex: number;
	startSeconds: number;
	endSeconds?: number | null;
}

export interface CompleteGenerationJobInput {
	jobId: string;
	title?: string | null;
	description?: string | null;
	transcriptSource: "youtube_captions" | "manual" | "sample";
	transcriptText?: string | null;
	rawOutput?: Record<string, unknown> | null;
	chapters: GeneratedChapterRecordInput[];
}

export interface FailGenerationJobInput {
	jobId: string;
	failureReason: string;
	retryable: boolean;
	rawOutput?: Record<string, unknown> | null;
}

export interface CreateBookmarkInput {
	userId: UserId;
	courseId: string;
	chapterId?: string | null;
	timestampSeconds: number;
	title?: string | null;
	note?: string | null;
}

export interface UpdateBookmarkInput {
	title?: string | null;
	note?: string | null;
	chapterId?: string | null;
	timestampSeconds?: number;
}

function toIso(value: Date | string | null): string | null {
	if (value === null) {
		return null;
	}

	return value instanceof Date ? value.toISOString() : value;
}

function userMatches(column: PgColumn, userId: UserId) {
	return userId === null ? isNull(column) : eq(column, userId);
}

function mapVideo(row: typeof videos.$inferSelect): VideoDTO {
	return {
		id: row.id,
		provider: row.provider,
		providerVideoId: row.providerVideoId,
		canonicalUrl: row.canonicalUrl ?? row.sourceUrl,
		title: row.title,
		channelTitle: row.channelName,
		thumbnailUrl: row.thumbnailUrl,
		durationSeconds: row.durationSeconds,
		createdAt: toIso(row.createdAt) ?? "",
		updatedAt: toIso(row.updatedAt) ?? "",
	};
}

function mapCourse(row: typeof courses.$inferSelect): CourseDTO {
	return {
		id: row.id,
		videoId: row.videoId,
		ownerId: row.ownerId,
		title: row.title,
		description: row.description,
		visibility: row.visibility,
		createdAt: toIso(row.createdAt) ?? "",
		updatedAt: toIso(row.updatedAt) ?? "",
		deletedAt: toIso(row.deletedAt),
	};
}

function mapChapter(row: typeof courseChapters.$inferSelect): CourseChapterDTO {
	return {
		id: row.id,
		courseId: row.courseId,
		title: row.title,
		summary: row.summary,
		orderIndex: row.orderIndex,
		startSeconds: row.startSeconds,
		endSeconds: row.endSeconds,
		createdAt: toIso(row.createdAt) ?? "",
		updatedAt: toIso(row.updatedAt) ?? "",
	};
}

function mapGenerationJob(
	row: typeof courseGenerationJobs.$inferSelect,
): CourseGenerationJobDTO {
	return {
		id: row.id,
		courseId: row.courseId,
		status: row.status,
		transcriptSource: row.transcriptSource,
		failureReason: row.failureReason,
		retryable: row.retryable,
		createdAt: toIso(row.createdAt) ?? "",
		updatedAt: toIso(row.updatedAt) ?? "",
		completedAt: toIso(row.completedAt),
	};
}

function mapCourseProgress(
	row: typeof courseProgress.$inferSelect,
): CourseProgressDTO {
	return {
		id: row.id,
		userId: row.userId,
		courseId: row.courseId,
		resumeSeconds: row.resumeSeconds,
		completionPercent: row.completionPercent,
		updatedAt: toIso(row.updatedAt) ?? "",
	};
}

function mapChapterProgress(
	row: typeof chapterProgress.$inferSelect,
): ChapterProgressDTO {
	return {
		id: row.id,
		userId: row.userId,
		chapterId: row.chapterId,
		watchedSeconds: row.watchedSeconds,
		completed: row.completed,
		updatedAt: toIso(row.updatedAt) ?? "",
	};
}

function mapNote(row: typeof chapterNotes.$inferSelect): ChapterNoteDTO {
	return {
		id: row.id,
		userId: row.userId,
		chapterId: row.chapterId,
		markdown: row.markdown,
		createdAt: toIso(row.createdAt) ?? "",
		updatedAt: toIso(row.updatedAt) ?? "",
	};
}

function mapBookmark(row: typeof bookmarks.$inferSelect): BookmarkDTO {
	return {
		id: row.id,
		userId: row.userId,
		courseId: row.courseId,
		chapterId: row.chapterId,
		timestampSeconds: row.timestampSeconds,
		title: row.title,
		note: row.note,
		createdAt: toIso(row.createdAt) ?? "",
		updatedAt: toIso(row.updatedAt) ?? "",
	};
}

export async function upsertVideoByProvider(
	provider: VideoProvider,
	providerVideoId: string,
	input: UpsertVideoInput,
): Promise<VideoDTO> {
	const [row] = await db
		.insert(videos)
		.values({
			provider,
			providerVideoId,
			sourceUrl: input.sourceUrl,
			canonicalUrl: input.canonicalUrl,
			title: input.title,
			description: input.description,
			thumbnailUrl: input.thumbnailUrl,
			channelName: input.channelName,
			channelUrl: input.channelUrl,
			durationSeconds: input.durationSeconds,
			transcriptSource: input.transcriptSource,
			transcriptText: input.transcriptText,
			rawMetadata: input.rawMetadata ?? undefined,
		})
		.onConflictDoUpdate({
			target: [videos.provider, videos.providerVideoId],
			set: {
				sourceUrl: input.sourceUrl,
				canonicalUrl: input.canonicalUrl,
				title: input.title,
				description: input.description,
				thumbnailUrl: input.thumbnailUrl,
				channelName: input.channelName,
				channelUrl: input.channelUrl,
				durationSeconds: input.durationSeconds,
				transcriptSource: input.transcriptSource,
				transcriptText: input.transcriptText,
				rawMetadata: input.rawMetadata ?? undefined,
				updatedAt: new Date(),
			},
		})
		.returning();

	return mapVideo(row);
}

export async function createCourseFromUrlRecord(
	input: CreateCourseFromUrlRecordInput,
): Promise<CreateCourseFromUrlRecordResult> {
	return db.transaction(async (tx) => {
		const [videoRow] = await tx
			.insert(videos)
			.values({
				provider: input.provider,
				providerVideoId: input.providerVideoId,
				sourceUrl: input.sourceUrl,
				canonicalUrl: input.canonicalUrl,
				title: input.title,
				description: input.description,
				thumbnailUrl: input.thumbnailUrl,
				channelName: input.channelName,
				channelUrl: input.channelUrl,
				durationSeconds: input.durationSeconds,
				transcriptSource: input.transcriptSource,
				transcriptText: input.transcriptText,
				rawMetadata: input.rawMetadata ?? undefined,
			})
			.onConflictDoUpdate({
				target: [videos.provider, videos.providerVideoId],
				set: {
					sourceUrl: input.sourceUrl,
					canonicalUrl: input.canonicalUrl,
					title: input.title,
					description: input.description,
					thumbnailUrl: input.thumbnailUrl,
					channelName: input.channelName,
					channelUrl: input.channelUrl,
					durationSeconds: input.durationSeconds,
					transcriptSource: input.transcriptSource,
					transcriptText: input.transcriptText,
					rawMetadata: input.rawMetadata ?? undefined,
					updatedAt: new Date(),
				},
			})
			.returning();

		const [existingCourse] = await tx
			.select()
			.from(courses)
			.where(
				and(
					eq(courses.videoId, videoRow.id),
					userMatches(courses.ownerId, input.ownerId),
					isNull(courses.deletedAt),
				),
			)
			.orderBy(desc(courses.updatedAt))
			.limit(1);

		const reusedExistingCourse = Boolean(existingCourse);
		const courseRow =
			existingCourse ??
			(
				await tx
					.insert(courses)
					.values({
						videoId: videoRow.id,
						ownerId: input.ownerId,
						title: input.title ?? `YouTube course ${input.providerVideoId}`,
						description: input.description,
						visibility: "private",
					})
					.returning()
			)[0];

		const [jobRow] = await tx
			.insert(courseGenerationJobs)
			.values({ courseId: courseRow.id, status: "queued" })
			.returning();

		return {
			job: mapGenerationJob(jobRow),
			course: mapCourse(courseRow),
			video: mapVideo(videoRow),
			reusedExistingCourse,
		};
	});
}

export async function getCoursePlayerData(
	courseId: string,
	userId: UserId,
): Promise<CoursePlayerDataDTO | null> {
	const [courseRow] = await db
		.select({ course: courses, video: videos })
		.from(courses)
		.innerJoin(videos, eq(courses.videoId, videos.id))
		.where(and(eq(courses.id, courseId), isNull(courses.deletedAt)))
		.limit(1);

	if (!courseRow) {
		return null;
	}

	const chapterRows = await db
		.select()
		.from(courseChapters)
		.where(eq(courseChapters.courseId, courseId))
		.orderBy(courseChapters.orderIndex);

	const chapterIds = chapterRows.map((chapter) => chapter.id);
	const [progressRow] = await db
		.select()
		.from(courseProgress)
		.where(
			and(
				eq(courseProgress.courseId, courseId),
				userMatches(courseProgress.userId, userId),
			),
		)
		.limit(1);

	const chapterProgressRows =
		chapterIds.length === 0
			? []
			: await db
					.select()
					.from(chapterProgress)
					.where(
						and(
							inArray(chapterProgress.chapterId, chapterIds),
							userMatches(chapterProgress.userId, userId),
						),
					);

	const noteRows =
		chapterIds.length === 0
			? []
			: await db
					.select()
					.from(chapterNotes)
					.where(
						and(
							inArray(chapterNotes.chapterId, chapterIds),
							userMatches(chapterNotes.userId, userId),
						),
					);

	const bookmarkRows = await db
		.select()
		.from(bookmarks)
		.where(
			and(
				eq(bookmarks.courseId, courseId),
				userMatches(bookmarks.userId, userId),
				isNull(bookmarks.deletedAt),
			),
		)
		.orderBy(bookmarks.timestampSeconds);

	return {
		course: mapCourse(courseRow.course),
		video: mapVideo(courseRow.video),
		chapters: chapterRows.map(mapChapter),
		progress: progressRow ? mapCourseProgress(progressRow) : null,
		chapterProgress: chapterProgressRows.map(mapChapterProgress),
		notes: noteRows.map(mapNote),
		bookmarks: bookmarkRows.map(mapBookmark),
	};
}

export async function getCourseByChapter(
	chapterId: string,
	userId: UserId,
): Promise<CourseDTO | null> {
	const [row] = await db
		.select({ course: courses })
		.from(courseChapters)
		.innerJoin(courses, eq(courseChapters.courseId, courses.id))
		.where(
			and(
				eq(courseChapters.id, chapterId),
				userMatches(courses.ownerId, userId),
				isNull(courses.deletedAt),
			),
		)
		.limit(1);

	return row ? mapCourse(row.course) : null;
}

export async function getCourseLibrary(
	userId: UserId,
): Promise<CourseLibraryItemDTO[]> {
	const courseRows = await db
		.select({ course: courses, video: videos })
		.from(courses)
		.innerJoin(videos, eq(courses.videoId, videos.id))
		.where(and(userMatches(courses.ownerId, userId), isNull(courses.deletedAt)))
		.orderBy(desc(courses.updatedAt));

	return Promise.all(
		courseRows.map(async ({ course, video }) => {
			const [chapterCountRow] = await db
				.select({ value: count() })
				.from(courseChapters)
				.where(eq(courseChapters.courseId, course.id));

			const [progressRow] = await db
				.select()
				.from(courseProgress)
				.where(
					and(
						eq(courseProgress.courseId, course.id),
						userMatches(courseProgress.userId, userId),
					),
				)
				.limit(1);

			const [jobRow] = await db
				.select()
				.from(courseGenerationJobs)
				.where(eq(courseGenerationJobs.courseId, course.id))
				.orderBy(desc(courseGenerationJobs.createdAt))
				.limit(1);

			return {
				course: mapCourse(course),
				video: mapVideo(video),
				chapterCount: chapterCountRow?.value ?? 0,
				progress: progressRow ? mapCourseProgress(progressRow) : null,
				latestGenerationJob: jobRow ? mapGenerationJob(jobRow) : null,
			};
		}),
	);
}

export async function getGenerationJob(
	jobId: string,
): Promise<GenerationJobWithContextDTO | null> {
	const [row] = await db
		.select({ job: courseGenerationJobs, course: courses, video: videos })
		.from(courseGenerationJobs)
		.innerJoin(courses, eq(courseGenerationJobs.courseId, courses.id))
		.innerJoin(videos, eq(courses.videoId, videos.id))
		.where(and(eq(courseGenerationJobs.id, jobId), isNull(courses.deletedAt)))
		.limit(1);

	if (!row) {
		return null;
	}

	return {
		job: mapGenerationJob(row.job),
		course: mapCourse(row.course),
		video: mapVideo(row.video),
	};
}

export async function getGenerationJobDetailRecord(
	jobId: string,
): Promise<GenerationJobDetailRecordDTO | null> {
	const detail = await getGenerationJob(jobId);

	if (!detail) {
		return null;
	}

	const [chapterCountRow] = await db
		.select({ value: count() })
		.from(courseChapters)
		.where(eq(courseChapters.courseId, detail.course.id));

	return {
		...detail,
		chapterCount: chapterCountRow?.value ?? 0,
	};
}

export async function claimGenerationJob(
	jobId: string,
): Promise<GenerationJobWithContextDTO | null> {
	const [jobRow] = await db
		.update(courseGenerationJobs)
		.set({
			status: "processing",
			startedAt: new Date(),
			failureReason: null,
			retryable: false,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(courseGenerationJobs.id, jobId),
				eq(courseGenerationJobs.status, "queued"),
			),
		)
		.returning();

	if (!jobRow) {
		return null;
	}

	return getGenerationJob(jobRow.id);
}

export async function completeGenerationJob(
	input: CompleteGenerationJobInput,
): Promise<GenerationJobDetailRecordDTO | null> {
	return db.transaction(async (tx) => {
		const [row] = await tx
			.select({ job: courseGenerationJobs, course: courses, video: videos })
			.from(courseGenerationJobs)
			.innerJoin(courses, eq(courseGenerationJobs.courseId, courses.id))
			.innerJoin(videos, eq(courses.videoId, videos.id))
			.where(
				and(
					eq(courseGenerationJobs.id, input.jobId),
					isNull(courses.deletedAt),
				),
			)
			.limit(1);

		if (!row) {
			return null;
		}

		await tx
			.delete(courseChapters)
			.where(eq(courseChapters.courseId, row.course.id));

		if (input.chapters.length > 0) {
			await tx.insert(courseChapters).values(
				input.chapters.map((chapter) => ({
					courseId: row.course.id,
					title: chapter.title,
					summary: chapter.summary,
					orderIndex: chapter.orderIndex,
					startSeconds: chapter.startSeconds,
					endSeconds: chapter.endSeconds,
				})),
			);
		}

		const completedAt = new Date();
		const [courseRow] = await tx
			.update(courses)
			.set({
				title: input.title ?? row.course.title,
				description: input.description ?? row.course.description,
				updatedAt: completedAt,
			})
			.where(eq(courses.id, row.course.id))
			.returning();

		const [videoRow] = await tx
			.update(videos)
			.set({
				transcriptSource: input.transcriptSource,
				transcriptText: input.transcriptText,
				updatedAt: completedAt,
			})
			.where(eq(videos.id, row.video.id))
			.returning();

		const [jobRow] = await tx
			.update(courseGenerationJobs)
			.set({
				status: "completed",
				transcriptSource: input.transcriptSource,
				failureReason: null,
				retryable: false,
				rawOutput: input.rawOutput ?? undefined,
				completedAt,
				updatedAt: completedAt,
			})
			.where(eq(courseGenerationJobs.id, input.jobId))
			.returning();

		return {
			job: mapGenerationJob(jobRow),
			course: mapCourse(courseRow),
			video: mapVideo(videoRow),
			chapterCount: input.chapters.length,
		};
	});
}

export async function failGenerationJob(
	input: FailGenerationJobInput,
): Promise<GenerationJobDetailRecordDTO | null> {
	const [jobRow] = await db
		.update(courseGenerationJobs)
		.set({
			status: "failed",
			failureReason: input.failureReason,
			retryable: input.retryable,
			rawOutput: input.rawOutput ?? undefined,
			completedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(courseGenerationJobs.id, input.jobId))
		.returning();

	return jobRow ? getGenerationJobDetailRecord(jobRow.id) : null;
}

export async function createRetryGenerationJob(
	failedJobId: string,
	ownerId: UserId,
): Promise<GenerationJobWithContextDTO | null> {
	const [row] = await db
		.select({ job: courseGenerationJobs, course: courses })
		.from(courseGenerationJobs)
		.innerJoin(courses, eq(courseGenerationJobs.courseId, courses.id))
		.where(
			and(
				eq(courseGenerationJobs.id, failedJobId),
				eq(courseGenerationJobs.status, "failed"),
				eq(courseGenerationJobs.retryable, true),
				userMatches(courses.ownerId, ownerId),
				isNull(courses.deletedAt),
			),
		)
		.limit(1);

	if (!row) {
		return null;
	}

	const [jobRow] = await db
		.insert(courseGenerationJobs)
		.values({ courseId: row.course.id, status: "queued" })
		.returning();

	return getGenerationJob(jobRow.id);
}

export async function getSampleCourse(): Promise<CourseDTO | null> {
	const [row] = await db
		.select({ course: courses })
		.from(courses)
		.innerJoin(videos, eq(courses.videoId, videos.id))
		.where(
			and(
				eq(videos.provider, "youtube"),
				eq(videos.providerVideoId, "benkyou-sample-course"),
				isNull(courses.ownerId),
				isNull(courses.deletedAt),
			),
		)
		.limit(1);

	return row ? mapCourse(row.course) : null;
}

export async function softDeleteCourse(
	courseId: string,
	userId: UserId,
): Promise<boolean> {
	const deletedAt = new Date();
	const rows = await db
		.update(courses)
		.set({ deletedAt, updatedAt: deletedAt })
		.where(
			and(
				eq(courses.id, courseId),
				userMatches(courses.ownerId, userId),
				isNull(courses.deletedAt),
			),
		)
		.returning({ id: courses.id });

	return rows.length > 0;
}

export async function upsertCourseProgress(
	userId: UserId,
	courseId: string,
	input: { resumeSeconds: number; completionPercent: number },
): Promise<CourseProgressDTO> {
	const [row] = await db
		.insert(courseProgress)
		.values({
			userId,
			courseId,
			resumeSeconds: input.resumeSeconds,
			completionPercent: input.completionPercent,
		})
		.onConflictDoUpdate({
			target: [courseProgress.userId, courseProgress.courseId],
			set: {
				resumeSeconds: input.resumeSeconds,
				completionPercent: input.completionPercent,
				updatedAt: new Date(),
			},
		})
		.returning();

	return mapCourseProgress(row);
}

export async function upsertChapterProgress(
	userId: UserId,
	chapterId: string,
	input: { watchedSeconds: number; completed: boolean },
): Promise<ChapterProgressDTO> {
	const [row] = await db
		.insert(chapterProgress)
		.values({
			userId,
			chapterId,
			watchedSeconds: input.watchedSeconds,
			completed: input.completed,
		})
		.onConflictDoUpdate({
			target: [chapterProgress.userId, chapterProgress.chapterId],
			set: {
				watchedSeconds: input.watchedSeconds,
				completed: input.completed,
				updatedAt: new Date(),
			},
		})
		.returning();

	return mapChapterProgress(row);
}

export async function upsertChapterNote(
	userId: UserId,
	chapterId: string,
	markdown: string,
): Promise<ChapterNoteDTO> {
	const [row] = await db
		.insert(chapterNotes)
		.values({ userId, chapterId, markdown })
		.onConflictDoUpdate({
			target: [chapterNotes.userId, chapterNotes.chapterId],
			set: {
				markdown,
				updatedAt: new Date(),
			},
		})
		.returning();

	return mapNote(row);
}

export async function createBookmark(
	input: CreateBookmarkInput,
): Promise<BookmarkDTO> {
	const [row] = await db.insert(bookmarks).values(input).returning();

	return mapBookmark(row);
}

export async function updateBookmark(
	bookmarkId: string,
	userId: UserId,
	input: UpdateBookmarkInput,
): Promise<BookmarkDTO | null> {
	const [row] = await db
		.update(bookmarks)
		.set({ ...input, updatedAt: new Date() })
		.where(
			and(
				eq(bookmarks.id, bookmarkId),
				userMatches(bookmarks.userId, userId),
				isNull(bookmarks.deletedAt),
			),
		)
		.returning();

	return row ? mapBookmark(row) : null;
}

export async function deleteBookmark(
	bookmarkId: string,
	userId: UserId,
): Promise<boolean> {
	const deletedAt = new Date();
	const rows = await db
		.update(bookmarks)
		.set({ deletedAt, updatedAt: deletedAt })
		.where(
			and(
				eq(bookmarks.id, bookmarkId),
				userMatches(bookmarks.userId, userId),
				isNull(bookmarks.deletedAt),
			),
		)
		.returning({ id: bookmarks.id });

	return rows.length > 0;
}
