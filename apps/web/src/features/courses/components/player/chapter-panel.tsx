import {
	calculateProgressPercent,
	formatTimestamp,
	getChapterDurationSeconds,
} from "@benkyou/core";
import type { CourseChapterDTO } from "@benkyou/types";
import {
	Button,
	ChapterRow,
	type ChapterState,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	HugeIcon,
} from "@benkyou/ui";
import { useState } from "react";

type ChapterPanelProps = {
	chapters: CourseChapterDTO[];
	selectedChapterId: string | null;
	watchedByChapter: Record<string, number>;
	completedByChapter: Record<string, boolean>;
	durationSeconds: number;
	onSelect: (chapter: CourseChapterDTO) => void;
	onToggleComplete: (chapter: CourseChapterDTO) => void;
	hideHeader?: boolean;
};

function ChapterPanel({
	chapters,
	selectedChapterId,
	watchedByChapter,
	completedByChapter,
	durationSeconds,
	onSelect,
	onToggleComplete,
	hideHeader = false,
}: ChapterPanelProps) {
	const doneCount = chapters.filter(
		(chapter) => completedByChapter[chapter.id],
	).length;

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			{hideHeader ? null : (
				<div className="flex items-baseline justify-between gap-3 border-border border-b px-4 py-3">
					<h2 className="font-semibold text-sm">Chapters</h2>
					<span className="text-muted-foreground text-xs tabular-nums">
						{doneCount} of {chapters.length} done
					</span>
				</div>
			)}
			<ol className="min-h-0 flex-1 overflow-auto p-2 md:max-h-[420px] lg:max-h-none">
				{chapters.map((chapter, index) => {
					const completed = completedByChapter[chapter.id] ?? false;
					const percent = calculateProgressPercent(
						watchedByChapter[chapter.id] ?? 0,
						getChapterDurationSeconds(chapter, chapters, durationSeconds),
					);
					const active = chapter.id === selectedChapterId;
					const state: ChapterState = active
						? "current"
						: completed
							? "completed"
							: percent > 0
								? "in-progress"
								: "not-started";

					return (
						<li key={chapter.id} className="flex items-center gap-1">
							<ChapterRow
								index={index + 1}
								title={chapter.title}
								timestamp={formatTimestamp(chapter.startSeconds)}
								state={state}
								progress={percent}
								density="compact"
								className="min-h-11 flex-1 lg:min-h-10"
								onClick={() => onSelect(chapter)}
							/>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="size-11 shrink-0 text-muted-foreground lg:size-8"
								aria-pressed={completed}
								title={completed ? "Mark as not done" : "Mark as done"}
								onClick={() => onToggleComplete(chapter)}
							>
								<HugeIcon
									name={completed ? "checkmarkCircle" : "circle"}
									className={completed ? "size-4 text-foreground" : "size-4"}
								/>
								<span className="sr-only">
									{completed
										? `Mark ${chapter.title} as not done`
										: `Mark ${chapter.title} as done`}
								</span>
							</Button>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

function MobileChapterDrawer(props: ChapterPanelProps) {
	const [open, setOpen] = useState(false);
	const doneCount = props.chapters.filter(
		(chapter) => props.completedByChapter[chapter.id],
	).length;

	return (
		<div className="lg:hidden">
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>
					<Button type="button" variant="outline" className="min-h-11">
						<HugeIcon name="list" className="size-4" />
						Chapters
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Chapters</DrawerTitle>
						<DrawerDescription className="tabular-nums">
							{doneCount} of {props.chapters.length} done
						</DrawerDescription>
					</DrawerHeader>
					<ChapterPanel
						{...props}
						hideHeader
						onSelect={(chapter) => {
							props.onSelect(chapter);
							setOpen(false);
						}}
					/>
				</DrawerContent>
			</Drawer>
		</div>
	);
}

export { ChapterPanel, type ChapterPanelProps, MobileChapterDrawer };
