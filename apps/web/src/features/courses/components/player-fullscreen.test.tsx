import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	FULLSCREEN_CONTROLS_HIDE_DELAY_MS,
	isPlaybackStateTransition,
	shouldShowFullscreenControlsForPointerMovement,
	useFullscreenControlVisibility,
	usePlayerFullscreen,
} from "./player-fullscreen";

afterEach(cleanup);

function FullscreenControlsHarness({
	controlsFocused = false,
	controlsInteracting = false,
	hideDelayMs = FULLSCREEN_CONTROLS_HIDE_DELAY_MS,
	isFullscreen,
	isPlaying,
}: {
	controlsFocused?: boolean;
	controlsInteracting?: boolean;
	hideDelayMs?: number;
	isFullscreen: boolean;
	isPlaying: boolean;
}) {
	const { controlsHidden, controlsVisible, hideControls, showControls } =
		useFullscreenControlVisibility({
			controlsFocused,
			controlsInteracting,
			hideDelayMs,
			isFullscreen,
			isPlaying,
		});

	return (
		<div>
			<output data-testid="state">
				{controlsVisible ? "visible" : "hidden"}
			</output>
			<output data-testid="hidden">
				{controlsHidden ? "hidden" : "available"}
			</output>
			<button type="button" onClick={showControls}>
				activity
			</button>
			<button type="button" onClick={hideControls}>
				hide
			</button>
		</div>
	);
}

function PlayerFullscreenHarness() {
	const { fullscreenError, isFullscreen, playerSurfaceRef, toggleFullscreen } =
		usePlayerFullscreen();

	return (
		<div ref={playerSurfaceRef} data-testid="player-surface" tabIndex={-1}>
			<button type="button" onClick={() => void toggleFullscreen()}>
				Toggle fullscreen
			</button>
			<output data-testid="fullscreen-state">
				{isFullscreen ? "active" : "inactive"}
			</output>
			<output data-testid="fullscreen-error">{fullscreenError}</output>
		</div>
	);
}

describe("useFullscreenControlVisibility", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test("starts visible in fullscreen", () => {
		render(<FullscreenControlsHarness isFullscreen isPlaying />);

		expect(screen.getByTestId("state").textContent).toBe("visible");
		expect(screen.getByTestId("hidden").textContent).toBe("available");
	});

	test("hides after the inactivity delay when fullscreen and playing", () => {
		render(<FullscreenControlsHarness isFullscreen isPlaying />);

		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS - 1);
		});
		expect(screen.getByTestId("state").textContent).toBe("visible");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(screen.getByTestId("state").textContent).toBe("hidden");
		expect(screen.getByTestId("hidden").textContent).toBe("hidden");
	});

	test("hides after the inactivity delay while paused", () => {
		render(<FullscreenControlsHarness isFullscreen isPlaying={false} />);

		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS - 1);
		});
		expect(screen.getByTestId("state").textContent).toBe("visible");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(screen.getByTestId("state").textContent).toBe("hidden");
		expect(screen.getByTestId("hidden").textContent).toBe("hidden");
	});

	test("pausing after controls hide shows them and restarts the timer", () => {
		const { rerender } = render(
			<FullscreenControlsHarness isFullscreen isPlaying />,
		);

		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS);
		});
		expect(screen.getByTestId("state").textContent).toBe("hidden");

		rerender(<FullscreenControlsHarness isFullscreen isPlaying={false} />);

		expect(screen.getByTestId("state").textContent).toBe("visible");
		expect(screen.getByTestId("hidden").textContent).toBe("available");

		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS);
		});
		expect(screen.getByTestId("state").textContent).toBe("hidden");
	});

	test("resuming playback restarts the hide timer", () => {
		const { rerender } = render(
			<FullscreenControlsHarness isFullscreen isPlaying={false} />,
		);

		rerender(<FullscreenControlsHarness isFullscreen isPlaying />);
		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS - 1);
		});
		expect(screen.getByTestId("state").textContent).toBe("visible");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(screen.getByTestId("state").textContent).toBe("hidden");
	});

	test("manual hide works while paused", () => {
		render(<FullscreenControlsHarness isFullscreen isPlaying={false} />);

		fireEvent.click(screen.getByRole("button", { name: "hide" }));

		expect(screen.getByTestId("state").textContent).toBe("hidden");
		expect(screen.getByTestId("hidden").textContent).toBe("hidden");
	});

	test("activity keeps controls visible and restarts the timer", () => {
		render(<FullscreenControlsHarness isFullscreen isPlaying />);

		act(() => {
			vi.advanceTimersByTime(2_000);
		});
		fireEvent.click(screen.getByRole("button", { name: "activity" }));

		act(() => {
			vi.advanceTimersByTime(2_999);
		});
		expect(screen.getByTestId("state").textContent).toBe("visible");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(screen.getByTestId("state").textContent).toBe("hidden");
	});

	test("leaving fullscreen cancels hiding and shows controls", () => {
		const { rerender } = render(
			<FullscreenControlsHarness isFullscreen isPlaying />,
		);

		rerender(<FullscreenControlsHarness isFullscreen={false} isPlaying />);
		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS);
		});

		expect(screen.getByTestId("state").textContent).toBe("visible");
		expect(screen.getByTestId("hidden").textContent).toBe("available");
	});

	test("focused controls do not hide until focus leaves", () => {
		const { rerender } = render(
			<FullscreenControlsHarness controlsFocused isFullscreen isPlaying />,
		);

		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS);
		});
		expect(screen.getByTestId("state").textContent).toBe("visible");

		rerender(<FullscreenControlsHarness isFullscreen isPlaying />);
		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS);
		});
		expect(screen.getByTestId("state").textContent).toBe("hidden");
	});

	test("active control interaction prevents hiding", () => {
		const { rerender } = render(
			<FullscreenControlsHarness controlsInteracting isFullscreen isPlaying />,
		);

		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS);
		});
		expect(screen.getByTestId("state").textContent).toBe("visible");

		rerender(<FullscreenControlsHarness isFullscreen isPlaying />);
		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS);
		});
		expect(screen.getByTestId("state").textContent).toBe("hidden");
	});
});

