import { formatTimestamp } from "@benkyou/core";
import type { CourseChapterDTO } from "@benkyou/types";
import { Button, HugeIcon, ProgressRing } from "@benkyou/ui";
import { type ChapterPanelProps, MobileChapterDrawer } from "./chapter-panel";

/** Phone-only strip under the video: current chapter, navigation, bookmark. */
function MobileLessonContext({
	chapter,
	chapterIndex,
	chapterPanel,
	courseProgressPercent,
	currentSeconds,
	doneCount,
	nextChapter,
	previousChapter,
	showNextChapterPrompt,
	onAddBookmark,
	onDismissNextChapter,
	onSelectChapter,
}: {
	chapter: CourseChapterDTO | null;
	chapterIndex: number;
	chapterPanel: ChapterPanelProps;
	courseProgressPercent: number;
	currentSeconds: number;
	doneCount: number;
	nextChapter: CourseChapterDTO | null;
	previousChapter: CourseChapterDTO | null;
	showNextChapterPrompt: boolean;
	onAddBookmark: () => void;
	onDismissNextChapter: () => void;
	onSelectChapter: (chapter: CourseChapterDTO) => void;
}) {
	return (
		<section
			className="order-2 mx-3 grid gap-3 lg:hidden"
			aria-labelledby="lesson-heading"
		>
			<div className="grid gap-3 px-1">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-muted-foreground text-xs tabular-nums">
							{chapterIndex > 0
								? `Chapter ${String(chapterIndex).padStart(2, "0")}`
								: "Chapter"}{" "}
							· {formatTimestamp(currentSeconds)}
						</p>
						<h2
							id="lesson-heading"
							className="mt-0.5 line-clamp-2 font-semibold text-lg leading-6"
						>
							{chapter?.title ?? "Choose a chapter"}
						</h2>
					</div>
					<MobileChapterDrawer {...chapterPanel} />
				</div>

				<div className="flex items-center gap-2">
					<Button
						className="min-h-11 flex-1"
						disabled={!previousChapter}
						onClick={() => previousChapter && onSelectChapter(previousChapter)}
						type="button"
						variant="outline"
					>
						<HugeIcon name="arrowLeft" className="size-4" />
						Previous
					</Button>
					<Button
						className="min-h-11 flex-1"
						disabled={!nextChapter}
						onClick={() => nextChapter && onSelectChapter(nextChapter)}
						type="button"
						variant="outline"
					>
						Next
						<HugeIcon name="arrowRight" className="size-4" />
					</Button>
					<Button
						aria-label={`Bookmark ${formatTimestamp(currentSeconds)}`}
						className="size-11"
						onClick={onAddBookmark}
						size="icon-lg"
						type="button"
						variant="outline"
					>
						<HugeIcon name="bookmark" className="size-4" />
					</Button>
				</div>

				<div className="flex items-center gap-3 border-border border-y py-2.5 text-[13px]">
					<ProgressRing value={courseProgressPercent} />
					<span className="tabular-nums">
						{doneCount} of {chapterPanel.chapters.length} chapters done
					</span>
					<span className="ml-auto text-muted-foreground tabular-nums">
						{Math.round(courseProgressPercent)}%
					</span>
				</div>
			</div>

			{showNextChapterPrompt && nextChapter ? (
				<div className="rounded-lg bg-accent p-3 text-accent-foreground">
					<p className="font-medium text-sm">Up next</p>
					<p className="mt-1 line-clamp-2 text-sm">{nextChapter.title}</p>
					<div className="mt-3 flex gap-2">
						<Button
							className="min-h-11 flex-1"
							onClick={() => onSelectChapter(nextChapter)}
							type="button"
						>
							<HugeIcon name="play" className="size-4" />
							Play next chapter
						</Button>
						<Button
							className="min-h-11"
							onClick={onDismissNextChapter}
							type="button"
							variant="ghost"
						>
							Not now
						</Button>
					</div>
				</div>
			) : null}
		</section>
	);
}

export { MobileLessonContext };
