import { describe, expect, test, vi } from "vitest";
import {
	classifyPlayerGesture,
	MAX_TAP_DURATION_MS,
	MAX_TAP_MOVEMENT_PX,
	performSingleTapAction,
} from "./player-gesture-overlay";

const tap = {
	controlsHiddenAtStart: false,
	durationMs: 100,
	isDoubleTap: false,
	isPlaybackControlHit: false,
	isPrimary: true,
	movementPx: 0,
	pointerType: "touch",
	xRatio: 0.5,
};

describe("classifyPlayerGesture", () => {
	test("single taps only change control visibility", () => {
		expect(classifyPlayerGesture(tap)).toBe("hide_controls");
		expect(classifyPlayerGesture({ ...tap, controlsHiddenAtStart: true })).toBe(
			"show_controls",
		);
	});

	test("single taps on the centered playback control toggle playback", () => {
		expect(classifyPlayerGesture({ ...tap, isPlaybackControlHit: true })).toBe(
			"toggle_playback",
		);
		expect(
			classifyPlayerGesture({
				...tap,
				controlsHiddenAtStart: true,
				isPlaybackControlHit: true,
			}),
		).toBe("toggle_playback");
	});

	test("single taps keep the visibility meaning captured at pointer start", () => {
		const hiddenAtPointerStart = {
			...tap,
			controlsHiddenAtStart: true,
		};

		expect(classifyPlayerGesture(hiddenAtPointerStart)).toBe("show_controls");
	});

	test("center playback taps reveal hidden controls and toggle playback", () => {
		const onHideControls = vi.fn();
		const onShowControls = vi.fn();
		const onTogglePlayback = vi.fn();

		performSingleTapAction("toggle_playback", {
			controlsHidden: true,
			onHideControls,
			onShowControls,
			onTogglePlayback,
		});

		expect(onShowControls).toHaveBeenCalledOnce();
		expect(onTogglePlayback).toHaveBeenCalledOnce();
		expect(onHideControls).not.toHaveBeenCalled();
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
