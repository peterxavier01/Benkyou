import { Button, HugeIcon } from "@benkyou/ui";
import { useCallback, useEffect, useRef, useState } from "react";

const FULLSCREEN_CONTROLS_HIDE_DELAY_MS = 3_000;

type PlayerInteractionOverlayAction = "show_controls" | "toggle_playback";

interface PlayerFullscreenButtonProps {
	isFullscreen: boolean;
	isSupported: boolean;
	onToggle: () => void;
}

interface FullscreenElement extends HTMLElement {
	webkitRequestFullscreen?: () => Promise<void> | void;
	webkitRequestFullScreen?: () => Promise<void> | void;
}

interface FullscreenDocument extends Document {
	webkitFullscreenElement?: Element | null;
	webkitFullscreenEnabled?: boolean;
	webkitExitFullscreen?: () => Promise<void> | void;
	webkitCancelFullScreen?: () => Promise<void> | void;
}

interface LockableScreenOrientation extends ScreenOrientation {
	lock?: (orientation: "landscape") => Promise<void>;
}

interface UseFullscreenControlVisibilityOptions {
	controlsFocused?: boolean;
	controlsInteracting?: boolean;
	isFullscreen: boolean;
	isPlaying: boolean;
	hideDelayMs?: number;
}

function usePlayerFullscreen() {
	const playerSurfaceRef = useRef<HTMLDivElement | null>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isSupported, setIsSupported] = useState(true);
	const [fullscreenError, setFullscreenError] = useState<string | null>(null);

	useEffect(() => {
		const surface = playerSurfaceRef.current;
		if (surface) {
			setIsSupported(canUseFullscreen(surface));
		}

		const handleFullscreenChange = () => {
			const active = getFullscreenElement() === playerSurfaceRef.current;
			setIsFullscreen(active);

			if (active) {
				void lockLandscapeOrientation();
				return;
			}

			unlockScreenOrientation();
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
			document.removeEventListener(
				"webkitfullscreenchange",
				handleFullscreenChange,
			);
			unlockScreenOrientation();
		};
	}, []);

	const toggleFullscreen = async () => {
		const surface = playerSurfaceRef.current;

		if (!surface) {
			return;
		}

		setFullscreenError(null);

		try {
			if (getFullscreenElement() === surface) {
				await exitFullscreen();
				unlockScreenOrientation();
				return;
			}

			if (!canUseFullscreen(surface)) {
				setIsSupported(false);
				setFullscreenError(
					"Fullscreen is unavailable in this browser. Rotate your device manually.",
				);
				return;
			}

			await requestFullscreen(surface);
			setIsFullscreen(true);
			void lockLandscapeOrientation();
		} catch {
			setFullscreenError(
				"Fullscreen could not start here. Rotate your device manually.",
			);
		}
	};

	return {
		fullscreenError,
		isFullscreen,
		isSupported,
		playerSurfaceRef,
		toggleFullscreen,
	};
}

function useFullscreenControlVisibility({
	controlsFocused = false,
	controlsInteracting = false,
	isFullscreen,
	isPlaying,
	hideDelayMs = FULLSCREEN_CONTROLS_HIDE_DELAY_MS,
}: UseFullscreenControlVisibilityOptions) {
	const [controlVisibility, setControlVisibility] = useState({
		controlsHidden: false,
		isFullscreen,
		isPlaying,
	});
	const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const shouldAutoHide =
		isFullscreen && isPlaying && !controlsFocused && !controlsInteracting;

	if (
		controlVisibility.isFullscreen !== isFullscreen ||
		controlVisibility.isPlaying !== isPlaying
	) {
		setControlVisibility({
			controlsHidden: false,
			isFullscreen,
			isPlaying,
		});
	}

	const controlsHidden =
		shouldAutoHide &&
		controlVisibility.isFullscreen === isFullscreen &&
		controlVisibility.isPlaying === isPlaying
			? controlVisibility.controlsHidden
			: false;
	const controlsVisible = !controlsHidden;

	const clearHideTimer = useCallback(() => {
		if (!hideTimerRef.current) {
			return;
		}

		clearTimeout(hideTimerRef.current);
		hideTimerRef.current = null;
	}, []);

	const scheduleHideTimer = useCallback(() => {
		clearHideTimer();

		if (!shouldAutoHide) {
			return;
		}

		hideTimerRef.current = setTimeout(() => {
			if (shouldAutoHide) {
				setControlVisibility((current) => ({
					...current,
					controlsHidden: true,
				}));
			}
			hideTimerRef.current = null;
		}, hideDelayMs);
	}, [clearHideTimer, hideDelayMs, shouldAutoHide]);

	const showControls = useCallback(() => {
		setControlVisibility((current) => ({
			...current,
			controlsHidden: false,
		}));
		scheduleHideTimer();
	}, [scheduleHideTimer]);

	useEffect(() => {
		if (!shouldAutoHide) {
			clearHideTimer();
			return;
		}

		scheduleHideTimer();

		return clearHideTimer;
	}, [clearHideTimer, scheduleHideTimer, shouldAutoHide]);

	return {
		controlsHidden: isFullscreen && controlsHidden,
		controlsVisible,
		showControls,
	};
}

