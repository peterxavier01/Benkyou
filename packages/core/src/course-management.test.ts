import assert from "node:assert/strict";
import test from "node:test";

import { validateChapterTimeRange } from "./course-management";

const chapters = [
	{ chapterId: "a", startSeconds: 0, endSeconds: 60 },
	{ chapterId: "b", startSeconds: 60, endSeconds: 120 },
	{ chapterId: "c", startSeconds: 120, endSeconds: null },
];

test("chapter time validation accepts adjacent ranges and null final end", () => {
	assert.deepEqual(
		validateChapterTimeRange({
			chapterId: "b",
			startSeconds: 65,
			endSeconds: 120,
			chapters,
			videoDurationSeconds: 180,
		}),
		{ ok: true },
	);
});

test("chapter time validation rejects end before start", () => {
	const result = validateChapterTimeRange({
		chapterId: "b",
		startSeconds: 100,
		endSeconds: 80,
		chapters,
		videoDurationSeconds: 180,
	});

	assert.equal(result.ok, false);
});

test("chapter time validation rejects overlaps", () => {
	const result = validateChapterTimeRange({
		chapterId: "b",
		startSeconds: 55,
		endSeconds: 120,
		chapters,
		videoDurationSeconds: 180,
	});

	assert.equal(result.ok, false);
	assert.equal(result.message, "Chapter times cannot overlap.");
});

test("chapter time validation rejects duration overflow", () => {
	const result = validateChapterTimeRange({
		chapterId: "c",
		startSeconds: 120,
		endSeconds: 200,
		chapters,
		videoDurationSeconds: 180,
	});

	assert.equal(result.ok, false);
});
