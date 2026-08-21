import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { usePlayerKeyboardShortcuts } from "./player-keyboard-shortcuts";

afterEach(cleanup);

function ShortcutHarness({
	muted = false,
	volume = 50,
	onActivity = vi.fn(),
	onMutedChange = vi.fn(),
	onSeek = vi.fn(),
	onToggleFullscreen = vi.fn(),
	onTogglePlayback = vi.fn(),
	onVolumeChange = vi.fn(),
}: {
	muted?: boolean;
	volume?: number;
	onActivity?: () => void;
	onMutedChange?: (muted: boolean) => void;
	onSeek?: (seconds: number) => void;
	onToggleFullscreen?: () => void;
	onTogglePlayback?: () => void;
	onVolumeChange?: (volume: number) => void;
}) {
	const [target, setTarget] = useState<HTMLDivElement | null>(null);

	usePlayerKeyboardShortcuts({
		muted,
		onActivity,
		onMutedChange,
		onSeek,
		onToggleFullscreen,
		onTogglePlayback,
		onVolumeChange,
		target,
		volume,
	});

	return (
		<div ref={setTarget} data-testid="surface">
			<button type="button">Player button</button>
			<input aria-label="Editor" />
			<div
				aria-label="Slider"
				aria-valuemax={100}
				aria-valuemin={0}
				aria-valuenow={50}
				role="slider"
				tabIndex={0}
			/>
		</div>
	);
}

describe("usePlayerKeyboardShortcuts", () => {
	test("maps the player shortcut set", () => {
		const onMutedChange = vi.fn();
		const onSeek = vi.fn();
		const onToggleFullscreen = vi.fn();
		const onTogglePlayback = vi.fn();
		const onVolumeChange = vi.fn();

		render(
			<ShortcutHarness
				onMutedChange={onMutedChange}
				onSeek={onSeek}
				onToggleFullscreen={onToggleFullscreen}
				onTogglePlayback={onTogglePlayback}
				onVolumeChange={onVolumeChange}
			/>,
		);
		const surface = screen.getByTestId("surface");

		fireEvent.keyDown(surface, { code: "Space", key: " " });
		fireEvent.keyDown(surface, { key: "k" });
		fireEvent.keyDown(surface, { key: "ArrowLeft" });
		fireEvent.keyDown(surface, { key: "ArrowRight" });
		fireEvent.keyDown(surface, { key: "j" });
		fireEvent.keyDown(surface, { key: "l" });
		fireEvent.keyDown(surface, { key: "ArrowUp" });
		fireEvent.keyDown(surface, { key: "ArrowDown" });
		fireEvent.keyDown(surface, { key: "m" });
		fireEvent.keyDown(surface, { key: "f" });

		expect(onTogglePlayback).toHaveBeenCalledTimes(2);
		expect(onSeek.mock.calls.map(([seconds]) => seconds)).toEqual([
			-10, 10, -10, 10,
		]);
		expect(onVolumeChange.mock.calls.map(([volume]) => volume)).toEqual([
			55, 45,
		]);
		expect(onMutedChange).toHaveBeenCalledWith(true);
		expect(onToggleFullscreen).toHaveBeenCalledOnce();
	});

	test("allows repeats only for seeking and volume", () => {
		const onSeek = vi.fn();
		const onTogglePlayback = vi.fn();
		const onVolumeChange = vi.fn();
		render(
			<ShortcutHarness
				onSeek={onSeek}
				onTogglePlayback={onTogglePlayback}
				onVolumeChange={onVolumeChange}
			/>,
		);
		const surface = screen.getByTestId("surface");

		fireEvent.keyDown(surface, { key: "k", repeat: true });
		fireEvent.keyDown(surface, { key: "ArrowRight", repeat: true });
		fireEvent.keyDown(surface, { key: "ArrowUp", repeat: true });

		expect(onTogglePlayback).not.toHaveBeenCalled();
		expect(onSeek).toHaveBeenCalledWith(10);
		expect(onVolumeChange).toHaveBeenCalledWith(55);
	});

	test("does not override editable fields, widgets, modifiers, or button Space", () => {
		const onActivity = vi.fn();
		const onSeek = vi.fn();
		const onTogglePlayback = vi.fn();
		render(
			<ShortcutHarness
				onActivity={onActivity}
				onSeek={onSeek}
				onTogglePlayback={onTogglePlayback}
			/>,
		);

		fireEvent.keyDown(screen.getByRole("textbox", { name: "Editor" }), {
			key: "ArrowRight",
		});
		fireEvent.keyDown(screen.getByRole("slider", { name: "Slider" }), {
			key: "ArrowRight",
		});
		fireEvent.keyDown(screen.getByRole("button", { name: "Player button" }), {
			code: "Space",
			key: " ",
		});
		fireEvent.keyDown(screen.getByTestId("surface"), {
			ctrlKey: true,
			key: "ArrowRight",
		});

		expect(onSeek).not.toHaveBeenCalled();
		expect(onTogglePlayback).not.toHaveBeenCalled();
		expect(onActivity).toHaveBeenCalledTimes(4);
	});

	test("prevents browser behavior only for handled shortcuts", () => {
		render(<ShortcutHarness />);
		const surface = screen.getByTestId("surface");

		expect(fireEvent.keyDown(surface, { key: "ArrowDown" })).toBe(false);
		expect(fireEvent.keyDown(surface, { key: "Tab" })).toBe(true);
	});
});
