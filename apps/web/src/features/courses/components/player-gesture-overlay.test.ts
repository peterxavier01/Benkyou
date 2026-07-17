import { describe, expect, test } from "vitest";
import {
	classifyPlayerGesture,
	MAX_TAP_DURATION_MS,
	MAX_TAP_MOVEMENT_PX,
} from "./player-gesture-overlay";

const tap = {
	controlsHidden: false,
	durationMs: 100,
	isDoubleTap: false,
	isPrimary: true,
	movementPx: 0,
	pointerType: "touch",
	xRatio: 0.5,
};

describe("classifyPlayerGesture", () => {
	test("single taps only change control visibility", () => {
		expect(classifyPlayerGesture(tap)).toBe("hide_controls");
		expect(classifyPlayerGesture({ ...tap, controlsHidden: true })).toBe(
			"show_controls",
		);
	});

	test("double taps seek only in the left and right thirds", () => {
		expect(
			classifyPlayerGesture({ ...tap, isDoubleTap: true, xRatio: 0.2 }),
		).toBe("seek_backward");
		expect(
			classifyPlayerGesture({ ...tap, isDoubleTap: true, xRatio: 0.5 }),
		).toBe("none");
		expect(
			classifyPlayerGesture({ ...tap, isDoubleTap: true, xRatio: 0.8 }),
		).toBe("seek_forward");
	});

	test("ignores mouse, secondary, long, and moved pointers", () => {
		expect(classifyPlayerGesture({ ...tap, pointerType: "mouse" })).toBe(
			"none",
		);
		expect(classifyPlayerGesture({ ...tap, isPrimary: false })).toBe("none");
		expect(
			classifyPlayerGesture({ ...tap, durationMs: MAX_TAP_DURATION_MS + 1 }),
		).toBe("none");
		expect(
			classifyPlayerGesture({ ...tap, movementPx: MAX_TAP_MOVEMENT_PX + 1 }),
		).toBe("none");
	});

	test("accepts pen input and exact duration and movement boundaries", () => {
		expect(
			classifyPlayerGesture({
				...tap,
				pointerType: "pen",
				durationMs: MAX_TAP_DURATION_MS,
				movementPx: MAX_TAP_MOVEMENT_PX,
			}),
		).toBe("hide_controls");
	});
});
