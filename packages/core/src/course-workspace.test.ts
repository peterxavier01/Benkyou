import assert from "node:assert/strict";
import test from "node:test";

import { upsertPlaybackProgressRequestV1Schema } from "./course-workspace";

test("upsert playback progress schema accepts batched course and chapter progress", () => {
	const result = upsertPlaybackProgressRequestV1Schema.parse({
		courseId: "00000000-0000-4000-8000-000000000001",
		resumeSeconds: 120,
		completionPercent: 45,
		occurredAt: "2026-05-19T12:00:00.000Z",
		chapters: [
			{
				chapterId: "00000000-0000-4000-8000-000000000002",
				watchedSeconds: 58,
				completed: true,
			},
		],
	});

	assert.equal(result.resumeSeconds, 120);
	assert.equal(result.chapters[0]?.completed, true);
});

test("upsert playback progress schema rejects invalid progress values", () => {
	assert.throws(() =>
		upsertPlaybackProgressRequestV1Schema.parse({
			courseId: "00000000-0000-4000-8000-000000000001",
			resumeSeconds: -1,
			completionPercent: 101,
			occurredAt: "2026-05-19T12:00:00.000Z",
			chapters: [],
		}),
	);
});
