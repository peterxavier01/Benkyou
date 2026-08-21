import { useEffect, useRef } from "react";

type PlayerShortcutAction =
	| { type: "adjust_volume"; delta: number }
	| { type: "seek"; seconds: number }
	| { type: "toggle_fullscreen" }
	| { type: "toggle_mute" }
	| { type: "toggle_playback" };

interface PlayerKeyboardShortcutOptions {
	muted: boolean;
	onActivity: () => void;
	onMutedChange: (muted: boolean) => void;
	onSeek: (seconds: number) => void;
	onToggleFullscreen: () => void;
	onTogglePlayback: () => void;
	onVolumeChange: (volume: number) => void;
	target: HTMLElement | null;
	volume: number;
}

const TEXT_ENTRY_SELECTOR = [
	"textarea",
	"select",
	"[contenteditable]:not([contenteditable='false'])",
	"input:not([type='button']):not([type='reset']):not([type='submit'])",
].join(",");

const KEYBOARD_WIDGET_SELECTOR = [
	"[role='combobox']",
	"[role='listbox']",
	"[role='menu']",
	"[role='menuitem']",
	"[role='option']",
	"[role='slider']",
	"[role='tab']",
].join(",");

const SPACE_ACTIVATION_SELECTOR = [
	"a[href]",
	"button",
	"input[type='button']",
	"input[type='reset']",
	"input[type='submit']",
	"[role='button']",
	"[role='link']",
].join(",");

function getPlayerShortcutAction(
	event: Pick<
		KeyboardEvent,
		| "altKey"
		| "code"
		| "ctrlKey"
		| "defaultPrevented"
		| "isComposing"
		| "key"
		| "metaKey"
		| "repeat"
		| "target"
	>,
): PlayerShortcutAction | null {
	if (
		event.defaultPrevented ||
		event.isComposing ||
		event.altKey ||
		event.ctrlKey ||
		event.metaKey
	) {
		return null;
	}

	const target = event.target instanceof Element ? event.target : null;
	if (
		target?.closest(TEXT_ENTRY_SELECTOR) ||
		target?.closest(KEYBOARD_WIDGET_SELECTOR)
	) {
		return null;
	}

	const key = event.key.toLowerCase();
	const isSpace = event.code === "Space" || event.key === " ";

	if (isSpace && target?.closest(SPACE_ACTIVATION_SELECTOR)) {
		return null;
	}

	if (isSpace || key === "k") {
		return event.repeat ? null : { type: "toggle_playback" };
	}
	if (key === "arrowleft") return { type: "seek", seconds: -10 };
	if (key === "arrowright") return { type: "seek", seconds: 10 };
	if (key === "j") return { type: "seek", seconds: -10 };
	if (key === "l") return { type: "seek", seconds: 10 };
	if (key === "arrowup") return { type: "adjust_volume", delta: 5 };
	if (key === "arrowdown") return { type: "adjust_volume", delta: -5 };
	if (key === "m") return event.repeat ? null : { type: "toggle_mute" };
	if (key === "f") return event.repeat ? null : { type: "toggle_fullscreen" };

	return null;
}

function usePlayerKeyboardShortcuts(options: PlayerKeyboardShortcutOptions) {
	const optionsRef = useRef(options);
	optionsRef.current = options;
	const target = options.target;

	useEffect(() => {
		if (!target) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			const current = optionsRef.current;
			current.onActivity();

			const action = getPlayerShortcutAction(event);
			if (!action) return;

			event.preventDefault();
			event.stopPropagation();

			switch (action.type) {
				case "adjust_volume":
					current.onVolumeChange(current.volume + action.delta);
					break;
				case "seek":
					current.onSeek(action.seconds);
					break;
				case "toggle_fullscreen":
					current.onToggleFullscreen();
					break;
				case "toggle_mute":
					current.onMutedChange(!current.muted);
					break;
				case "toggle_playback":
					current.onTogglePlayback();
					break;
			}
		};

		target.addEventListener("keydown", handleKeyDown, true);
		return () => target.removeEventListener("keydown", handleKeyDown, true);
	}, [target]);
}

export {
	getPlayerShortcutAction,
	type PlayerShortcutAction,
	usePlayerKeyboardShortcuts,
};
