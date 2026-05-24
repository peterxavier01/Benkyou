import assert from "node:assert/strict";
import test from "node:test";

import {
	fetchYouTubeTranscript,
	parseYouTubeDataApiVideoMetadata,
	parseYouTubeDuration,
	resolveYouTubeTranscriptProvider,
	sampleTranscriptSegmentsAcrossDuration,
	type TranscriptSegment,
	transcriptSegmentsToText,
	YouTubeTranscriptFetchError,
} from "./youtube";

function makeSegments(
	count: number,
	intervalSeconds: number,
): TranscriptSegment[] {
	return Array.from({ length: count }, (_, index) => ({
		text: `segment ${index}`,
		startSeconds: index * intervalSeconds,
		durationSeconds: intervalSeconds,
	}));
}

test("parseYouTubeDuration converts ISO 8601 durations to seconds", () => {
	assert.equal(parseYouTubeDuration("PT1H2M3S"), 3_723);
	assert.equal(parseYouTubeDuration("PT15M"), 900);
	assert.equal(parseYouTubeDuration("P1DT2H"), 93_600);
	assert.equal(parseYouTubeDuration("not-a-duration"), null);
});

test("YouTube Data API metadata preserves category, tags, and topics", () => {
	const metadata = parseYouTubeDataApiVideoMetadata({
		items: [
			{
				snippet: {
					title: "Learn TypeScript",
					description: "A practical tutorial.",
					channelTitle: "Benkyou Tests",
					channelId: "channel-1",
					categoryId: "27",
					tags: ["typescript", "tutorial", 123],
					thumbnails: { high: { url: "https://img.test/high.jpg" } },
				},
				contentDetails: { duration: "PT12M3S" },
				topicDetails: {
					topicCategories: [
						"https://en.wikipedia.org/wiki/Technology",
						null,
						"https://en.wikipedia.org/wiki/Education",
					],
				},
			},
		],
	});

	assert.equal(metadata?.categoryId, "27");
	assert.deepEqual(metadata?.tags, ["typescript", "tutorial"]);
	assert.deepEqual(metadata?.topicCategories, [
		"https://en.wikipedia.org/wiki/Technology",
		"https://en.wikipedia.org/wiki/Education",
	]);
	assert.equal(metadata?.durationSeconds, 723);
	assert.deepEqual(metadata?.rawMetadata.topicDetails, {
		topicCategories: [
			"https://en.wikipedia.org/wiki/Technology",
			null,
			"https://en.wikipedia.org/wiki/Education",
		],
	});
});

test("long transcript sampling includes beginning, middle, and end regions", () => {
	const segments = makeSegments(1_000, 60);
	const sampled = sampleTranscriptSegmentsAcrossDuration(segments, 60_000, 100);

	assert.equal(sampled.length <= 100, true);
	assert.equal(
		sampled.some((segment) => segment.startSeconds < 10 * 60),
		true,
	);
	assert.equal(
		sampled.some(
			(segment) =>
				segment.startSeconds >= 29_000 && segment.startSeconds <= 31_000,
		),
		true,
	);
	assert.equal(
		sampled.some((segment) => segment.startSeconds > 59_000 - 10 * 60),
		true,
	);
});

test("transcript text uses sampled windows for coarse fallback policy", () => {
	const segments = makeSegments(1_000, 60);
	const text = transcriptSegmentsToText(segments, {
		durationSeconds: 60_000,
		policy: {
			minChapters: 12,
			maxChapters: 25,
			targetChaptersLabel: "12-25",
			isCoarseFallback: true,
			transcriptMode: "sampled_windows",
			transcriptCharacterLimit: 10_000,
		},
	});

	assert.match(text, /\[0s\] segment 0/);
	assert.match(text, /\[30000s\] segment 500/);
	assert.match(text, /\[59940s\] segment 999/);
});

test("auto transcript provider uses TranscriptAPI when a key is configured", () => {
	assert.equal(
		resolveYouTubeTranscriptProvider({
			TRANSCRIPTAPI_API_KEY: "test-key",
			YOUTUBE_TRANSCRIPT_PROVIDER: "auto",
		}),
		"transcriptapi",
	);
});

