import assert from "node:assert/strict";
import test from "node:test";

import {
	getDefaultLearningPreferences,
	isSupportedPlaybackSpeed,
	learningPreferencesSchema,
} from "./preferences";

test("learning preferences defaults match MVP behavior", () => {
	assert.deepEqual(getDefaultLearningPreferences(), {
		playbackSpeed: 1,
		autoplayNextChapter: false,
		manualCompletionOnly: false,
	});
});

test("learning preferences schema accepts supported playback speeds", () => {
	assert.equal(isSupportedPlaybackSpeed(1.5), true);
	assert.equal(isSupportedPlaybackSpeed(1.1), false);
	assert.equal(
		learningPreferencesSchema.safeParse({
			playbackSpeed: 2,
			autoplayNextChapter: true,
			manualCompletionOnly: true,
		}).success,
		true,
	);
});