function getPlayerInteractionOverlayAction({
	controlsHidden,
}: {
	controlsHidden: boolean;
}): PlayerInteractionOverlayAction {
	return controlsHidden ? "show_controls" : "toggle_playback";
}

function PlayerFullscreenButton({
	isFullscreen,
	isSupported,
	onToggle,
}: PlayerFullscreenButtonProps) {
	const label = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";

	return (
		<Button
			aria-label={label}
			disabled={!isSupported}
			onClick={onToggle}
			size="icon-sm"
			title={isSupported ? label : "Fullscreen is unavailable in this browser."}
			type="button"
			variant="outline"
		>
			<HugeIcon
				name={isFullscreen ? "minimizeScreen" : "fullScreen"}
				className="size-4"
			/>
		</Button>
	);
}

function canUseFullscreen(element: FullscreenElement) {
	const doc = document as FullscreenDocument;

	return Boolean(
		document.fullscreenEnabled ||
			doc.webkitFullscreenEnabled ||
			element.requestFullscreen ||
			element.webkitRequestFullscreen ||
			element.webkitRequestFullScreen,
	);
}

function getFullscreenElement() {
	const doc = document as FullscreenDocument;
	return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function requestFullscreen(element: FullscreenElement) {
	if (element.requestFullscreen) {
		await element.requestFullscreen();
		return;
	}

	if (element.webkitRequestFullscreen) {
		await Promise.resolve(element.webkitRequestFullscreen());
		return;
	}

	if (element.webkitRequestFullScreen) {
		await Promise.resolve(element.webkitRequestFullScreen());
	}
}

async function exitFullscreen() {
	const doc = document as FullscreenDocument;

	if (document.exitFullscreen) {
		await document.exitFullscreen();
		return;
	}

	if (doc.webkitExitFullscreen) {
		await Promise.resolve(doc.webkitExitFullscreen());
		return;
	}

	if (doc.webkitCancelFullScreen) {
		await Promise.resolve(doc.webkitCancelFullScreen());
	}
}

async function lockLandscapeOrientation() {
	const orientation = getScreenOrientation();

	if (!orientation || typeof orientation.lock !== "function") {
		return;
	}

	try {
		await orientation.lock("landscape");
	} catch {
		// Some browsers require fullscreen or deny orientation locks entirely.
	}
}

function unlockScreenOrientation() {
	const orientation = getScreenOrientation();

	if (!orientation || typeof orientation.unlock !== "function") {
		return;
	}

	try {
		orientation.unlock();
	} catch {
		// Ignore denied unlocks because exiting fullscreen already restores control.
	}
}

function getScreenOrientation() {
	return globalThis.screen?.orientation as
		| LockableScreenOrientation
		| undefined;
}

export {
	FULLSCREEN_CONTROLS_HIDE_DELAY_MS,
	getPlayerInteractionOverlayAction,
	PlayerFullscreenButton,
	useFullscreenControlVisibility,
	usePlayerFullscreen,
};