test("auto transcript provider uses local package without a TranscriptAPI key", () => {
	assert.equal(
		resolveYouTubeTranscriptProvider({
			YOUTUBE_TRANSCRIPT_PROVIDER: "auto",
		}),
		"local",
	);
});

test("local transcript provider ignores TranscriptAPI key", () => {
	assert.equal(
		resolveYouTubeTranscriptProvider({
			TRANSCRIPTAPI_API_KEY: "test-key",
			YOUTUBE_TRANSCRIPT_PROVIDER: "local",
		}),
		"local",
	);
});

test("forced TranscriptAPI provider requires an API key", async () => {
	await assert.rejects(
		() =>
			fetchYouTubeTranscript("video-1", {
				env: { YOUTUBE_TRANSCRIPT_PROVIDER: "transcriptapi" },
				sleep: noopSleep,
			}),
		(error: unknown) =>
			error instanceof YouTubeTranscriptFetchError &&
			error.code === "configuration",
	);
});

test("local transcript provider normalizes package transcript segments", async () => {
	const transcript = await fetchYouTubeTranscript("video-1", {
		env: {
			TRANSCRIPTAPI_API_KEY: "test-key",
			YOUTUBE_TRANSCRIPT_PROVIDER: "local",
		},
		localTranscriptFetcher: async () => [
			{ text: " First ", offset: 0, duration: 1_200 },
			{ text: "   ", offset: 1_200, duration: 800 },
			{ text: "Second", offset: 2_000, duration: 1_200 },
		],
	});

	assert.deepEqual(transcript, [
		{ text: "First", startSeconds: 0, durationSeconds: 1 },
		{ text: "Second", startSeconds: 2, durationSeconds: 1 },
	]);
});

test("local transcript provider preserves long second-based offsets", async () => {
	const transcript = await fetchYouTubeTranscript("video-1", {
		env: {
			YOUTUBE_TRANSCRIPT_PROVIDER: "local",
		},
		localTranscriptFetcher: async () => [
			{ text: "Start", offset: 0, duration: 4 },
			{ text: "Near end", offset: 46_000, duration: 30 },
		],
	});

	assert.deepEqual(transcript, [
		{ text: "Start", startSeconds: 0, durationSeconds: 4 },
		{ text: "Near end", startSeconds: 46_000, durationSeconds: 30 },
	]);
});

test("local transcript provider converts millisecond-based segments", async () => {
	const transcript = await fetchYouTubeTranscript("video-1", {
		env: {
			YOUTUBE_TRANSCRIPT_PROVIDER: "local",
		},
		localTranscriptFetcher: async () => [
			{ text: "Start", offset: 0, duration: 4_120 },
			{ text: "Near end", offset: 46_000_000, duration: 30_000 },
		],
	});

	assert.deepEqual(transcript, [
		{ text: "Start", startSeconds: 0, durationSeconds: 4 },
		{ text: "Near end", startSeconds: 46_000, durationSeconds: 30 },
	]);
});

test("TranscriptAPI response maps JSON segments to transcript segments", async () => {
	const requestedUrls: string[] = [];
	const transcript = await fetchYouTubeTranscript("video-1", {
		env: {
			TRANSCRIPTAPI_API_KEY: "test-key",
			YOUTUBE_TRANSCRIPT_PROVIDER: "transcriptapi",
		},
		fetchImpl: async (input) => {
			requestedUrls.push(String(input));
			return jsonResponse(200, {
				transcript: [
					{ text: " First ", start: 0, duration: 4.12 },
					{ text: "Second", start: 4.12, duration: 3.85 },
				],
			});
		},
		sleep: noopSleep,
	});

	assert.deepEqual(transcript, [
		{ text: "First", startSeconds: 0, durationSeconds: 4 },
		{ text: "Second", startSeconds: 4, durationSeconds: 4 },
	]);
	assert.equal(requestedUrls.length, 1);
	assert.match(requestedUrls[0], /video_url=video-1/);
	assert.match(requestedUrls[0], /format=json/);
	assert.match(requestedUrls[0], /include_timestamp=true/);
});

