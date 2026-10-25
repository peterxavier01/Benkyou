import type * as React from "react";

import { cn } from "#lib/utils";

type TimelineBookmark = {
	/** Seconds from the start. */
	time: number;
	label: string;
};

type PlaybackTimelineProps = {
	/** Total length in seconds. */
	duration: number;
	/** Current position in seconds. */
	position: number;
	/** Chapter start times in seconds. The first (0) is ignored. */
	chapterStarts?: number[];
	bookmarks?: TimelineBookmark[];
	/** Called with a new position in seconds. Omit for a read-only timeline. */
	onSeek?: (seconds: number) => void;
	/** Spoken position, e.g. "33 minutes 47 seconds of 1 hour 24 minutes". */
	valueText?: string;
	label?: string;
	className?: string;
	/** Optional row under the track, e.g. elapsed and total time. */
	footer?: React.ReactNode;
};

const percent = (value: number, total: number) =>
	total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;

/**
 * Video timeline: chapter boundaries cut the track, amber pins are the
 * learner's bookmarks, teal is only the played portion and the playhead.
 * A native range input sits on top, so keyboard and screen readers get a
 * real slider for free.
 */
function PlaybackTimeline({
	duration,
	position,
	chapterStarts = [],
	bookmarks = [],
	onSeek,
	valueText,
	label = "Playback position",
	className,
	footer,
}: PlaybackTimelineProps) {
	const played = percent(position, duration);

	return (
		<div data-slot="playback-timeline" className={cn("pt-4", className)}>
			<div className="relative h-1.5 rounded-full bg-border">
				<span
					aria-hidden="true"
					className="absolute inset-y-0 left-0 rounded-l-full bg-primary"
					style={{ width: `${played}%` }}
				/>
				{chapterStarts
					.filter((start) => start > 0 && start < duration)
					.map((start) => (
						<span
							key={start}
							aria-hidden="true"
							className="absolute inset-y-0 w-0.5 bg-card"
							style={{ left: `${percent(start, duration)}%` }}
						/>
					))}
				{bookmarks.map((bookmark) => (
					<span
						key={`${bookmark.time}-${bookmark.label}`}
						title={bookmark.label}
						aria-hidden="true"
						className="absolute -top-3.5 size-2.5 -translate-x-1/2 rounded-t-[2px] rounded-b-[5px] bg-mark"
						style={{ left: `${percent(bookmark.time, duration)}%` }}
					/>
				))}
				<input
					type="range"
					min={0}
					max={Math.max(duration, 0)}
					step={1}
					value={Math.min(position, duration)}
					aria-label={label}
					aria-valuetext={valueText}
					readOnly={!onSeek}
					disabled={!onSeek}
					onChange={(event) => onSeek?.(Number(event.currentTarget.value))}
					className="peer absolute -inset-y-2 inset-x-0 z-10 m-0 w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-default"
				/>
				{/* Playhead sits after the input so it can show the input's focus. */}
				<span
					aria-hidden="true"
					className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_3px_var(--card)] peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-focus-visible:outline-offset-4"
					style={{ left: `${played}%` }}
				/>
			</div>
			{footer ? (
				<div className="mt-2.5 flex justify-between text-muted-foreground text-xs tabular-nums">
					{footer}
				</div>
			) : null}
		</div>
	);
}

export { PlaybackTimeline, type TimelineBookmark };
