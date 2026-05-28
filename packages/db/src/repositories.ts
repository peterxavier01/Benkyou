import type {
	BookmarkDTO,
	BookmarkListItemDTO,
	ChapterNoteDTO,
	ChapterProgressDTO,
	CourseChapterDTO,
	CourseDTO,
	CourseGenerationJobDTO,
	CourseLibraryItemDTO,
	CourseManagementDataDTO,
	CoursePlayerDataDTO,
	CourseProgressDTO,
	LearningPreferencesDTO,
	TranscriptSource,
	VideoDTO,
	VideoProvider,
} from "@benkyou/types";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	inArray,
	isNull,
	or,
	sql,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import { db } from "./drizzle";
import {
	bookmarks,
	chapterNotes,
	chapterProgress,
	courseChapters,
	courseGenerationJobs,
	courseGenerationRateLimits,
	courseProgress,
	courses,
	learningPreferences,
	videos,
} from "./schema";

type UserId = string | null;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface VideoGenerationContextDTO extends VideoDTO {
	description: string | null;
	transcriptSource: TranscriptSource | null;
	transcriptText: string | null;
	rawMetadata: Record<string, unknown> | null;
}

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
	video: VideoGenerationContextDTO;
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
	transcriptSource?: "youtube_captions" | "manual" | "sample" | null;
	transcriptText?: string | null;
	durationSeconds?: number | null;
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

export interface UpdateCourseMetadataInput {
	title: string;
	description?: string | null;
}

export interface UpdateChapterInput {
	title: string;
	summary?: string | null;
	startSeconds: number;
	endSeconds?: number | null;
}

export type GenerationRateLimitKeyType = "user" | "ip" | "anonymous";

export interface ConsumeGenerationRateLimitInput {
	key: string;
	keyType: GenerationRateLimitKeyType;
	limit: number;
	windowMs: number;
	now?: Date;
}

