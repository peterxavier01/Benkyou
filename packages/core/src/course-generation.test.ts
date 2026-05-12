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
	getChapterGenerationPolicy,
	parseYouTubeDescriptionChapters,
	processGenerationJobRequestV1Schema,
	retryGenerationJobRequestV1Schema,
	toGenerationJobDetail,
	validateGeneratedChapterRanges,
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

test("description chapter parser accepts common YouTube timestamp formats", () => {
	const chapters = parseYouTubeDescriptionChapters(
		[
			"00:00 Intro",
			"1:23 Topic",
			"01:02:03 Long section",
			"01:10:00 - Wrap-up",
		].join("\n"),
		4_500,
	);

	assert.deepEqual(chapters, [
		{ title: "Intro", startSeconds: 0, endSeconds: 83 },
		{ title: "Topic", startSeconds: 83, endSeconds: 3_723 },
		{ title: "Long section", startSeconds: 3_723, endSeconds: 4_200 },
		{ title: "Wrap-up", startSeconds: 4_200, endSeconds: 4_500 },
	]);
});

test("description chapter parser ignores invalid timestamp ranges", () => {
	const chapters = parseYouTubeDescriptionChapters(
		[
			"00:00 Intro",
			"00:00 Duplicate intro",
			"05:00 Main topic",
			"04:00 Out of order",
			"12:00 Beyond duration",
		].join("\n"),
		600,
	);

	assert.deepEqual(chapters, [
		{ title: "Intro", startSeconds: 0, endSeconds: 300 },
		{ title: "Main topic", startSeconds: 300, endSeconds: 600 },
	]);
});

test("description chapter parser rejects fewer than two valid chapters", () => {
	assert.deepEqual(parseYouTubeDescriptionChapters("00:00 Only one", 60), []);
	assert.deepEqual(
		parseYouTubeDescriptionChapters("00:00 Intro\n99:00 Too late", 60),
		[],
	);
});

test("chapter generation policy follows duration-aware MVP defaults", () => {
	assert.deepEqual(getChapterGenerationPolicy(9 * 60, 10), {
		minChapters: 3,
		maxChapters: 5,
		targetChaptersLabel: "3-5",
		isCoarseFallback: false,
		transcriptMode: "full_window",
		transcriptCharacterLimit: 120_000,
	});
	assert.equal(getChapterGenerationPolicy(20 * 60, 10).targetChaptersLabel, "5-8");
	assert.equal(
		getChapterGenerationPolicy(45 * 60, 10).targetChaptersLabel,
		"8-12",
	);
	assert.equal(
		getChapterGenerationPolicy(90 * 60, 10).targetChaptersLabel,
		"12-18",
	);
	assert.equal(
		getChapterGenerationPolicy(3 * 60 * 60, 10).targetChaptersLabel,
		"18-35",
	);

	const longPolicy = getChapterGenerationPolicy(12 * 60 * 60, 10);
	assert.equal(longPolicy.targetChaptersLabel, "12-25");
	assert.equal(longPolicy.isCoarseFallback, true);
	assert.equal(longPolicy.transcriptMode, "sampled_windows");
});

test("generated chapter ranges must be ordered and within duration", () => {
	assert.equal(
		validateGeneratedChapterRanges(
			[
				{ startSeconds: 0, endSeconds: 60 },
				{ startSeconds: 60, endSeconds: null },
			],
			120,
		),
		true,
	);
	assert.equal(
		validateGeneratedChapterRanges(
			[
				{ startSeconds: 0, endSeconds: 60 },
				{ startSeconds: 30, endSeconds: 90 },
			],
			120,
		),
		false,
	);
	assert.equal(
		validateGeneratedChapterRanges([{ startSeconds: 125, endSeconds: null }], 120),
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
