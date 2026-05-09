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

export interface OpenSampleCourseResponseV1 {
	courseId: string;
}

export interface CourseLibraryItemDTO {
	course: CourseDTO;
	video: VideoDTO;
	chapterCount: number;
	progress: CourseProgressDTO | null;
	latestGenerationJob: CourseGenerationJobDTO | null;
}

export interface CoursePlayerDataDTO {
	course: CourseDTO;
	video: VideoDTO;
	chapters: CourseChapterDTO[];
	progress: CourseProgressDTO | null;
	chapterProgress: ChapterProgressDTO[];
	notes: ChapterNoteDTO[];
	bookmarks: BookmarkDTO[];
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
