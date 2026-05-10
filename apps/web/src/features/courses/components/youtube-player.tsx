import { useEffect, useRef } from "react";

declare global {
	interface Window {
		YT?: YouTubeNamespace;
		onYouTubeIframeAPIReady?: () => void;
	}
}

interface YouTubeNamespace {
	Player: new (
		element: HTMLElement,
		options: {
			videoId: string;
			playerVars?: Record<string, number | string>;
			events?: {
				onReady?: (event: YouTubePlayerEvent) => void;
				onStateChange?: (event: YouTubeStateChangeEvent) => void;
			};
		},
	) => YouTubePlayerInstance;
	PlayerState: {
		PAUSED: number;
		ENDED: number;
	};
}

interface YouTubePlayerInstance {
	destroy: () => void;
	getCurrentTime: () => number;
	getDuration: () => number;
	seekTo: (seconds: number, allowSeekAhead: boolean) => void;
}

interface YouTubePlayerEvent {
	target: YouTubePlayerInstance;
}

interface YouTubeStateChangeEvent {
	data: number;
	target: YouTubePlayerInstance;
}

interface YouTubePlayerProps {
	providerVideoId: string;
	initialSeconds: number;
	seekToSeconds: number | null;
	onReady: (durationSeconds: number) => void;
	onTimeUpdate: (timeSeconds: number, durationSeconds: number) => void;
	onPauseOrEnd: (timeSeconds: number, durationSeconds: number) => void;
}

let apiPromise: Promise<YouTubeNamespace> | null = null;

function YouTubePlayer({
	providerVideoId,
	initialSeconds,
	seekToSeconds,
	onReady,
	onTimeUpdate,
	onPauseOrEnd,
}: YouTubePlayerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const playerRef = useRef<YouTubePlayerInstance | null>(null);
	const lastSeekRef = useRef<number | null>(null);
	const callbacksRef = useRef({ onReady, onTimeUpdate, onPauseOrEnd });
	const initialPlaybackRef = useRef({
		providerVideoId,
		seconds: initialSeconds,
	});
	const validVideoId = isValidYouTubeVideoId(providerVideoId);

	if (initialPlaybackRef.current.providerVideoId !== providerVideoId) {
		initialPlaybackRef.current = { providerVideoId, seconds: initialSeconds };
		lastSeekRef.current = null;
	}

	callbacksRef.current = { onReady, onTimeUpdate, onPauseOrEnd };

	useEffect(() => {
		let disposed = false;
		let intervalId: number | undefined;
		const startSeconds = Math.max(
			0,
			Math.floor(initialPlaybackRef.current.seconds),
		);

		async function createPlayer() {
			if (!validVideoId) {
				return;
			}

			const yt = await loadYouTubeIframeApi();

			if (disposed || !containerRef.current) {
				return;
			}

			try {
				playerRef.current = new yt.Player(containerRef.current, {
					videoId: providerVideoId,
					playerVars: {
						rel: 0,
						modestbranding: 1,
						playsinline: 1,
						start: startSeconds,
					},
					events: {
						onReady: (event) => {
							const duration = safeDuration(event.target);
							if (startSeconds > 0) {
								event.target.seekTo(startSeconds, true);
							}
							callbacksRef.current.onReady(duration);
						},
						onStateChange: (event) => {
							const duration = safeDuration(event.target);
							if (
								event.data === yt.PlayerState.PAUSED ||
								event.data === yt.PlayerState.ENDED
							) {
								callbacksRef.current.onPauseOrEnd(
									safeTime(event.target),
									duration,
								);
							}
						},
					},
				});
			} catch {
				return;
			}

			intervalId = window.setInterval(() => {
				if (!playerRef.current) {
					return;
				}

				callbacksRef.current.onTimeUpdate(
					safeTime(playerRef.current),
					safeDuration(playerRef.current),
				);
			}, 1000);
		}

		void createPlayer();

		return () => {
			disposed = true;
			if (intervalId) {
				window.clearInterval(intervalId);
			}
			playerRef.current?.destroy();
			playerRef.current = null;
		};
	}, [providerVideoId, validVideoId]);

	useEffect(() => {
		if (seekToSeconds === null || lastSeekRef.current === seekToSeconds) {
			return;
		}

		lastSeekRef.current = seekToSeconds;
		playerRef.current?.seekTo(seekToSeconds, true);
	}, [seekToSeconds]);

	if (!validVideoId) {
		return (
			<div className="flex size-full items-center justify-center bg-muted p-6 text-center text-muted-foreground text-sm">
				Video playback is unavailable for this sample source.
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="size-full"
			title="YouTube course player"
		/>
	);
}

function isValidYouTubeVideoId(value: string) {
	return /^[a-zA-Z0-9_-]{11}$/.test(value);
}

function loadYouTubeIframeApi() {
	if (window.YT?.Player) {
		return Promise.resolve(window.YT);
	}

	if (apiPromise) {
		return apiPromise;
	}

	apiPromise = new Promise((resolve) => {
		const previousReady = window.onYouTubeIframeAPIReady;

		window.onYouTubeIframeAPIReady = () => {
			previousReady?.();
			if (window.YT) {
				resolve(window.YT);
			}
		};

		if (
			!document.querySelector(
				'script[src="https://www.youtube.com/iframe_api"]',
			)
		) {
			const tag = document.createElement("script");
			tag.src = "https://www.youtube.com/iframe_api";
			document.head.appendChild(tag);
		}
	});

	return apiPromise;
}

function safeTime(player: YouTubePlayerInstance) {
	try {
		const value = player.getCurrentTime();
		return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
	} catch {
		return 0;
	}
}

function safeDuration(player: YouTubePlayerInstance) {
	try {
		const value = player.getDuration();
		return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
	} catch {
		return 0;
	}
}

export { YouTubePlayer };
