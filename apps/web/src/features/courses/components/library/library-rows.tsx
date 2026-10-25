import type { CourseLibraryItemDTO } from "@benkyou/types";
import { Button, ChapterStateIcon, HugeIcon } from "@benkyou/ui";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@benkyou/ui/components/alert-dialog";
import { Link } from "@tanstack/react-router";
import {
	formatLength,
	formatRelativeDay,
	formatTimeLeft,
	hasFailed,
} from "./library-helpers";

function Thumbnail({
	url,
	className = "w-[72px] sm:w-24",
}: {
	url: string | null;
	className?: string;
}) {
	return url ? (
		<img
			src={url}
			alt=""
			className={`aspect-video shrink-0 rounded object-cover ${className}`}
		/>
	) : (
		<span
			aria-hidden="true"
			className={`flex aspect-video shrink-0 items-center justify-center rounded bg-foreground text-muted ${className}`}
		>
			<HugeIcon name="play" className="size-3.5 fill-current" />
		</span>
	);
}

function NotebookRow({
	item,
	deleting,
	onDelete,
}: {
	item: CourseLibraryItemDTO;
	deleting: boolean;
	onDelete: (courseId: string) => void;
}) {
	const percent = Math.round(item.progress?.completionPercent ?? 0);
	const state =
		percent >= 100 ? "completed" : percent > 0 ? "in-progress" : "not-started";
	const length = formatLength(item.video.durationSeconds);
	const meta = [
		`${item.chapterCount} chapters`,
		length,
		item.video.channelTitle,
	]
		.filter(Boolean)
		.join(" · ");
	const timeLeft = formatTimeLeft(percent, item.video.durationSeconds);
	const resuming = percent > 0 && percent < 100;

	return (
		<li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_200px_96px_auto]">
			<Thumbnail url={item.video.thumbnailUrl} />
			<div className="min-w-0">
				<Link
					data-slot="notebook-link"
					to="/courses/$courseId"
					params={{ courseId: item.course.id }}
					search={{ chapter: undefined, bookmark: undefined }}
					className="line-clamp-2 font-semibold font-serif text-[17px] text-foreground leading-snug no-underline hover:underline"
				>
					{item.course.title}
				</Link>
				<p className="mt-1 truncate text-muted-foreground text-xs tabular-nums">
					{meta}
				</p>
			</div>
			<div className="col-span-3 col-start-1 grid gap-1.5 sm:col-span-1 sm:col-start-auto">
				<div className="flex items-center justify-between gap-2 text-[13px]">
					<span className="inline-flex items-center gap-2">
						<ChapterStateIcon state={state} progress={percent} />
						<span className="tabular-nums">{percent}%</span>
					</span>
					<span
						className={
							resuming
								? "font-medium text-accent-foreground tabular-nums"
								: "text-muted-foreground tabular-nums"
						}
					>
						{timeLeft}
					</span>
				</div>
				<span className="h-1 overflow-hidden rounded-full bg-border">
					<span
						className={`block h-full rounded-full ${percent >= 100 ? "bg-foreground" : "bg-primary"}`}
						style={{ width: `${percent}%` }}
					/>
				</span>
			</div>
			<span className="hidden text-right text-muted-foreground text-[13px] sm:block">
				{formatRelativeDay(item.progress?.updatedAt ?? item.course.updatedAt)}
			</span>
			<DeleteNotebookButton
				title={item.course.title}
				deleting={deleting}
				onConfirm={() => onDelete(item.course.id)}
				className="col-start-3 row-start-1 sm:col-start-auto sm:row-start-auto"
			/>
		</li>
	);
}

function PreparingRow({
	item,
	retrying,
	deleting,
	onRetry,
	onDelete,
}: {
	item: CourseLibraryItemDTO;
	retrying: boolean;
	deleting: boolean;
	onRetry: (generationJobId: string) => void;
	onDelete: (courseId: string) => void;
}) {
	const job = item.latestGenerationJob;
	const failed = hasFailed(item);
	const canRetry = failed && Boolean(job?.retryable);

	return (
		<li className="flex flex-wrap items-center gap-4 px-4 py-3.5">
			<span className="flex aspect-video w-[72px] shrink-0 items-center justify-center rounded border border-input border-dashed sm:w-24">
				<HugeIcon
					name={failed ? "alertCircle" : "loading"}
					className={
						failed
							? "size-4 text-destructive"
							: "size-4 animate-spin text-primary motion-reduce:animate-none"
					}
				/>
			</span>
			<div className="min-w-0 flex-1">
				<p className="truncate font-semibold font-serif text-[17px]">
					{item.course.title}
				</p>
				<p
					className={
						failed
							? "text-destructive text-[13px]"
							: "text-muted-foreground text-[13px]"
					}
				>
					{failed
						? job?.status === "cancelled"
							? "Cancelled before the chapters were ready."
							: "Couldn't create chapters for this video."
						: "Creating chapters. You can leave this page."}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				{job ? (
					<Button asChild size="sm" variant="outline">
						<Link to="/courses/new/$jobId" params={{ jobId: job.id }}>
							{failed ? "Details" : "View progress"}
						</Link>
					</Button>
				) : null}
				{canRetry ? (
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={retrying}
						onClick={() => onRetry(job?.id ?? "")}
					>
						<HugeIcon name="refresh" className="size-4" />
						{retrying ? "Retrying…" : "Try again"}
					</Button>
				) : null}
				{failed ? (
					<DeleteNotebookButton
						title={item.course.title}
						deleting={deleting}
						onConfirm={() => onDelete(item.course.id)}
					/>
				) : null}
			</div>
		</li>
	);
}

function DeleteNotebookButton({
	title,
	deleting,
	onConfirm,
	className,
}: {
	title: string;
	deleting: boolean;
	onConfirm: () => void;
	className?: string;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					type="button"
					size="icon"
					variant="ghost"
					className={`size-11 sm:size-9 ${className ?? ""}`}
				>
					<HugeIcon name="delete" className="size-4" />
					<span className="sr-only">Delete {title}</span>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete this notebook?</AlertDialogTitle>
					<AlertDialogDescription>
						“{title}” will be removed from your notebooks. Its notes, bookmarks
						and progress are kept for now.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={deleting}
						onClick={onConfirm}
					>
						Delete notebook
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export { NotebookRow, PreparingRow, Thumbnail };
