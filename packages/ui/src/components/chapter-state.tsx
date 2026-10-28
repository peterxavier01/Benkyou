import type * as React from "react";

import { cn } from "#lib/utils";

import { HugeIcon } from "./hugeicon";

type ChapterState = "not-started" | "in-progress" | "current" | "completed";

const stateLabels: Record<ChapterState, string> = {
	"not-started": "Not started",
	"in-progress": "In progress",
	current: "Now playing",
	completed: "Completed",
};

/**
 * Chapter state is carried by shape, not colour alone:
 * empty circle, partial ring, filled play disc, 済 stamp.
 */
function ChapterStateIcon({
	state,
	progress = 0,
	className,
}: {
	state: ChapterState;
	/** 0–100, used by the in-progress ring. */
	progress?: number;
	className?: string;
}) {
	return (
		<span
			data-slot="chapter-state"
			data-state={state}
			className={cn(
				"inline-flex size-[22px] shrink-0 items-center justify-center",
				className,
			)}
		>
			{state === "completed" ? <CompletionStamp /> : null}
			{state === "current" ? (
				<span
					aria-hidden="true"
					className="inline-flex size-full items-center justify-center rounded-full bg-primary text-primary-foreground"
				>
					<HugeIcon name="play" className="size-2.5 fill-current" />
				</span>
			) : null}
			{state === "in-progress" ? <ProgressRing value={progress} /> : null}
			{state === "not-started" ? (
				<span
					aria-hidden="true"
					className="size-[15px] rounded-full border-[1.5px] border-input"
				/>
			) : null}
			<span className="sr-only">
				{state === "in-progress"
					? `${Math.round(progress)}% watched`
					: stateLabels[state]}
			</span>
		</span>
	);
}

/** The 済 ("done") stamp used for completed chapters and notebooks. */
function CompletionStamp({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			aria-hidden="true"
			data-slot="completion-stamp"
			className={cn(
				"inline-flex size-[22px] -rotate-[8deg] items-center justify-center rounded-full border-[1.5px] border-foreground font-jp font-semibold text-[11px] text-foreground leading-none",
				className,
			)}
			{...props}
		>
			済
		</span>
	);
}

function ProgressRing({
	value,
	size = 22,
	strokeWidth = 2.5,
	label,
	className,
}: {
	/** 0–100 */
	value: number;
	size?: number;
	strokeWidth?: number;
	/** Shown in the centre (e.g. "42%"). Omit for small rings. */
	label?: React.ReactNode;
	className?: string;
}) {
	const clamped = Math.min(100, Math.max(0, value));
	const radius = (size - strokeWidth) / 2 - 0.5;
	const circumference = 2 * Math.PI * radius;

	return (
		<span
			data-slot="progress-ring"
			className={cn("relative inline-flex shrink-0", className)}
			style={{ width: size, height: size }}
		>
			<svg
				aria-hidden="true"
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				className="-rotate-90"
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					className="stroke-border"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - clamped / 100)}
					className="stroke-primary"
				/>
			</svg>
			{label ? (
				<span className="absolute inset-0 flex items-center justify-center font-semibold text-xs tabular-nums">
					{label}
				</span>
			) : null}
		</span>
	);
}

export { ChapterStateIcon, CompletionStamp, ProgressRing, type ChapterState };
