import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	formatCompactDuration,
	getChapterDurationSeconds,
	getChapterEndSeconds,
	getRelativeChapterSeconds,
} from "./chapter-timing";

const chapters = [
	{ id: "intro", startSeconds: 0, endSeconds: 90 },
	{ id: "setup", startSeconds: 90, endSeconds: null },
	{ id: "build", startSeconds: 240, endSeconds: null },
];

describe("chapter timing helpers", () => {
	it("uses explicit endSeconds when present", () => {
		assert.equal(getChapterEndSeconds(chapters[0], chapters, 600), 90);
		assert.equal(getChapterDurationSeconds(chapters[0], chapters, 600), 90);
	});

	it("falls back to the next chapter start when endSeconds is missing", () => {
		assert.equal(getChapterEndSeconds(chapters[1], chapters, 600), 240);
		assert.equal(getChapterDurationSeconds(chapters[1], chapters, 600), 150);
	});

	it("falls back to video duration for the final chapter", () => {
		assert.equal(getChapterEndSeconds(chapters[2], chapters, 600), 600);
		assert.equal(getChapterDurationSeconds(chapters[2], chapters, 600), 360);
	});

	it("returns null end and clamps duration when no reliable end exists", () => {
		assert.equal(getChapterEndSeconds(chapters[2], chapters, null), null);
		assert.equal(getChapterDurationSeconds(chapters[2], chapters, null), 1);
	});

	it("converts absolute video time into relative chapter time", () => {
		assert.equal(getRelativeChapterSeconds(125, chapters[1]), 35);
		assert.equal(getRelativeChapterSeconds(80, chapters[1]), 0);
	});

	it("formats compact duration labels", () => {
		assert.equal(formatCompactDuration(60), "1 min");
		assert.equal(formatCompactDuration(540), "9 min");
		assert.equal(formatCompactDuration(4_320), "1h 12m");
		assert.equal(formatCompactDuration(null), null);
	});
});
