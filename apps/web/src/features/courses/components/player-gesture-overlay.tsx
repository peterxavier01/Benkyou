import { HugeIcon } from "@benkyou/ui";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const DOUBLE_TAP_WINDOW_MS = 250;
const MAX_TAP_DURATION_MS = 350;
const MAX_TAP_MOVEMENT_PX = 12;

type PlayerGestureAction =
	| "show_controls"
	| "hide_controls"
	| "seek_backward"
	| "seek_forward"
	| "none";

interface TapInput {
	controlsHidden: boolean;
	isDoubleTap: boolean;
	isPrimary: boolean;
	pointerType: string;
	durationMs: number;
	movementPx: number;
	xRatio: number;
}

interface PlayerGestureOverlayProps {
	controlsHidden: boolean;
	onHideControls: () => void;
	onSeek: (deltaSeconds: number) => void;
	onShowControls: () => void;
}

function classifyPlayerGesture(input: TapInput): PlayerGestureAction {
	if (
		!input.isPrimary ||
		(input.pointerType !== "touch" && input.pointerType !== "pen") ||
		input.durationMs > MAX_TAP_DURATION_MS ||
		input.movementPx > MAX_TAP_MOVEMENT_PX
	) {
		return "none";
	}
	if (!input.isDoubleTap)
		return input.controlsHidden ? "show_controls" : "hide_controls";
	if (input.xRatio < 1 / 3) return "seek_backward";
	if (input.xRatio > 2 / 3) return "seek_forward";
	return "none";
}

function PlayerGestureOverlay({
	controlsHidden,
	onHideControls,
	onSeek,
	onShowControls,
}: PlayerGestureOverlayProps) {
	const pointerStartRef = useRef<{
		id: number;
		time: number;
		x: number;
		y: number;
	} | null>(null);
	const lastTapRef = useRef<{
		time: number;
		zone: "left" | "center" | "right";
	} | null>(null);
	const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [feedback, setFeedback] = useState<"backward" | "forward" | null>(null);

	const clearSingleTap = useCallback(() => {
		if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
		singleTapTimerRef.current = null;
	}, []);

	const showSeekFeedback = useCallback((direction: "backward" | "forward") => {
		if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
		setFeedback(direction);
		feedbackTimerRef.current = setTimeout(() => {
			setFeedback(null);
			feedbackTimerRef.current = null;
		}, 600);
	}, []);

	useEffect(
		() => () => {
			clearSingleTap();
			if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
		},
		[clearSingleTap],
	);

	const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (
			!event.isPrimary ||
			(event.pointerType !== "touch" && event.pointerType !== "pen")
		)
			return;
		pointerStartRef.current = {
			id: event.pointerId,
			time: event.timeStamp,
			x: event.clientX,
			y: event.clientY,
		};
	};

	const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
		const start = pointerStartRef.current;
		pointerStartRef.current = null;
		if (!start || start.id !== event.pointerId) return;

		const rect = event.currentTarget.getBoundingClientRect();
		const xRatio =
			rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
		const zone = xRatio < 1 / 3 ? "left" : xRatio > 2 / 3 ? "right" : "center";
		const previousTap = lastTapRef.current;
		const isDoubleTap = Boolean(
			previousTap &&
				event.timeStamp - previousTap.time <= DOUBLE_TAP_WINDOW_MS &&
				previousTap.zone === zone,
		);
		const action = classifyPlayerGesture({
			controlsHidden,
			durationMs: event.timeStamp - start.time,
			isDoubleTap,
			isPrimary: event.isPrimary,
			movementPx: Math.hypot(event.clientX - start.x, event.clientY - start.y),
			pointerType: event.pointerType,
			xRatio,
		});

		if (isDoubleTap) {
			clearSingleTap();
			lastTapRef.current = null;
			if (action === "seek_backward" || action === "seek_forward") {
				const direction = action === "seek_backward" ? "backward" : "forward";
				onSeek(direction === "backward" ? -10 : 10);
				showSeekFeedback(direction);
			}
			return;
		}
		if (action === "none") return;

		lastTapRef.current = { time: event.timeStamp, zone };
		clearSingleTap();
		singleTapTimerRef.current = setTimeout(() => {
			if (action === "show_controls") onShowControls();
			else onHideControls();
			lastTapRef.current = null;
			singleTapTimerRef.current = null;
		}, DOUBLE_TAP_WINDOW_MS);
	};

	return (
		<div
			aria-hidden="true"
			data-player-interaction-overlay
			onPointerCancel={() => {
				pointerStartRef.current = null;
			}}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerEnd}
		>
			{feedback ? (
				<div data-player-seek-feedback data-direction={feedback}>
					<HugeIcon
						name={feedback === "backward" ? "arrowLeft" : "arrowRight"}
						className="size-5"
					/>
					<span>10 seconds</span>
				</div>
			) : null}
		</div>
	);
}

export {
	classifyPlayerGesture,
	DOUBLE_TAP_WINDOW_MS,
	MAX_TAP_DURATION_MS,
	MAX_TAP_MOVEMENT_PX,
	PlayerGestureOverlay,
};