describe("fullscreen pointer activity", () => {
	test("only mouse movement reveals controls outside the gesture overlay", () => {
		expect(shouldShowFullscreenControlsForPointerMovement("mouse")).toBe(true);
		expect(shouldShowFullscreenControlsForPointerMovement("touch")).toBe(false);
		expect(shouldShowFullscreenControlsForPointerMovement("pen")).toBe(false);
	});
});

describe("playback state activity", () => {
	test("only actual playback transitions count as activity", () => {
		expect(isPlaybackStateTransition(false, true)).toBe(true);
		expect(isPlaybackStateTransition(true, false)).toBe(true);
		expect(isPlaybackStateTransition(true, true)).toBe(false);
		expect(isPlaybackStateTransition(false, false)).toBe(false);
	});
});

describe("usePlayerFullscreen", () => {
	test("focuses the player on entry and restores the trigger on exit", async () => {
		let fullscreenElement: Element | null = null;
		Object.defineProperty(document, "fullscreenEnabled", {
			configurable: true,
			value: true,
		});
		Object.defineProperty(document, "fullscreenElement", {
			configurable: true,
			get: () => fullscreenElement,
		});

		render(<PlayerFullscreenHarness />);
		const surface = screen.getByTestId("player-surface");
		const trigger = screen.getByRole("button", { name: "Toggle fullscreen" });
		const requestFullscreen = vi.fn(async () => {
			fullscreenElement = surface;
			document.dispatchEvent(new Event("fullscreenchange"));
		});
		const exitFullscreen = vi.fn(async () => {
			fullscreenElement = null;
			document.dispatchEvent(new Event("fullscreenchange"));
		});
		Object.defineProperty(surface, "requestFullscreen", {
			configurable: true,
			value: requestFullscreen,
		});
		Object.defineProperty(document, "exitFullscreen", {
			configurable: true,
			value: exitFullscreen,
		});

		trigger.focus();
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByTestId("fullscreen-state").textContent).toBe("active");
		});
		expect(requestFullscreen).toHaveBeenCalledOnce();
		expect(document.activeElement).toBe(surface);

		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByTestId("fullscreen-state").textContent).toBe(
				"inactive",
			);
		});
		expect(exitFullscreen).toHaveBeenCalledOnce();
		expect(document.activeElement).toBe(trigger);
	});

	test("does not move focus when fullscreen entry fails", async () => {
		Object.defineProperty(document, "fullscreenEnabled", {
			configurable: true,
			value: true,
		});
		Object.defineProperty(document, "fullscreenElement", {
			configurable: true,
			value: null,
		});

		render(<PlayerFullscreenHarness />);
		const surface = screen.getByTestId("player-surface");
		const trigger = screen.getByRole("button", { name: "Toggle fullscreen" });
		Object.defineProperty(surface, "requestFullscreen", {
			configurable: true,
			value: vi.fn().mockRejectedValue(new Error("denied")),
		});

		trigger.focus();
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByTestId("fullscreen-error").textContent).toContain(
				"Fullscreen could not start",
			);
		});
		expect(document.activeElement).toBe(trigger);
		expect(screen.getByTestId("fullscreen-state").textContent).toBe("inactive");
	});
});