export interface GenerationRateLimitResult {
	allowed: boolean;
	limit: number;
	remaining: number;
	resetAt: string;
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

function accessibleCourseOwner(column: PgColumn, userId: UserId) {
	return userId === null
		? isNull(column)
		: or(eq(column, userId), isNull(column));
}

export async function consumeCourseGenerationRateLimit(
	input: ConsumeGenerationRateLimitInput,
): Promise<GenerationRateLimitResult> {
	const now = input.now ?? new Date();
	const windowStart = new Date(now.getTime() - input.windowMs);

	return db.transaction(async (tx) => {
		const [usage] = await tx
			.select({ value: count() })
			.from(courseGenerationRateLimits)
			.where(
				and(
					eq(courseGenerationRateLimits.key, input.key),
					gte(courseGenerationRateLimits.createdAt, windowStart),
				),
			);
		const used = usage?.value ?? 0;
		const [oldestEvent] = await tx
			.select({ createdAt: courseGenerationRateLimits.createdAt })
			.from(courseGenerationRateLimits)
			.where(
				and(
					eq(courseGenerationRateLimits.key, input.key),
					gte(courseGenerationRateLimits.createdAt, windowStart),
				),
			)
			.orderBy(asc(courseGenerationRateLimits.createdAt))
			.limit(1);
		const resetAt = oldestEvent?.createdAt
			? new Date(oldestEvent.createdAt.getTime() + input.windowMs)
			: new Date(now.getTime() + input.windowMs);

		if (used >= input.limit) {
			return {
				allowed: false,
				limit: input.limit,
				remaining: 0,
				resetAt: resetAt.toISOString(),
			};
		}

		await tx.insert(courseGenerationRateLimits).values({
			key: input.key,
			keyType: input.keyType,
			createdAt: now,
		});

		return {
			allowed: true,
			limit: input.limit,
			remaining: Math.max(input.limit - used - 1, 0),
			resetAt: resetAt.toISOString(),
		};
	});
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

function mapVideoGenerationContext(
	row: typeof videos.$inferSelect,
): VideoGenerationContextDTO {
	return {
		...mapVideo(row),
		description: row.description,
		transcriptSource: row.transcriptSource,
		transcriptText: row.transcriptText,
		rawMetadata: row.rawMetadata ?? null,
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
		startedAt: toIso(row.startedAt),
		metadataCompletedAt: toIso(row.metadataCompletedAt),
		transcriptCompletedAt: toIso(row.transcriptCompletedAt),
		chaptersCompletedAt: toIso(row.chaptersCompletedAt),
		playerCompletedAt: toIso(row.playerCompletedAt),
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

function mapLearningPreferences(
	row: typeof learningPreferences.$inferSelect,
): LearningPreferencesDTO {
	return {
		playbackSpeed: row.playbackSpeed,
		manualCompletionOnly: row.manualCompletionOnly,
		autoplayNextChapter: row.autoplayNextChapter,
	};
}

export async function upsertVideoByProvider(
	provider: VideoProvider,
	providerVideoId: string,
	input: UpsertVideoInput,
): Promise<VideoDTO> {
	const transcriptUpdate = getTranscriptUpdate(input);
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
				rawMetadata: input.rawMetadata ?? undefined,
				...transcriptUpdate,
				updatedAt: new Date(),
			},
		})
		.returning();

	return mapVideo(row);
}

export async function getExistingCourseByProviderVideo(
	provider: VideoProvider,
	providerVideoId: string,
	ownerId: UserId,
): Promise<CourseDTO | null> {
	const [row] = await db
		.select({ course: courses })
		.from(courses)
		.innerJoin(videos, eq(courses.videoId, videos.id))
		.where(
			and(
				eq(videos.provider, provider),
				eq(videos.providerVideoId, providerVideoId),
				userMatches(courses.ownerId, ownerId),
				isNull(courses.deletedAt),
			),
		)
		.orderBy(desc(courses.updatedAt))
		.limit(1);

	return row ? mapCourse(row.course) : null;
}

export async function createCourseFromUrlRecord(
	input: CreateCourseFromUrlRecordInput,
): Promise<CreateCourseFromUrlRecordResult> {
	return db.transaction(async (tx) => {
		const transcriptUpdate = getTranscriptUpdate(input);
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
					rawMetadata: input.rawMetadata ?? undefined,
					...transcriptUpdate,
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
			video: mapVideoGenerationContext(videoRow),
			reusedExistingCourse,
		};
	});
}

function getTranscriptUpdate(input: {
	transcriptSource?: TranscriptSource | null;
	transcriptText?: string | null;
}): Partial<typeof videos.$inferInsert> {
	return {
		...(input.transcriptSource !== undefined
			? { transcriptSource: input.transcriptSource }
			: {}),
		...(input.transcriptText !== undefined
			? { transcriptText: input.transcriptText }
			: {}),
	};
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

	const [latestGenerationJobRow] = await db
		.select()
		.from(courseGenerationJobs)
		.where(eq(courseGenerationJobs.courseId, courseId))
		.orderBy(desc(courseGenerationJobs.createdAt))
		.limit(1);

	return {
		course: mapCourse(courseRow.course),
		video: mapVideo(courseRow.video),
		chapters: chapterRows.map(mapChapter),
		progress: progressRow ? mapCourseProgress(progressRow) : null,
		chapterProgress: chapterProgressRows.map(mapChapterProgress),
		notes: noteRows.map(mapNote),
		bookmarks: bookmarkRows.map(mapBookmark),
		latestGenerationJob: latestGenerationJobRow
			? mapGenerationJob(latestGenerationJobRow)
			: null,
	};
}

export async function getCourseManagementData(
	courseId: string,
	userId: UserId,
): Promise<CourseManagementDataDTO | null> {
	const [courseRow] = await db
		.select({ course: courses, video: videos })
		.from(courses)
		.innerJoin(videos, eq(courses.videoId, videos.id))
		.where(
			and(
				eq(courses.id, courseId),
				userMatches(courses.ownerId, userId),
				isNull(courses.deletedAt),
			),
		)
		.limit(1);

	if (!courseRow) {
		return null;
	}

	const chapterRows = await db
		.select()
		.from(courseChapters)
		.where(eq(courseChapters.courseId, courseId))
		.orderBy(courseChapters.orderIndex);

	const [latestGenerationJobRow] = await db
		.select()
		.from(courseGenerationJobs)
		.where(eq(courseGenerationJobs.courseId, courseId))
		.orderBy(desc(courseGenerationJobs.createdAt))
		.limit(1);

	return {
		course: mapCourse(courseRow.course),
		video: mapVideo(courseRow.video),
		chapters: chapterRows.map(mapChapter),
		latestGenerationJob: latestGenerationJobRow
			? mapGenerationJob(latestGenerationJobRow)
			: null,
	};
}

