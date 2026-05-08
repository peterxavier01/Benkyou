export type VideoProvider = "youtube" | "vimeo" | "loom";

export type CourseVisibility = "private" | "unlisted" | "public";

export type GenerationJobStatus =
	| "queued"
	| "processing"
	| "completed"
	| "failed"
	| "cancelled";
