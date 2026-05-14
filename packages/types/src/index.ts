export type VideoProvider = "youtube" | "vimeo" | "loom";

export type CourseVisibility = "private" | "unlisted" | "public";

export type GenerationJobStatus =
	| "queued"
	| "processing"
	| "completed"
	| "failed"
	| "cancelled";

export type TranscriptSource = "youtube_captions" | "manual" | "sample";

export interface VideoDTO {
	id: string;
	provider: VideoProvider;
	providerVideoId: string;
	canonicalUrl: string;
	title: string | null;
	channelTitle: string | null;
	thumbnailUrl: string | null;
	durationSeconds: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface CourseDTO {
	id: string;
	videoId: string;
	ownerId: string | null;
	title: string;
	description: string | null;
	visibility: CourseVisibility;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface CourseChapterDTO {
	id: string;
	courseId: string;
	title: string;
	summary: string | null;
	orderIndex: number;
	startSeconds: number;
	endSeconds: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface CourseGenerationJobDTO {
	id: string;
	courseId: string;
	status: GenerationJobStatus;
	transcriptSource: TranscriptSource | null;
	failureReason: string | null;
	retryable: boolean;
	startedAt: string | null;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
}

export interface ChapterNoteDTO {
	id: string;
	userId: string | null;
	chapterId: string;
	markdown: string;
	createdAt: string;
	updatedAt: string;
}

export interface CourseProgressDTO {
	id: string;
	userId: string | null;
	courseId: string;
	resumeSeconds: number;
	completionPercent: number;
	updatedAt: string;
}

export interface ChapterProgressDTO {
	id: string;
	userId: string | null;
	chapterId: string;
	watchedSeconds: number;
	completed: boolean;
	updatedAt: string;
}

export interface BookmarkDTO {
	id: string;
	userId: string | null;
	courseId: string;
	chapterId: string | null;
	timestampSeconds: number;
	title: string | null;
	note: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface BookmarkListItemDTO {
	bookmark: BookmarkDTO;
	course: CourseDTO;
	video: VideoDTO;
	chapter: CourseChapterDTO | null;
}

export interface LearningPreferencesDTO {
	playbackSpeed: number;
	autoplayNextChapter: boolean;
	manualCompletionOnly: boolean;
}

export interface ParsedVideoUrl {
	provider: VideoProvider;
	providerVideoId: string;
	canonicalUrl: string;
}

export interface CreateCourseFromUrlRequestV1 {
	url: string;
}

export interface CreateCourseFromUrlResponseV1 {
	courseId: string;
	generationJobId: string;
	reusedExistingCourse: boolean;
}

export type GenerationTimelineStepKeyV1 =
	| "metadata"
	| "transcript"
	| "chapters"
	| "player";

export type GenerationTimelineStepStatusV1 =
	| "pending"
	| "processing"
	| "completed"
	| "failed";

export interface GenerationTimelineStepV1 {
	key: GenerationTimelineStepKeyV1;
	label: string;
	status: GenerationTimelineStepStatusV1;
	description: string;
}

export interface GenerationJobDetailV1 {
	job: CourseGenerationJobDTO;
	course: CourseDTO;
	video: VideoDTO;
	chapterCount: number;
	timeline: GenerationTimelineStepV1[];
	canRetry: boolean;
	canOpenCourse: boolean;
	canCancel: boolean;
}

export interface ProcessGenerationJobRequestV1 {
	generationJobId: string;
}

export interface ProcessGenerationJobResponseV1 {
	detail: GenerationJobDetailV1;
}

export interface RetryGenerationJobRequestV1 {
	generationJobId: string;
}

export interface RetryGenerationJobResponseV1 {
	courseId: string;
	generationJobId: string;
}

export interface CancelGenerationJobRequestV1 {
	generationJobId: string;
}

export interface CancelGenerationJobResponseV1 {
	detail: GenerationJobDetailV1;
}

export interface OpenSampleCourseResponseV1 {
	courseId: string;
}

export type CourseLibraryFilterV1 =
	| "all"
	| "in-progress"
	| "completed"
	| "processing"
	| "failed";

export interface CourseLibraryItemDTO {
	course: CourseDTO;
	video: VideoDTO;
	chapterCount: number;
	progress: CourseProgressDTO | null;
	latestGenerationJob: CourseGenerationJobDTO | null;
}

export interface GetCourseLibraryResponseV1 {
	items: CourseLibraryItemDTO[];
}

export interface CoursePlayerDataDTO {
	course: CourseDTO;
	video: VideoDTO;
	chapters: CourseChapterDTO[];
	progress: CourseProgressDTO | null;
	chapterProgress: ChapterProgressDTO[];
	notes: ChapterNoteDTO[];
	bookmarks: BookmarkDTO[];
	latestGenerationJob: CourseGenerationJobDTO | null;
}

export interface GetCoursePlayerDataRequestV1 {
	courseId: string;
}

export interface GetCoursePlayerDataResponseV1 {
	data: CoursePlayerDataDTO;
}

export interface UpsertCourseProgressRequestV1 {
	courseId: string;
	resumeSeconds: number;
	completionPercent: number;
}

export interface UpsertCourseProgressResponseV1 {
	progress: CourseProgressDTO;
}

export interface UpsertChapterProgressRequestV1 {
	chapterId: string;
	watchedSeconds: number;
	completed: boolean;
}

export interface UpsertChapterProgressResponseV1 {
	progress: ChapterProgressDTO;
}

export interface UpsertChapterNoteRequestV1 {
	chapterId: string;
	markdown: string;
	expectedUpdatedAt: string | null;
}

export interface UpsertChapterNoteResponseV1 {
	note: ChapterNoteDTO;
}

export interface CreateBookmarkRequestV1 {
	courseId: string;
	timestampSeconds: number;
	title?: string | null;
	note?: string | null;
}

export interface CreateBookmarkResponseV1 {
	bookmark: BookmarkDTO;
}

export interface UpdateBookmarkRequestV1 {
	bookmarkId: string;
	title?: string | null;
	note?: string | null;
}

export interface UpdateBookmarkResponseV1 {
	bookmark: BookmarkDTO;
}

export interface DeleteBookmarkRequestV1 {
	bookmarkId: string;
}

export interface DeleteBookmarkResponseV1 {
	deleted: boolean;
}

export interface GetBookmarksResponseV1 {
	items: BookmarkListItemDTO[];
}

export interface DeleteCourseRequestV1 {
	courseId: string;
}

export interface DeleteCourseResponseV1 {
	deleted: boolean;
}

export interface LocalCoursesPayloadV1 {
	version: 1;
	courses: CoursePlayerDataDTO[];
	updatedAt: string;
}

export interface LocalProgressPayloadV1 {
	version: 1;
	courseProgress: CourseProgressDTO[];
	chapterProgress: ChapterProgressDTO[];
	updatedAt: string;
}

export interface LocalNotesPayloadV1 {
	version: 1;
	notes: ChapterNoteDTO[];
	updatedAt: string;
}

export interface LocalBookmarksPayloadV1 {
	version: 1;
	bookmarks: BookmarkDTO[];
	updatedAt: string;
}
