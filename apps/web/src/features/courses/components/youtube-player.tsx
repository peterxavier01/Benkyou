import { type Ref, useEffect, useImperativeHandle, useRef } from "react";

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
		PLAYING: number;
		PAUSED: number;
		ENDED: number;
	};
}

interface YouTubePlayerInstance {
	destroy: () => void;
	getCurrentTime: () => number;
	getDuration: () => number;
	pauseVideo: () => void;
	playVideo: () => void;
	seekTo: (seconds: number, allowSeekAhead: boolean) => void;
	setPlaybackRate?: (suggestedRate: number) => void;
}

interface YouTubePlayerEvent {
	target: YouTubePlayerInstance;
}

interface YouTubeStateChangeEvent {
	data: number;
	target: YouTubePlayerInstance;
}

interface YouTubePlayerProps {
	ref?: Ref<YouTubePlayerHandle>;
	providerVideoId: string;
	initialSeconds: number;
	playbackRate?: number;
	seekToSeconds: number | null;
	onPlayingChange?: (playing: boolean) => void;
	onReady: (durationSeconds: number) => void;
	onTimeUpdate: (timeSeconds: number, durationSeconds: number) => void;
	onPauseOrEnd: (timeSeconds: number, durationSeconds: number) => void;
}

interface YouTubePlaybackSnapshot {
	timeSeconds: number;
	durationSeconds: number;
}

interface YouTubePlayerHandle {
	getPlaybackSnapshot: () => YouTubePlaybackSnapshot | null;
	pause: () => void;
	play: () => void;
	seekTo: (seconds: number, options?: { play?: boolean }) => void;
}

const PLAYBACK_POLL_INTERVAL_MS = 1000;
const SEEK_SETTLE_TOLERANCE_SECONDS = 1;

let apiPromise: Promise<YouTubeNamespace> | null = null;

function YouTubePlayer({
	ref,
	providerVideoId,
	initialSeconds,
	playbackRate = 1,
	seekToSeconds,
	onPlayingChange,
	onReady,
	onTimeUpdate,
	onPauseOrEnd,
}: YouTubePlayerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const playerRef = useRef<YouTubePlayerInstance | null>(null);
	const lastSeekRef = useRef<number | null>(null);
	const pendingSeekSecondsRef = useRef<number | null>(
		Math.max(0, Math.floor(initialSeconds)),
	);
	const playbackRateRef = useRef(playbackRate);
	const callbacksRef = useRef({
		onReady,
		onTimeUpdate,
		onPauseOrEnd,
		onPlayingChange,
	});
	const initialPlaybackRef = useRef({
		providerVideoId,
		seconds: initialSeconds,
	});
	const validVideoId = isValidYouTubeVideoId(providerVideoId);

	useEffect(() => {
		callbacksRef.current = {
			onReady,
			onTimeUpdate,
			onPauseOrEnd,
			onPlayingChange,
		};
	}, [onReady, onTimeUpdate, onPauseOrEnd, onPlayingChange]);

	useEffect(() => {
		playbackRateRef.current = playbackRate;
	}, [playbackRate]);

	useEffect(() => {
		if (initialPlaybackRef.current.providerVideoId !== providerVideoId) {
			const safeInitialSeconds = Math.max(0, Math.floor(initialSeconds));
			initialPlaybackRef.current = {
				providerVideoId,
				seconds: safeInitialSeconds,
			};
			pendingSeekSecondsRef.current = safeInitialSeconds;
			lastSeekRef.current = null;
		}
	}, [initialSeconds, providerVideoId]);

	useImperativeHandle(ref, () => ({
		getPlaybackSnapshot: () => {
			if (!playerRef.current) {
				return null;
			}

			return {
				timeSeconds: safeTime(playerRef.current),
				durationSeconds: safeDuration(playerRef.current),
			};
		},
		pause: () => playerRef.current?.pauseVideo(),
		play: () => playerRef.current?.playVideo(),
		seekTo: (seconds: number, options: { play?: boolean } = {}) => {
			seekPlayer(playerRef.current, seconds, options);
			pendingSeekSecondsRef.current = Math.max(0, Math.floor(seconds));
		},
	}));

	useEffect(() => {
		let disposed = false;
		let intervalId: number | undefined;
		const startSeconds = Math.max(
			0,
			Math.floor(initialPlaybackRef.current.seconds),
		);

		async function createPlayer() {
			const container = containerRef.current;

			if (!validVideoId || !container) {
				return;
			}

			const yt = await loadYouTubeIframeApi();

			if (!disposed) {
				try {
					playerRef.current = new yt.Player(container, {
						videoId: providerVideoId,
						playerVars: {
							rel: 0,
							modestbranding: 1,
							playsinline: 1,
							controls: 0,
							start: startSeconds,
						},
						events: {
							onReady: (event) => {
								const duration = safeDuration(event.target);
								event.target.setPlaybackRate?.(playbackRateRef.current);
								if (startSeconds > 0) {
									event.target.seekTo(startSeconds, true);
								}
								callbacksRef.current.onReady(duration);
							},
							onStateChange: (event) => {
								const duration = safeDuration(event.target);
								if (event.data === yt.PlayerState.PLAYING) {
									callbacksRef.current.onPlayingChange?.(true);
								}
								if (event.data === yt.PlayerState.PAUSED) {
									callbacksRef.current.onPlayingChange?.(false);
									callbacksRef.current.onPauseOrEnd(
										safeTime(event.target),
										duration,
									);
								}
								if (event.data === yt.PlayerState.ENDED) {
									callbacksRef.current.onPlayingChange?.(false);
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

					const timeSeconds = safeTime(playerRef.current);
					const durationSeconds = safeDuration(playerRef.current);
					const pendingSeekSeconds = pendingSeekSecondsRef.current;

					if (pendingSeekSeconds !== null) {
						if (!hasReachedSeekTarget(timeSeconds, pendingSeekSeconds)) {
							return;
						}

						pendingSeekSecondsRef.current = null;
					}

					callbacksRef.current.onTimeUpdate(timeSeconds, durationSeconds);
				}, PLAYBACK_POLL_INTERVAL_MS);
			}
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
		playerRef.current?.setPlaybackRate?.(playbackRate);
	}, [playbackRate]);

	useEffect(() => {
		if (seekToSeconds === null || lastSeekRef.current === seekToSeconds) {
			return;
		}

		lastSeekRef.current = seekToSeconds;
		pendingSeekSecondsRef.current = Math.max(0, Math.floor(seekToSeconds));
		seekPlayer(playerRef.current, seekToSeconds);
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

function hasReachedSeekTarget(timeSeconds: number, targetSeconds: number) {
	return Math.abs(timeSeconds - targetSeconds) <= SEEK_SETTLE_TOLERANCE_SECONDS;
}

function seekPlayer(
	player: YouTubePlayerInstance | null,
	seconds: number,
	options: { play?: boolean } = {},
) {
	if (!player) {
		return;
	}

	player.seekTo(Math.max(0, Math.floor(seconds)), true);

	if (options.play) {
		window.setTimeout(() => player.playVideo(), 0);
	}
}

export {
	YouTubePlayer,
	type YouTubePlayerHandle,
	type YouTubePlaybackSnapshot,
};
