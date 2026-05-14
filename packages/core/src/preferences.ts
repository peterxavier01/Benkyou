import type { UpdateLearningPreferencesRequestV1 } from "@benkyou/types";
import { z } from "zod";
import {
	DEFAULT_LEARNING_PREFERENCES,
	LEARNING_PLAYBACK_SPEEDS,
} from "./constants";

export const learningPreferencesSchema = z.object({
	playbackSpeed: z.union([
		z.literal(0.25),
		z.literal(0.5),
		z.literal(0.75),
		z.literal(1),
		z.literal(1.25),
		z.literal(1.5),
		z.literal(1.75),
		z.literal(2),
	]),
	autoplayNextChapter: z.boolean(),
	manualCompletionOnly: z.boolean(),
}) satisfies z.ZodType<UpdateLearningPreferencesRequestV1>;

export const updateLearningPreferencesRequestV1Schema =
	learningPreferencesSchema;

export function getDefaultLearningPreferences() {
	return { ...DEFAULT_LEARNING_PREFERENCES };
}

export function isSupportedPlaybackSpeed(value: number) {
	return LEARNING_PLAYBACK_SPEEDS.some((speed) => speed === value);
}
