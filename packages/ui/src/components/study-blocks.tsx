import type * as React from "react";

import { cn } from "#lib/utils";

import { HugeIcon } from "./hugeicon";

/** A link back into the video. Use the pre-formatted time as the label. */
function TimestampChip({
	time,
	className,
	...props
}: Omit<React.ComponentProps<"button">, "children"> & { time: string }) {
	return (
		<button
			type="button"
			data-slot="timestamp-chip"
			aria-label={`Jump to ${time}`}
			className={cn(
				"inline-flex h-[22px] items-center gap-1 rounded-sm bg-muted px-1.5 align-[1px] font-medium font-sans text-foreground text-xs tabular-nums outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
			{...props}
		>
			<HugeIcon name="play" className="size-2.5 fill-current" />
			{time}
		</button>
	);
}

/** Pick up where you left off. One per screen, near the top. */
function ResumeBanner({
	time,
	context,
	action,
	className,
}: {
	/** Pre-formatted position, e.g. "33:47". */
	time: string;
	/** Where, e.g. "03 · Database layer · last studied Tuesday". */
	context: React.ReactNode;
	/** Usually a primary "Resume" button. */
	action?: React.ReactNode;
	className?: string;
}) {
	return (
		<section
			data-slot="resume-banner"
			aria-label="Resume"
			className={cn(
				"flex items-center gap-4 rounded-lg bg-accent px-4 py-3.5 text-accent-foreground",
				className,
			)}
		>
			<HugeIcon name="refresh" className="size-5 shrink-0" />
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-sm">
					Pick up at <span className="tabular-nums">{time}</span>
				</p>
				<p className="truncate text-[13px]">{context}</p>
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</section>
	);
}

/** A learner's bookmark. Amber is reserved for things the learner marked. */
function BookmarkItem({
	time,
	label,
	context,
	note,
	actions,
	className,
	...props
}: Omit<React.ComponentProps<"div">, "children"> & {
	time: string;
	label: React.ReactNode;
	/** e.g. the chapter, "02 · Routing and handlers". */
	context?: React.ReactNode;
	note?: React.ReactNode;
	/** Usually a "more" menu trigger. */
	actions?: React.ReactNode;
}) {
	return (
		<div
			data-slot="bookmark-item"
			className={cn("flex items-start gap-3 rounded-md p-3", className)}
			{...props}
		>
			<HugeIcon
				name="bookmark"
				className="mt-0.5 size-4 shrink-0 fill-mark text-mark-ink"
			/>
			<div className="min-w-0 flex-1">
				<p className="flex items-baseline gap-2">
					<span className="font-semibold text-mark-ink text-xs tabular-nums">
						{time}
					</span>
					<span className="font-medium text-sm">{label}</span>
				</p>
				{context ? (
					<p className="text-muted-foreground text-xs tabular-nums">
						{context}
					</p>
				) : null}
				{note ? (
					<p className="mt-1 font-serif text-[15px] text-foreground leading-normal">
						{note}
					</p>
				) : null}
			</div>
			{actions ? <div className="-my-1.5 shrink-0">{actions}</div> : null}
		</div>
	);
}

type SaveStatusTone = "saved" | "saving" | "offline" | "error" | "info";

const toneIcon = {
	saved: { name: "check", className: "text-success" },
	saving: { name: "loading", className: "animate-spin text-muted-foreground" },
	offline: { name: "offline", className: "text-warning" },
	error: { name: "alertCircle", className: "text-destructive" },
	info: { name: "info", className: "text-info" },
} as const;

/**
 * Every save state says what happened and offers the next action.
 * Status colours always come with an icon.
 */
function SaveStatus({
	tone,
	children,
	action,
	className,
}: {
	tone: SaveStatusTone;
	children: React.ReactNode;
	action?: React.ReactNode;
	className?: string;
}) {
	const icon = toneIcon[tone];

	return (
		<div
			data-slot="save-status"
			data-tone={tone}
			role={tone === "error" ? "alert" : "status"}
			className={cn("flex items-center gap-2 text-[13px]", className)}
		>
			<HugeIcon
				name={icon.name}
				className={cn(
					"size-4 shrink-0 motion-reduce:animate-none",
					icon.className,
				)}
			/>
			<span className="min-w-0 flex-1 text-foreground">{children}</span>
			{action ? <span className="shrink-0">{action}</span> : null}
		</div>
	);
}

export {
	BookmarkItem,
	ResumeBanner,
	SaveStatus,
	TimestampChip,
	type SaveStatusTone,
};
