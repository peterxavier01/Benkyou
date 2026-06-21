import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	FULLSCREEN_CONTROLS_HIDE_DELAY_MS,
	getPlayerInteractionOverlayAction,
	useFullscreenControlVisibility,
} from "./player-fullscreen";

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
	const { controlsHidden, controlsVisible, showControls } =
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
		</div>
	);
}

describe("useFullscreenControlVisibility", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
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

	test("does not hide while paused", () => {
		render(<FullscreenControlsHarness isFullscreen isPlaying={false} />);

		act(() => {
			vi.advanceTimersByTime(FULLSCREEN_CONTROLS_HIDE_DELAY_MS);
		});

		expect(screen.getByTestId("state").textContent).toBe("visible");
		expect(screen.getByTestId("hidden").textContent).toBe("available");
	});

	test("pausing after controls hide makes them visible", () => {
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

describe("getPlayerInteractionOverlayAction", () => {
	test("reveals controls without toggling playback when controls are hidden", () => {
		expect(getPlayerInteractionOverlayAction({ controlsHidden: true })).toBe(
			"show_controls",
		);
	});

	test("toggles playback when controls are already visible", () => {
		expect(getPlayerInteractionOverlayAction({ controlsHidden: false })).toBe(
			"toggle_playback",
		);
	});
});
