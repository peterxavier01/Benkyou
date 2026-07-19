import { Button, HugeIcon } from "@benkyou/ui";
import { useCallback, useEffect, useRef, useState } from "react";

const FULLSCREEN_CONTROLS_HIDE_DELAY_MS = 3_000;

interface PlayerFullscreenButtonProps {
	className?: string;
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
	const playerSurfaceNodeRef = useRef<HTMLDivElement | null>(null);
	const [playerSurfaceElement, setPlayerSurfaceElement] =
		useState<HTMLDivElement | null>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isSupported, setIsSupported] = useState(true);
	const [fullscreenError, setFullscreenError] = useState<string | null>(null);

	useEffect(() => {
		const surface = playerSurfaceNodeRef.current;
		if (surface) {
			setIsSupported(canUseFullscreen(surface));
		}

		const handleFullscreenChange = () => {
			const active = getFullscreenElement() === playerSurfaceNodeRef.current;
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

	const playerSurfaceRef = useCallback((node: HTMLDivElement | null) => {
		playerSurfaceNodeRef.current = node;
		setPlayerSurfaceElement(node);
	}, []);

	const toggleFullscreen = async () => {
		const surface = playerSurfaceNodeRef.current;

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
		playerSurfaceElement,
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
		controlsBlocked: controlsFocused || controlsInteracting,
		controlsHidden: false,
		isFullscreen,
		isPlaying,
	});
	const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const controlsBlocked = controlsFocused || controlsInteracting;
	const shouldAutoHide = isFullscreen && !controlsBlocked;

	if (
		controlVisibility.controlsBlocked !== controlsBlocked ||
		controlVisibility.isFullscreen !== isFullscreen ||
		controlVisibility.isPlaying !== isPlaying
	) {
		setControlVisibility({
			controlsBlocked,
			controlsHidden: false,
			isFullscreen,
			isPlaying,
		});
	}

	const controlsHidden =
		shouldAutoHide &&
		controlVisibility.controlsBlocked === controlsBlocked &&
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
				setControlVisibility((current) =>
					current.isPlaying === isPlaying
						? { ...current, controlsHidden: true }
						: current,
				);
			}
			hideTimerRef.current = null;
		}, hideDelayMs);
	}, [clearHideTimer, hideDelayMs, isPlaying, shouldAutoHide]);

	const showControls = useCallback(() => {
		setControlVisibility((current) => ({
			...current,
			controlsHidden: false,
		}));
		scheduleHideTimer();
	}, [scheduleHideTimer]);

	const hideControls = useCallback(() => {
		if (!isFullscreen) return;
		clearHideTimer();
		setControlVisibility((current) => ({
			...current,
			controlsHidden: true,
		}));
	}, [clearHideTimer, isFullscreen]);

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
		hideControls,
		showControls,
	};
}

function shouldShowFullscreenControlsForPointerMovement(pointerType: string) {
	return pointerType === "mouse";
}

function isPlaybackStateTransition(current: boolean, next: boolean) {
	return current !== next;
}

function PlayerFullscreenButton({
	className,
	isFullscreen,
	isSupported,
	onToggle,
}: PlayerFullscreenButtonProps) {
	const label = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";

	return (
		<Button
			aria-label={label}
			className={className}
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
	isPlaybackStateTransition,
	PlayerFullscreenButton,
	shouldShowFullscreenControlsForPointerMovement,
	useFullscreenControlVisibility,
	usePlayerFullscreen,
};
