import assert from "node:assert/strict";
import test from "node:test";
import type { CourseLibraryItemDTO } from "@benkyou/types";

import {
	createShelfRequestV1Schema,
	moveInOrder,
	summarizeShelf,
} from "./shelves";

function notebook(
	id: string,
	durationSeconds: number | null,
	completionPercent: number | null,
): CourseLibraryItemDTO {
	return {
		course: { id, title: id } as CourseLibraryItemDTO["course"],
		video: { durationSeconds } as CourseLibraryItemDTO["video"],
		chapterCount: 3,
		progress:
			completionPercent === null
				? null
				: ({ completionPercent } as CourseLibraryItemDTO["progress"]),
		latestGenerationJob: null,
	};
}

test("summarizeShelf weights progress by video length", () => {
	const summary = summarizeShelf([
		notebook("done", 3600, 100),
		notebook("half", 1800, 50),
		notebook("new", 1800, null),
	]);

	assert.equal(summary.notebookCount, 3);
	assert.equal(summary.doneCount, 1);
	assert.equal(summary.totalSeconds, 7200);
	assert.equal(summary.percent, 63);
	assert.equal(summary.remainingSeconds, 2700);
	assert.equal(summary.next?.course.id, "half");
});

test("summarizeShelf falls back to an average when lengths are unknown", () => {
	const summary = summarizeShelf([
		notebook("a", null, 100),
		notebook("b", null, 0),
	]);

	assert.equal(summary.percent, 50);
	assert.equal(summary.next?.course.id, "b");
});

test("summarizeShelf handles empty and finished shelves", () => {
	assert.equal(summarizeShelf([]).percent, 0);
	assert.equal(summarizeShelf([]).next, null);
	assert.equal(summarizeShelf([notebook("a", 60, 100)]).next, null);
});

test("moveInOrder swaps neighbours and stops at the edges", () => {
	assert.deepEqual(moveInOrder(["a", "b", "c"], "b", -1), ["b", "a", "c"]);
	assert.deepEqual(moveInOrder(["a", "b", "c"], "b", 1), ["a", "c", "b"]);
	assert.deepEqual(moveInOrder(["a", "b"], "a", -1), ["a", "b"]);
	assert.deepEqual(moveInOrder(["a", "b"], "x", 1), ["a", "b"]);
});

test("createShelfRequestV1Schema trims and requires a name", () => {
	assert.equal(
		createShelfRequestV1Schema.parse({ name: "  Backend  " }).name,
		"Backend",
	);
	assert.equal(createShelfRequestV1Schema.safeParse({ name: "  " }).success, false);
});
