import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "#lib/utils";

import { type ChapterState, ChapterStateIcon } from "./chapter-state";

type ChapterRowProps = Omit<React.ComponentProps<"button">, "title"> & {
	asChild?: boolean;
	/** 1-based position in the notebook. */
	index: number;
	title: React.ReactNode;
	/** Pre-formatted start time, e.g. "12:40". */
	timestamp: string;
	state: ChapterState;
	/** 0–100, for the in-progress ring. */
	progress?: number;
	density?: "default" | "compact";
};

function ChapterRow({
	asChild = false,
	index,
	title,
	timestamp,
	state,
	progress,
	density = "default",
	className,
	children,
	...props
}: ChapterRowProps) {
	const Comp = asChild ? Slot.Root : "button";
	const current = state === "current";

	return (
		<Comp
			data-slot="chapter-row"
			data-state={state}
			aria-current={current ? "step" : undefined}
			className={cn(
				"flex w-full items-center gap-3 rounded-md px-3 text-left text-foreground text-sm no-underline outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
				density === "compact" ? "min-h-10" : "min-h-11",
				current &&
					"bg-accent font-semibold text-accent-foreground hover:bg-accent",
				className,
			)}
			{...(asChild ? {} : { type: "button" as const })}
			{...props}
		>
			{asChild ? (
				children
			) : (
				<ChapterRowContent
					index={index}
					title={title}
					timestamp={timestamp}
					state={state}
					progress={progress}
				/>
			)}
		</Comp>
	);
}

/** Use inside a custom element when ChapterRow is rendered with `asChild`. */
function ChapterRowContent({
	index,
	title,
	timestamp,
	state,
	progress,
}: Pick<
	ChapterRowProps,
	"index" | "title" | "timestamp" | "state" | "progress"
>) {
	return (
		<>
			<ChapterStateIcon state={state} progress={progress} />
			<span className="w-5 shrink-0 text-muted-foreground text-xs tabular-nums">
				{String(index).padStart(2, "0")}
			</span>
			<span className="min-w-0 flex-1 truncate">{title}</span>
			<span
				className={cn(
					"shrink-0 text-[13px] tabular-nums",
					state === "current" ? "text-current" : "text-muted-foreground",
				)}
			>
				{timestamp}
			</span>
		</>
	);
}

export { ChapterRow, ChapterRowContent };
