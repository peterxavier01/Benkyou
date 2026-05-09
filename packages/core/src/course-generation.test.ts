import assert from "node:assert/strict";
import test from "node:test";

import type {
	CourseDTO,
	CourseGenerationJobDTO,
	VideoDTO,
} from "@benkyou/types";

import {
	aiGeneratedCourseV1Schema,
	createCourseFromUrlRequestV1Schema,
	processGenerationJobRequestV1Schema,
	retryGenerationJobRequestV1Schema,
	toGenerationJobDetail,
} from "./course-generation";

const baseJob = {
	id: "00000000-0000-4000-8000-000000000001",
	courseId: "00000000-0000-4000-8000-000000000002",
	status: "queued",
	transcriptSource: null,
	failureReason: null,
	retryable: false,
	createdAt: "2026-05-09T00:00:00.000Z",
	updatedAt: "2026-05-09T00:00:00.000Z",
	completedAt: null,
} satisfies CourseGenerationJobDTO;

const baseCourse = {
	id: "00000000-0000-4000-8000-000000000002",
	videoId: "00000000-0000-4000-8000-000000000003",
	ownerId: null,
	title: "Course",
	description: null,
	visibility: "private",
	createdAt: "2026-05-09T00:00:00.000Z",
	updatedAt: "2026-05-09T00:00:00.000Z",
	deletedAt: null,
} satisfies CourseDTO;

const baseVideo = {
	id: "00000000-0000-4000-8000-000000000003",
	provider: "youtube",
	providerVideoId: "dQw4w9WgXcQ",
	canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
	title: "Video",
	channelTitle: "Channel",
	thumbnailUrl: null,
	durationSeconds: null,
	createdAt: "2026-05-09T00:00:00.000Z",
	updatedAt: "2026-05-09T00:00:00.000Z",
} satisfies VideoDTO;

test("v1 request schemas accept valid payloads", () => {
	assert.deepEqual(
		createCourseFromUrlRequestV1Schema.parse({ url: " https://x.test " }),
		{
			url: "https://x.test",
		},
	);
	assert.deepEqual(
		processGenerationJobRequestV1Schema.parse({ generationJobId: baseJob.id }),
		{
			generationJobId: baseJob.id,
		},
	);
	assert.deepEqual(
		retryGenerationJobRequestV1Schema.parse({ generationJobId: baseJob.id }),
		{
			generationJobId: baseJob.id,
		},
	);
});

test("AI output schema accepts ordered chapters", () => {
	const result = aiGeneratedCourseV1Schema.parse({
		title: "A useful course",
		description: "Study this in chapters.",
		chapters: [
			{
				title: "Intro",
				summary: "Sets context.",
				startSeconds: 0,
				endSeconds: 60,
			},
			{
				title: "Main idea",
				summary: "Explains the core idea.",
				startSeconds: 60,
				endSeconds: null,
			},
		],
	});

	assert.equal(result.chapters.length, 2);
});

test("AI output schema rejects empty, untitled, and invalid ranges", () => {
	assert.equal(
		aiGeneratedCourseV1Schema.safeParse({
			title: "Course",
			description: "",
			chapters: [],
		}).success,
		false,
	);
	assert.equal(
		aiGeneratedCourseV1Schema.safeParse({
			title: "Course",
			description: "",
			chapters: [
				{
					title: "",
					summary: "Missing title.",
					startSeconds: 0,
					endSeconds: 10,
				},
			],
		}).success,
		false,
	);
	assert.equal(
		aiGeneratedCourseV1Schema.safeParse({
			title: "Course",
			description: "",
			chapters: [
				{
					title: "Bad range",
					summary: "Invalid.",
					startSeconds: 10,
					endSeconds: 5,
				},
			],
		}).success,
		false,
	);
});

test("generation detail derives retry and open-course states", () => {
	const completed = toGenerationJobDetail({
		job: {
			...baseJob,
			status: "completed",
			transcriptSource: "youtube_captions",
		},
		course: baseCourse,
		video: baseVideo,
		chapterCount: 3,
	});
	const failed = toGenerationJobDetail({
		job: {
			...baseJob,
			status: "failed",
			retryable: true,
			failureReason: "No captions.",
		},
		course: baseCourse,
		video: baseVideo,
		chapterCount: 0,
	});

	assert.equal(completed.canOpenCourse, true);
	assert.equal(completed.timeline.at(-1)?.status, "completed");
	assert.equal(failed.canRetry, true);
	assert.equal(
		failed.timeline.some((step) => step.status === "failed"),
		true,
	);
});
