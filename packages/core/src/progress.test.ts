import assert from "node:assert/strict";
import test from "node:test";

import {
	calculateProgressPercent,
	clampProgressPercent,
	isChapterCompleteByWatchTime,
} from "./progress";

test("clampProgressPercent keeps progress between zero and one hundred", () => {
	assert.equal(clampProgressPercent(-10), 0);
	assert.equal(clampProgressPercent(40), 40);
	assert.equal(clampProgressPercent(140), 100);
	assert.equal(clampProgressPercent(Number.NaN), 0);
});

test("calculateProgressPercent handles invalid duration and watched values", () => {
	assert.equal(calculateProgressPercent(45, 90), 50);
	assert.equal(calculateProgressPercent(45, 0), 0);
	assert.equal(calculateProgressPercent(Number.POSITIVE_INFINITY, 90), 0);
});

test("isChapterCompleteByWatchTime uses the configured threshold", () => {
	assert.equal(isChapterCompleteByWatchTime(89, 100), false);
	assert.equal(isChapterCompleteByWatchTime(90, 100), true);
	assert.equal(isChapterCompleteByWatchTime(75, 100, 0.75), true);
});
