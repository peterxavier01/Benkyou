import { pgEnum } from "drizzle-orm/pg-core";

export const videoProviderEnum = pgEnum("video_provider", [
    "youtube",
    "vimeo",
    "loom",
]);

export const courseVisibilityEnum = pgEnum("course_visibility", [
    "private",
    "unlisted",
    "public",
]);

export const generationJobStatusEnum = pgEnum("generation_job_status", [
    "queued",
    "processing",
    "completed",
    "failed",
    "cancelled",
]);

export const transcriptSourceEnum = pgEnum("transcript_source", [
    "youtube_captions",
    "manual",
    "sample",
]);
