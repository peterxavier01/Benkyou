import assert from "node:assert/strict";
import test from "node:test";

import {
	parseYouTubeDuration,
	sampleTranscriptSegmentsAcrossDuration,
	transcriptSegmentsToText,
	type TranscriptSegment,
} from "./youtube";

function makeSegments(count: number, intervalSeconds: number): TranscriptSegment[] {
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

test("long transcript sampling includes beginning, middle, and end regions", () => {
	const segments = makeSegments(1_000, 60);
	const sampled = sampleTranscriptSegmentsAcrossDuration(segments, 60_000, 100);

	assert.equal(sampled.length <= 100, true);
	assert.equal(sampled.some((segment) => segment.startSeconds < 10 * 60), true);
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
