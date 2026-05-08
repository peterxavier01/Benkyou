import type { VideoProvider } from "@benkyou/types";

export const PRODUCT_NAME = "Benkyou";

export const CORE_PROMISE = "Turn a video into a structured course.";

export const SUPPORTED_VIDEO_PROVIDERS = ["youtube"] as const satisfies readonly VideoProvider[];

export const PLANNED_VIDEO_PROVIDERS = ["vimeo", "loom"] as const satisfies readonly VideoProvider[];

export const DEFAULT_CHAPTER_COMPLETION_THRESHOLD = 0.9;

export const DEFAULT_PROGRESS_SAVE_INTERVAL_MS = 15_000;

export const LOCAL_STORAGE_KEYS = {
	courses: "benkyou:courses:v1",
	progress: "benkyou:progress:v1",
	notes: "benkyou:notes:v1",
	bookmarks: "benkyou:bookmarks:v1",
} as const;