test("TranscriptAPI response preserves long second-based timestamps", async () => {
	const transcript = await fetchYouTubeTranscript("video-1", {
		env: {
			TRANSCRIPTAPI_API_KEY: "test-key",
			YOUTUBE_TRANSCRIPT_PROVIDER: "transcriptapi",
		},
		fetchImpl: async () =>
			jsonResponse(200, {
				transcript: [
					{ text: "Start", start: 0, duration: 4.12 },
					{ text: "Near end", start: 46_000, duration: 30 },
				],
			}),
		sleep: noopSleep,
	});

	assert.deepEqual(transcript, [
		{ text: "Start", startSeconds: 0, durationSeconds: 4 },
		{ text: "Near end", startSeconds: 46_000, durationSeconds: 30 },
	]);
});

test("TranscriptAPI all-empty transcript maps to empty failure", async () => {
	await assertTranscriptApiFailure({
		code: "empty",
		responses: [
			jsonResponse(200, {
				transcript: [{ text: "   ", start: 0, duration: 1 }],
			}),
		],
	});
});

test("TranscriptAPI malformed transcript maps to provider unavailable", async () => {
	await assertTranscriptApiFailure({
		code: "provider_unavailable",
		responses: [
			jsonResponse(200, {
				transcript: [{ text: "Missing duration", start: 0 }],
			}),
		],
	});
});

test("TranscriptAPI 404 maps to not available", async () => {
	await assertTranscriptApiFailure({
		code: "not_available",
		responses: [jsonResponse(404, { detail: "Not found" })],
	});
});

test("TranscriptAPI 401 maps to configuration", async () => {
	await assertTranscriptApiFailure({
		code: "configuration",
		responses: [jsonResponse(401, { detail: "Unauthorized" })],
	});
});

test("TranscriptAPI 402 maps to payment required", async () => {
	await assertTranscriptApiFailure({
		code: "payment_required",
		responses: [jsonResponse(402, { detail: "Payment required" })],
	});
});

test("TranscriptAPI 429 retries using capped Retry-After then maps to throttled", async () => {
	const sleeps: number[] = [];

	await assertTranscriptApiFailure({
		code: "too_many_requests",
		responses: [
			jsonResponse(429, { detail: "Slow down" }, { "Retry-After": "10" }),
			jsonResponse(429, { detail: "Slow down" }, { "Retry-After": "2" }),
			jsonResponse(429, { detail: "Slow down" }),
		],
		sleep: async (milliseconds) => {
			sleeps.push(milliseconds);
		},
	});

	assert.deepEqual(sleeps, [5_000, 2_000]);
});

test("TranscriptAPI 503 retries twice then maps to provider unavailable", async () => {
	const sleeps: number[] = [];

	await assertTranscriptApiFailure({
		code: "provider_unavailable",
		responses: [
			jsonResponse(503, { detail: "Unavailable" }),
			jsonResponse(408, { detail: "Timeout" }),
			jsonResponse(503, { detail: "Unavailable" }),
		],
		sleep: async (milliseconds) => {
			sleeps.push(milliseconds);
		},
	});

	assert.deepEqual(sleeps, [1_000, 2_000]);
});

function jsonResponse(
	status: number,
	body: unknown,
	headers?: Record<string, string>,
) {
	return new Response(JSON.stringify(body), {
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		status,
	});
}

async function noopSleep() {}

async function assertTranscriptApiFailure(input: {
	code: string;
	responses: Response[];
	sleep?: (milliseconds: number) => Promise<void>;
}) {
	const responses = [...input.responses];

	await assert.rejects(
		() =>
			fetchYouTubeTranscript("video-1", {
				env: {
					TRANSCRIPTAPI_API_KEY: "test-key",
					YOUTUBE_TRANSCRIPT_PROVIDER: "transcriptapi",
				},
				fetchImpl: async () => {
					const response = responses.shift();

					if (!response) {
						throw new Error("No fake response configured.");
					}

					return response;
				},
				sleep: input.sleep ?? noopSleep,
			}),
		(error: unknown) =>
			error instanceof YouTubeTranscriptFetchError &&
			error.code === input.code,
	);

	assert.equal(responses.length, 0);
}
