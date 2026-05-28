import assert from "node:assert/strict";
import test from "node:test";

import type {
	CourseDTO,
	CourseGenerationJobDTO,
	VideoDTO,
} from "@benkyou/types";

import {
	aiGeneratedCourseV1Schema,
	cancelGenerationJobRequestV1Schema,
	createCourseFromUrlRequestV1Schema,
	educationalSuitabilityResultV1Schema,
	GENERATION_JOB_TIMEOUT_MS,
	getChapterGenerationPolicy,
	isEducationalSuitabilityAllowed,
	isSampledTranscriptCacheIncomplete,
	normalizeGeneratedChapterRanges,
	parseYouTubeDescriptionChapters,
	processGenerationJobRequestV1Schema,
	resolveTranscriptBackedDurationSeconds,
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
	startedAt: null,
	metadataCompletedAt: null,
	transcriptCompletedAt: null,
	chaptersCompletedAt: null,
	playerCompletedAt: null,
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
	assert.deepEqual(
		cancelGenerationJobRequestV1Schema.parse({ generationJobId: baseJob.id }),
		{
			generationJobId: baseJob.id,
		},
	);
	assert.equal(GENERATION_JOB_TIMEOUT_MS, 10 * 60 * 1000);
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

test("educational suitability schema validates strict verdicts", () => {
	const educational = educationalSuitabilityResultV1Schema.parse({
		verdict: "educational",
		confidence: 0.92,
		reason: "The video teaches a practical workflow.",
		contentType: "tutorial",
		evidence: ["tutorial in title", "step-by-step description"],
	});

	assert.equal(isEducationalSuitabilityAllowed(educational), true);
	assert.equal(
		isEducationalSuitabilityAllowed({
			...educational,
			verdict: "ambiguous",
		}),
		false,
	);
	assert.throws(() =>
		educationalSuitabilityResultV1Schema.parse({
			...educational,
			verdict: "asmr",
		}),
	);
	assert.throws(() =>
		educationalSuitabilityResultV1Schema.parse({
			...educational,
			confidence: 1.5,
		}),
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
	assert.equal(
		getChapterGenerationPolicy(20 * 60, 10).targetChaptersLabel,
		"5-8",
	);
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
	const threeHourPolicy = getChapterGenerationPolicy(3 * 60 * 60, 10);
	assert.equal(threeHourPolicy.isCoarseFallback, false);
	assert.equal(threeHourPolicy.transcriptMode, "sampled_windows");

	const coarsePolicy = getChapterGenerationPolicy(5 * 60 * 60, 10);
	assert.equal(coarsePolicy.targetChaptersLabel, "12-25");
	assert.equal(coarsePolicy.isCoarseFallback, true);
	assert.equal(coarsePolicy.transcriptMode, "sampled_windows");
});

test("transcript-backed duration replaces clearly compressed stored duration", () => {
	assert.equal(resolveTranscriptBackedDurationSeconds(null, 9_079), 9_079);
	assert.equal(resolveTranscriptBackedDurationSeconds(46, 9_079), 9_079);
	assert.equal(resolveTranscriptBackedDurationSeconds(8_900, 9_079), 8_900);
	assert.equal(
		resolveTranscriptBackedDurationSeconds(12 * 60 * 60, 9_079),
		43_200,
	);
	assert.equal(resolveTranscriptBackedDurationSeconds(46, null), 46);
});

test("sampled transcript cache requires timeline coverage", () => {
	assert.equal(
		isSampledTranscriptCacheIncomplete({
			durationSeconds: 10 * 60 * 60,
			transcriptSegmentCount: 500,
			transcriptText: "[0s] Intro\n[7200s] Early section",
		}),
		true,
	);
	assert.equal(
		isSampledTranscriptCacheIncomplete({
			durationSeconds: 10 * 60 * 60,
			transcriptSegmentCount: 500,
			transcriptText: "[0s] Intro\n[32000s] Final section",
		}),
		false,
	);
	assert.equal(
		isSampledTranscriptCacheIncomplete({
			durationSeconds: 90 * 60,
			transcriptSegmentCount: 100,
			transcriptText: "[0s] Intro\n[1200s] Short cache",
		}),
		false,
	);
});

test("generated chapter normalization fills gaps with named chapters", () => {
	const chapters = normalizeGeneratedChapterRanges(
		[
			{
				title: "Intro",
				summary: "Sets context.",
				startSeconds: 15,
				endSeconds: 45,
			},
			{
				title: "Main topic",
				summary: "Explains the main topic.",
				startSeconds: 90,
				endSeconds: 120,
			},
			{
				title: "Wrap-up",
				summary: "Closes the lesson.",
				startSeconds: 180,
				endSeconds: 220,
			},
		],
		240,
	);

	assert.deepEqual(chapters, [
		{
			title: "Intro",
			summary: "Sets context.",
			startSeconds: 0,
			endSeconds: 90,
		},
		{
			title: "Main topic",
			summary: "Explains the main topic.",
			startSeconds: 90,
			endSeconds: 180,
		},
		{
			title: "Wrap-up",
			summary: "Closes the lesson.",
			startSeconds: 180,
			endSeconds: 240,
		},
	]);
});

test("generated chapter normalization keeps unknown final duration open", () => {
	assert.deepEqual(
		normalizeGeneratedChapterRanges(
			[
				{
					title: "Intro",
					summary: "Starts.",
					startSeconds: 12,
					endSeconds: 20,
				},
				{
					title: "Next",
					summary: "Continues.",
					startSeconds: 40,
					endSeconds: 80,
				},
			],
			null,
		),
		[
			{ title: "Intro", summary: "Starts.", startSeconds: 0, endSeconds: 40 },
			{
				title: "Next",
				summary: "Continues.",
				startSeconds: 40,
				endSeconds: null,
			},
		],
	);
});

test("generated chapter ranges must be ordered and within duration", () => {
	assert.equal(
		validateGeneratedChapterRanges(
			[
				{ startSeconds: 0, endSeconds: 60 },
				{ startSeconds: 60, endSeconds: 120 },
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
		validateGeneratedChapterRanges(
			[
				{ startSeconds: 0, endSeconds: 60 },
				{ startSeconds: 90, endSeconds: 120 },
			],
			120,
		),
		false,
	);
	assert.equal(
		validateGeneratedChapterRanges(
			[
				{ startSeconds: 5, endSeconds: 60 },
				{ startSeconds: 60, endSeconds: 120 },
			],
			120,
		),
		false,
	);
	assert.equal(
		validateGeneratedChapterRanges(
			[{ startSeconds: 125, endSeconds: null }],
			120,
		),
		false,
	);
	assert.equal(
		validateGeneratedChapterRanges(
			[
				{ startSeconds: 0, endSeconds: 60 },
				{ startSeconds: 60, endSeconds: null },
			],
			120,
		),
		false,
	);
	assert.equal(
		validateGeneratedChapterRanges(
			[
				{ startSeconds: 0, endSeconds: 60 },
				{ startSeconds: 60, endSeconds: null },
			],
			null,
		),
		true,
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
	assert.equal(completed.canCancel, false);
	assert.equal(completed.timeline.at(-1)?.status, "completed");
	assert.equal(failed.canRetry, true);
	assert.equal(
		failed.timeline.some((step) => step.status === "failed"),
		true,
	);
});

test("generation timeline uses persisted step progress", () => {
	const processingAfterTranscript = toGenerationJobDetail({
		job: {
			...baseJob,
			status: "processing",
			startedAt: "2026-05-09T00:01:00.000Z",
			metadataCompletedAt: "2026-05-09T00:01:00.000Z",
			transcriptCompletedAt: "2026-05-09T00:01:05.000Z",
			transcriptSource: "youtube_captions",
		},
		course: baseCourse,
		video: baseVideo,
		chapterCount: 0,
	});
	const creatorTimestampCompleted = toGenerationJobDetail({
		job: {
			...baseJob,
			status: "completed",
			metadataCompletedAt: "2026-05-09T00:01:00.000Z",
			chaptersCompletedAt: "2026-05-09T00:01:03.000Z",
			playerCompletedAt: "2026-05-09T00:01:03.000Z",
			completedAt: "2026-05-09T00:01:03.000Z",
		},
		course: baseCourse,
		video: baseVideo,
		chapterCount: 4,
	});

	assert.equal(
		processingAfterTranscript.timeline.find((step) => step.key === "transcript")
			?.status,
		"completed",
	);
	assert.equal(
		processingAfterTranscript.timeline.find((step) => step.key === "chapters")
			?.status,
		"processing",
	);
	assert.equal(
		creatorTimestampCompleted.timeline.find((step) => step.key === "transcript")
			?.status,
		"skipped",
	);
	assert.equal(
		creatorTimestampCompleted.timeline.find((step) => step.key === "chapters")
			?.status,
		"completed",
	);
});

test("generation detail allows active cancellation and cancelled retries", () => {
	const processing = toGenerationJobDetail({
		job: {
			...baseJob,
			status: "processing",
			startedAt: "2026-05-09T00:01:00.000Z",
		},
		course: baseCourse,
		video: baseVideo,
		chapterCount: 0,
	});
	const cancelled = toGenerationJobDetail({
		job: {
			...baseJob,
			status: "cancelled",
			retryable: true,
			failureReason: "Course generation was cancelled.",
		},
		course: baseCourse,
		video: baseVideo,
		chapterCount: 0,
	});

	assert.equal(processing.canCancel, true);
	assert.equal(processing.canRetry, false);
	assert.equal(cancelled.canCancel, false);
	assert.equal(cancelled.canRetry, true);
	assert.equal(
		cancelled.timeline.some((step) => step.status === "failed"),
		true,
	);
});