export async function updateCourseMetadata(
	courseId: string,
	userId: UserId,
	input: UpdateCourseMetadataInput,
): Promise<CourseDTO | null> {
	const now = new Date();
	const [row] = await db
		.update(courses)
		.set({
			title: input.title,
			description: input.description ?? null,
			updatedAt: now,
		})
		.where(
			and(
				eq(courses.id, courseId),
				userMatches(courses.ownerId, userId),
				isNull(courses.deletedAt),
			),
		)
		.returning();

	return row ? mapCourse(row) : null;
}

export async function updateChapter(
	chapterId: string,
	userId: UserId,
	input: UpdateChapterInput,
): Promise<CourseChapterDTO | null> {
	const [row] = await db
		.update(courseChapters)
		.set({
			title: input.title,
			summary: input.summary ?? null,
			startSeconds: input.startSeconds,
			endSeconds: input.endSeconds ?? null,
			updatedAt: new Date(),
		})
		.from(courses)
		.where(
			and(
				eq(courseChapters.id, chapterId),
				eq(courseChapters.courseId, courses.id),
				userMatches(courses.ownerId, userId),
				isNull(courses.deletedAt),
			),
		)
		.returning();

	return row ? mapChapter(row) : null;
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

export async function getBookmarks(
	userId: UserId,
): Promise<BookmarkListItemDTO[]> {
	const rows = await db
		.select({
			bookmark: bookmarks,
			course: courses,
			video: videos,
			chapter: courseChapters,
		})
		.from(bookmarks)
		.innerJoin(courses, eq(bookmarks.courseId, courses.id))
		.innerJoin(videos, eq(courses.videoId, videos.id))
		.leftJoin(courseChapters, eq(bookmarks.chapterId, courseChapters.id))
		.where(
			and(
				userMatches(bookmarks.userId, userId),
				accessibleCourseOwner(courses.ownerId, userId),
				isNull(bookmarks.deletedAt),
				isNull(courses.deletedAt),
			),
		)
		.orderBy(desc(bookmarks.updatedAt));

	return rows.map((row) => ({
		bookmark: mapBookmark(row.bookmark),
		course: mapCourse(row.course),
		video: mapVideo(row.video),
		chapter: row.chapter ? mapChapter(row.chapter) : null,
	}));
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
		video: mapVideoGenerationContext(row.video),
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

export async function timeoutGenerationJob(
	jobId: string,
	timeoutMs: number,
	now = new Date(),
): Promise<GenerationJobDetailRecordDTO | null> {
	const [row] = await db
		.select({ job: courseGenerationJobs, course: courses })
		.from(courseGenerationJobs)
		.innerJoin(courses, eq(courseGenerationJobs.courseId, courses.id))
		.where(
			and(
				eq(courseGenerationJobs.id, jobId),
				inArray(courseGenerationJobs.status, ["queued", "processing"]),
				isNull(courses.deletedAt),
			),
		)
		.limit(1);

	if (!row) {
		return null;
	}

	const timeoutAt = new Date(now.getTime() - timeoutMs);
	const referenceDate =
		row.job.status === "processing"
			? (row.job.startedAt ?? row.job.updatedAt ?? row.job.createdAt)
			: row.job.createdAt;

	if (!referenceDate || referenceDate > timeoutAt) {
		return null;
	}

	const [jobRow] = await db
		.update(courseGenerationJobs)
		.set({
			status: "failed",
			failureReason:
				"Course generation timed out before chapters could be saved.",
			retryable: true,
			completedAt: now,
			updatedAt: now,
		})
		.where(
			and(
				eq(courseGenerationJobs.id, jobId),
				inArray(courseGenerationJobs.status, ["queued", "processing"]),
			),
		)
		.returning();

	return jobRow ? getGenerationJobDetailRecord(jobRow.id) : null;
}

export async function cancelGenerationJob(
	jobId: string,
	ownerId: UserId,
): Promise<GenerationJobDetailRecordDTO | null> {
	const now = new Date();
	const [jobRow] = await db
		.update(courseGenerationJobs)
		.set({
			status: "cancelled",
			failureReason: "Course generation was cancelled.",
			retryable: true,
			completedAt: now,
			updatedAt: now,
		})
		.from(courses)
		.where(
			and(
				eq(courseGenerationJobs.id, jobId),
				eq(courseGenerationJobs.courseId, courses.id),
				userMatches(courses.ownerId, ownerId),
				isNull(courses.deletedAt),
				inArray(courseGenerationJobs.status, ["queued", "processing"]),
			),
		)
		.returning();

	return jobRow ? getGenerationJobDetailRecord(jobRow.id) : null;
}

export async function claimGenerationJob(
	jobId: string,
): Promise<GenerationJobWithContextDTO | null> {
	const now = new Date();
	const [jobRow] = await db
		.update(courseGenerationJobs)
		.set({
			status: "processing",
			startedAt: now,
			metadataCompletedAt: now,
			failureReason: null,
			retryable: false,
			updatedAt: now,
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

export async function markGenerationJobTranscriptReady(
	jobId: string,
): Promise<GenerationJobDetailRecordDTO | null> {
	const now = new Date();
	const [jobRow] = await db
		.update(courseGenerationJobs)
		.set({
			transcriptCompletedAt: now,
			updatedAt: now,
		})
		.where(
			and(
				eq(courseGenerationJobs.id, jobId),
				eq(courseGenerationJobs.status, "processing"),
			),
		)
		.returning();

	return jobRow ? getGenerationJobDetailRecord(jobRow.id) : null;
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
					eq(courseGenerationJobs.status, "processing"),
					isNull(courses.deletedAt),
				),
			)
			.limit(1);

		if (!row) {
			return null;
		}

		const completedAt = new Date();
		const transcriptCompletedAt = input.transcriptSource
			? (row.job.transcriptCompletedAt ?? completedAt)
			: row.job.transcriptCompletedAt;
		const [jobRow] = await tx
			.update(courseGenerationJobs)
			.set({
				status: "completed",
				transcriptSource: input.transcriptSource ?? row.job.transcriptSource,
				failureReason: null,
				retryable: false,
				rawOutput: input.rawOutput ?? undefined,
				metadataCompletedAt: row.job.metadataCompletedAt ?? completedAt,
				transcriptCompletedAt,
				chaptersCompletedAt: row.job.chaptersCompletedAt ?? completedAt,
				playerCompletedAt: row.job.playerCompletedAt ?? completedAt,
				completedAt,
				updatedAt: completedAt,
			})
			.where(
				and(
					eq(courseGenerationJobs.id, input.jobId),
					eq(courseGenerationJobs.status, "processing"),
				),
			)
			.returning();

		if (!jobRow) {
			return null;
		}

		const oldChapterRows = await tx
			.select()
			.from(courseChapters)
			.where(eq(courseChapters.courseId, row.course.id))
			.orderBy(courseChapters.orderIndex);
		const oldChapterIds = oldChapterRows.map((chapter) => chapter.id);
		const oldNoteRows =
			oldChapterIds.length === 0
				? []
				: await tx
						.select()
						.from(chapterNotes)
						.where(inArray(chapterNotes.chapterId, oldChapterIds));
		const oldProgressRows =
			oldChapterIds.length === 0
				? []
				: await tx
						.select()
						.from(chapterProgress)
						.where(inArray(chapterProgress.chapterId, oldChapterIds));
		const oldBookmarkRows = await tx
			.select()
			.from(bookmarks)
			.where(
				and(eq(bookmarks.courseId, row.course.id), isNull(bookmarks.deletedAt)),
			);

		if (oldChapterIds.length > 0) {
			await tx
				.delete(courseChapters)
				.where(inArray(courseChapters.id, oldChapterIds));
		}

		const newChapterRows =
			input.chapters.length === 0
				? []
				: await tx
						.insert(courseChapters)
						.values(
							input.chapters.map((chapter) => ({
								courseId: row.course.id,
								title: chapter.title,
								summary: chapter.summary,
								orderIndex: chapter.orderIndex,
								startSeconds: chapter.startSeconds,
								endSeconds: chapter.endSeconds,
							})),
						)
						.returning();

		if (newChapterRows.length > 0) {
			await remapLearningDataAfterChapterReplacement({
				tx,
				oldChapters: oldChapterRows,
				newChapters: newChapterRows,
				notes: oldNoteRows,
				progress: oldProgressRows,
				bookmarks: oldBookmarkRows,
			});
		}

		const [courseRow] = await tx
			.update(courses)
			.set({
				title: input.title ?? row.course.title,
				description: input.description ?? row.course.description,
				updatedAt: completedAt,
			})
			.where(eq(courses.id, row.course.id))
			.returning();

		const videoUpdate: Partial<typeof videos.$inferInsert> = {
			durationSeconds: input.durationSeconds ?? row.video.durationSeconds,
			updatedAt: completedAt,
		};

		if (input.transcriptSource) {
			videoUpdate.transcriptSource = input.transcriptSource;
			videoUpdate.transcriptText = input.transcriptText;
		}

		const [videoRow] = await tx
			.update(videos)
			.set(videoUpdate)
			.where(eq(videos.id, row.video.id))
			.returning();

		return {
			job: mapGenerationJob(jobRow),
			course: mapCourse(courseRow),
			video: mapVideoGenerationContext(videoRow),
			chapterCount: input.chapters.length,
		};
	});
}

async function remapLearningDataAfterChapterReplacement({
	tx,
	oldChapters,
	newChapters,
	notes,
	progress,
	bookmarks: bookmarkRows,
}: {
	tx: DbTransaction;
	oldChapters: Array<typeof courseChapters.$inferSelect>;
	newChapters: Array<typeof courseChapters.$inferSelect>;
	notes: Array<typeof chapterNotes.$inferSelect>;
	progress: Array<typeof chapterProgress.$inferSelect>;
	bookmarks: Array<typeof bookmarks.$inferSelect>;
}) {
	const oldChapterById = new Map(
		oldChapters.map((chapter) => [chapter.id, chapter]),
	);

	for (const bookmark of bookmarkRows) {
		const nextChapter = findChapterForTimestamp(
			newChapters,
			bookmark.timestampSeconds,
		);
		await tx
			.update(bookmarks)
			.set({
				chapterId: nextChapter?.id ?? null,
				updatedAt: new Date(),
			})
			.where(eq(bookmarks.id, bookmark.id));
	}

	const notesByTarget = new Map<
		string,
		Array<{
			oldChapter: typeof courseChapters.$inferSelect;
			note: typeof chapterNotes.$inferSelect;
		}>
	>();

	for (const note of notes) {
		const oldChapter = oldChapterById.get(note.chapterId);
		if (!oldChapter || !note.markdown.trim()) {
			continue;
		}
		const nextChapter = findChapterForTimestamp(
			newChapters,
			oldChapter.startSeconds,
		);
		if (!nextChapter) {
			continue;
		}
		const key = `${note.userId ?? "local"}:${nextChapter.id}`;
		const existing = notesByTarget.get(key) ?? [];
		existing.push({ oldChapter, note });
		notesByTarget.set(key, existing);
	}

	for (const entries of notesByTarget.values()) {
		const [{ note }, ...rest] = entries;
		const targetChapter = findChapterForTimestamp(
			newChapters,
			entries[0].oldChapter.startSeconds,
		);
		if (!targetChapter) {
			continue;
		}
		const markdown =
			rest.length === 0
				? note.markdown
				: entries
						.map(
							(entry) =>
								`### Recovered from ${entry.oldChapter.title}\n\n${entry.note.markdown.trim()}`,
						)
						.join("\n\n");

		await tx.insert(chapterNotes).values({
			userId: note.userId,
			chapterId: targetChapter.id,
			markdown,
		});
	}

	const progressByTarget = new Map<
		string,
		{
			userId: string | null;
			chapterId: string;
			watchedSeconds: number;
			completed: boolean;
		}
	>();

	for (const item of progress) {
		const oldChapter = oldChapterById.get(item.chapterId);
		if (!oldChapter) {
			continue;
		}
		const nextChapter = findChapterForTimestamp(
			newChapters,
			oldChapter.startSeconds,
		);
		if (!nextChapter) {
			continue;
		}
		const key = `${item.userId ?? "local"}:${nextChapter.id}`;
		const current = progressByTarget.get(key);
		progressByTarget.set(key, {
			userId: item.userId,
			chapterId: nextChapter.id,
			watchedSeconds: Math.max(
				current?.watchedSeconds ?? 0,
				item.watchedSeconds,
			),
			completed: Boolean(current?.completed || item.completed),
		});
	}

	for (const item of progressByTarget.values()) {
		await tx.insert(chapterProgress).values(item);
	}
}

function findChapterForTimestamp(
	chapters: Array<typeof courseChapters.$inferSelect>,
	timestampSeconds: number,
) {
	return (
		chapters.find((chapter, index) => {
			const nextChapter = chapters[index + 1];
			const endSeconds =
				chapter.endSeconds ?? nextChapter?.startSeconds ?? Infinity;

			return (
				timestampSeconds >= chapter.startSeconds &&
				timestampSeconds < endSeconds
			);
		}) ?? null
	);
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
		.where(
			and(
				eq(courseGenerationJobs.id, input.jobId),
				inArray(courseGenerationJobs.status, ["queued", "processing"]),
			),
		)
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
				inArray(courseGenerationJobs.status, ["failed", "cancelled"]),
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

export async function createRegenerationJob(
	courseId: string,
	ownerId: UserId,
): Promise<GenerationJobWithContextDTO | null> {
	const jobId = await db.transaction(async (tx) => {
		const [row] = await tx
			.select({ course: courses })
			.from(courses)
			.where(
				and(
					eq(courses.id, courseId),
					userMatches(courses.ownerId, ownerId),
					isNull(courses.deletedAt),
				),
			)
			.limit(1);

		if (!row) {
			return null;
		}

		const [activeJob] = await tx
			.select()
			.from(courseGenerationJobs)
			.where(
				and(
					eq(courseGenerationJobs.courseId, courseId),
					inArray(courseGenerationJobs.status, ["queued", "processing"]),
				),
			)
			.limit(1);

		if (activeJob) {
			return activeJob.id;
		}

		const [jobRow] = await tx
			.insert(courseGenerationJobs)
			.values({ courseId, status: "queued" })
			.returning();

		return jobRow.id;
	});

	return jobId ? getGenerationJob(jobId) : null;
}

export async function getSampleCourse(): Promise<CourseDTO | null> {
	const [row] = await db
		.select({ course: courses })
		.from(courses)
		.innerJoin(videos, eq(courses.videoId, videos.id))
		.where(
			and(
				eq(videos.provider, "youtube"),
				eq(videos.providerVideoId, "M7lc1UVf-VE"),
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

export async function getLearningPreferences(
	userId: string,
): Promise<LearningPreferencesDTO | null> {
	const [row] = await db
		.select()
		.from(learningPreferences)
		.where(eq(learningPreferences.userId, userId))
		.limit(1);

	return row ? mapLearningPreferences(row) : null;
}

export async function upsertLearningPreferences(
	userId: string,
	input: LearningPreferencesDTO,
): Promise<LearningPreferencesDTO> {
	const now = new Date();
	const [row] = await db
		.insert(learningPreferences)
		.values({
			userId,
			playbackSpeed: input.playbackSpeed,
			manualCompletionOnly: input.manualCompletionOnly,
			autoplayNextChapter: input.autoplayNextChapter,
		})
		.onConflictDoUpdate({
			target: learningPreferences.userId,
			set: {
				playbackSpeed: input.playbackSpeed,
				manualCompletionOnly: input.manualCompletionOnly,
				autoplayNextChapter: input.autoplayNextChapter,
				updatedAt: now,
			},
		})
		.returning();

	return mapLearningPreferences(row);
}

export async function upsertCourseProgress(
	userId: UserId,
	courseId: string,
	input: {
		resumeSeconds: number;
		completionPercent: number;
		occurredAt?: Date;
	},
): Promise<CourseProgressDTO> {
	const occurredAt = input.occurredAt ?? new Date();
	const [row] = await db
		.insert(courseProgress)
		.values({
			userId,
			courseId,
			resumeSeconds: input.resumeSeconds,
			completionPercent: input.completionPercent,
			updatedAt: occurredAt,
		})
		.onConflictDoUpdate({
			target: [courseProgress.userId, courseProgress.courseId],
			set: {
				resumeSeconds: sql`case when ${courseProgress.updatedAt} <= ${occurredAt} then ${input.resumeSeconds} else ${courseProgress.resumeSeconds} end`,
				completionPercent: sql`greatest(${courseProgress.completionPercent}, ${input.completionPercent})`,
				updatedAt: sql`greatest(${courseProgress.updatedAt}, ${occurredAt})`,
			},
		})
		.returning();

	return mapCourseProgress(row);
}

export async function upsertChapterProgress(
	userId: UserId,
	chapterId: string,
	input: { watchedSeconds: number; completed: boolean },
	options: { monotonic?: boolean } = {},
): Promise<ChapterProgressDTO> {
	const update = options.monotonic
		? {
				watchedSeconds: sql`greatest(${chapterProgress.watchedSeconds}, ${input.watchedSeconds})`,
				completed: sql`${chapterProgress.completed} or ${input.completed}`,
				updatedAt: new Date(),
			}
		: {
				watchedSeconds: input.watchedSeconds,
				completed: input.completed,
				updatedAt: new Date(),
			};
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
			set: update,
		})
		.returning();

	return mapChapterProgress(row);
}

export async function upsertPlaybackProgress(
	userId: UserId,
	input: {
		courseId: string;
		resumeSeconds: number;
		completionPercent: number;
		occurredAt?: Date;
		chapters: Array<{
			chapterId: string;
			watchedSeconds: number;
			completed: boolean;
		}>;
	},
): Promise<{
	progress: CourseProgressDTO;
	chapterProgress: ChapterProgressDTO[];
}> {
	const progress = await upsertCourseProgress(userId, input.courseId, {
		resumeSeconds: input.resumeSeconds,
		completionPercent: input.completionPercent,
		occurredAt: input.occurredAt,
	});
	const chapterRows = await Promise.all(
		input.chapters.map((chapter) =>
			upsertChapterProgress(
				userId,
				chapter.chapterId,
				{
					watchedSeconds: chapter.watchedSeconds,
					completed: chapter.completed,
				},
				{ monotonic: true },
			),
		),
	);

	return { progress, chapterProgress: chapterRows };
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

export async function getChapterNote(
	userId: UserId,
	chapterId: string,
): Promise<ChapterNoteDTO | null> {
	const [row] = await db
		.select()
		.from(chapterNotes)
		.where(
			and(
				eq(chapterNotes.chapterId, chapterId),
				userMatches(chapterNotes.userId, userId),
			),
		)
		.limit(1);

	return row ? mapNote(row) : null;
}

export async function upsertChapterNoteIfCurrent({
	userId,
	chapterId,
	markdown,
	expectedUpdatedAt,
}: {
	userId: UserId;
	chapterId: string;
	markdown: string;
	expectedUpdatedAt: string | null;
}): Promise<ChapterNoteDTO | null> {
	const current = await getChapterNote(userId, chapterId);

	if ((current?.updatedAt ?? null) !== expectedUpdatedAt) {
		return null;
	}

	return upsertChapterNote(userId, chapterId, markdown);
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
