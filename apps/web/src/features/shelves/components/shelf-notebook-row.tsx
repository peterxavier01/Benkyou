import type { CourseLibraryItemDTO } from "@benkyou/types";
import {
	Button,
	type ChapterState,
	ChapterStateIcon,
	HugeIcon,
} from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import {
	formatLength,
	formatTimeLeft,
} from "#/features/courses/components/library/library-helpers";
import { Thumbnail } from "#/features/courses/components/library/library-rows";

function stateOf(item: CourseLibraryItemDTO, isNext: boolean): ChapterState {
	const percent = item.progress?.completionPercent ?? 0;
	if (percent >= 100) {
		return "completed";
	}
	if (isNext && percent > 0) {
		return "current";
	}
	return percent > 0 ? "in-progress" : "not-started";
}

/** One notebook in a shelf, with controls to reorder or take it off. */
function ShelfNotebookRow({
	item,
	index,
	isFirst,
	isLast,
	isNext,
	busy,
	onMove,
	onRemove,
}: {
	item: CourseLibraryItemDTO;
	index: number;
	isFirst: boolean;
	isLast: boolean;
	isNext: boolean;
	busy: boolean;
	onMove: (direction: -1 | 1) => void;
	onRemove: () => void;
}) {
	const percent = item.progress?.completionPercent ?? 0;
	const length = formatLength(item.video.durationSeconds);
	const title = item.course.title;

	return (
		<li className="flex items-center gap-3 border-border border-b p-3 last:border-b-0 sm:gap-4 sm:px-5">
			<span className="w-5 shrink-0 text-muted-foreground text-xs tabular-nums">
				{String(index + 1).padStart(2, "0")}
			</span>
			<ChapterStateIcon
				state={stateOf(item, isNext)}
				progress={percent}
				className="hidden sm:inline-flex"
			/>
			<span className="hidden shrink-0 sm:block">
				<Thumbnail url={item.video.thumbnailUrl} className="w-[72px]" />
			</span>
			<div className="grid min-w-0 flex-1 gap-0.5">
				<Link
					data-slot="notebook-link"
					to="/notebooks/$courseId"
					params={{ courseId: item.course.id }}
					search={{ chapter: undefined, bookmark: undefined }}
					className="truncate font-medium text-foreground text-sm no-underline hover:underline sm:font-semibold sm:font-serif sm:text-base"
				>
					{title}
				</Link>
				<span className="truncate text-muted-foreground text-xs tabular-nums">
					{[
						`${item.chapterCount} ${item.chapterCount === 1 ? "chapter" : "chapters"}`,
						length,
						formatTimeLeft(percent, item.video.durationSeconds),
					]
						.filter(Boolean)
						.join(" · ")}
				</span>
			</div>
			<div className="flex shrink-0 items-center">
				<Button
					type="button"
					size="icon"
					variant="ghost"
					className="size-11 sm:size-8"
					disabled={busy || isFirst}
					onClick={() => onMove(-1)}
				>
					<HugeIcon name="arrowUp" className="size-4" />
					<span className="sr-only">Move {title} up</span>
				</Button>
				<Button
					type="button"
					size="icon"
					variant="ghost"
					className="size-11 sm:size-8"
					disabled={busy || isLast}
					onClick={() => onMove(1)}
				>
					<HugeIcon name="arrowDown" className="size-4" />
					<span className="sr-only">Move {title} down</span>
				</Button>
				<Button
					type="button"
					size="icon"
					variant="ghost"
					className="size-11 text-muted-foreground sm:size-8"
					disabled={busy}
					onClick={onRemove}
				>
					<HugeIcon name="remove" className="size-4" />
					<span className="sr-only">Take {title} off this shelf</span>
				</Button>
			</div>
		</li>
	);
}

export { ShelfNotebookRow };
