import { LOCAL_STORAGE_KEYS } from "@benkyou/core";
import { Button } from "@benkyou/ui";
import { useEffect, useState } from "react";

function PlayerGestureHint({ isFullscreen }: { isFullscreen: boolean }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!isFullscreen || !window.matchMedia("(pointer: coarse)").matches) {
			setVisible(false);
			return;
		}

		if (window.localStorage.getItem(LOCAL_STORAGE_KEYS.playerGestureHint)) {
			return;
		}

		setVisible(true);
		const timeoutId = window.setTimeout(() => {
			setVisible(false);
			window.localStorage.setItem(
				LOCAL_STORAGE_KEYS.playerGestureHint,
				"dismissed",
			);
		}, 5_000);

		return () => window.clearTimeout(timeoutId);
	}, [isFullscreen]);

	const dismiss = () => {
		setVisible(false);
		window.localStorage.setItem(
			LOCAL_STORAGE_KEYS.playerGestureHint,
			"dismissed",
		);
	};

	if (!visible) return null;

	return (
		<output className="absolute top-4 left-1/2 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
			<p className="text-sm leading-5">
				Tap for controls · Double-tap either side to seek 10s
			</p>
			<Button
				className="min-h-11"
				onClick={dismiss}
				type="button"
				variant="ghost"
			>
				Got it
			</Button>
		</output>
	);
}

export { PlayerGestureHint };
