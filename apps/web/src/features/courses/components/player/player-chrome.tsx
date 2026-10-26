import { formatTimestamp } from "@benkyou/core";
import type { CourseChapterDTO } from "@benkyou/types";
import {
	Button,
	ContentPanel,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	HugeIcon,
	ProgressRing,
} from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import BetterAuthHeader from "../../../../integrations/better-auth/header-user";

function CoursePlayerHeaderActions({
	courseId,
	onNavigate,
}: {
	courseId: string;
	onNavigate: () => void;
}) {
	return (
		<div className="flex items-center gap-1.5 lg:gap-2">
			<div className="lg:hidden">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							aria-label="Notebook options"
							className="size-11"
							size="icon-lg"
							type="button"
							variant="ghost"
						>
							<HugeIcon name="more" className="size-5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-52">
						<DropdownMenuLabel>Notebook</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link
								params={{ courseId }}
								to="/notebooks/$courseId/manage"
								onClick={onNavigate}
							>
								<HugeIcon name="edit" className="size-4" />
								Edit notebook
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link
								search={{ q: "", filter: "all" }}
								to="/notebooks"
								onClick={onNavigate}
							>
								<HugeIcon name="notebook" className="size-4" />
								All notebooks
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="hidden items-center gap-2 lg:flex">
				<Button asChild size="sm" variant="outline">
					<Link
						params={{ courseId }}
						to="/notebooks/$courseId/manage"
						onClick={onNavigate}
					>
						<HugeIcon name="edit" className="size-4" />
						Edit notebook
					</Link>
				</Button>
			</div>
			<BetterAuthHeader />
		</div>
	);
}

/** Desktop summary above the video: what you're studying and how far along. */
function NotebookOverview({
	title,
	channelTitle,
	chapterCount,
	doneCount,
	progressPercent,
	currentSeconds,
	chapter,
	onAddBookmark,
}: {
	title: string;
	channelTitle: string | null | undefined;
	chapterCount: number;
	doneCount: number;
	progressPercent: number;
	currentSeconds: number;
	chapter: CourseChapterDTO | null;
	onAddBookmark: () => void;
}) {
	return (
		<ContentPanel className="order-1 hidden items-center gap-5 px-5 py-4 lg:flex">
			<div className="min-w-0 flex-1">
				<p className="truncate text-muted-foreground text-xs">
					{channelTitle ?? "YouTube"} · {chapterCount} chapters
				</p>
				<h2 className="mt-0.5 truncate font-semibold font-serif text-[22px] leading-tight">
					{title}
				</h2>
				<p className="mt-1 truncate text-[13px] text-muted-foreground tabular-nums">
					<span className="font-medium text-foreground">
						{formatTimestamp(currentSeconds)}
					</span>
					{chapter ? ` · ${chapter.title}` : null}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-3">
				<ProgressRing value={progressPercent} />
				<span className="text-[13px] tabular-nums">
					{doneCount} of {chapterCount} chapters
				</span>
			</div>
			<Button
				type="button"
				size="sm"
				variant="outline"
				className="shrink-0"
				onClick={onAddBookmark}
			>
				<HugeIcon name="bookmark" className="size-4" />
				Bookmark
			</Button>
		</ContentPanel>
	);
}

export { CoursePlayerHeaderActions, NotebookOverview };
