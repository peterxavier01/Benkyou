import { formatTimestamp } from "@benkyou/core";
import type {
	CourseLibraryItemDTO,
	GetShelvesResponseV1,
	ShelfWithNotebooksDTO,
} from "@benkyou/types";
import { Button, ContentPanel, HugeIcon, ProgressRing } from "@benkyou/ui";
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
import { Thumbnail } from "#/features/courses/components/library/library-rows";

function UpNext({
	item,
	doneCount,
	notebookCount,
	percent,
	remaining,
}: {
	item: CourseLibraryItemDTO;
	doneCount: number;
	notebookCount: number;
	percent: number;
	remaining: string | null;
}) {
	const resumeSeconds = item.progress?.resumeSeconds ?? 0;

	return (
		<ContentPanel className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
			<span className="hidden shrink-0 sm:block">
				<Thumbnail url={item.video.thumbnailUrl} className="w-40" />
			</span>
			<div className="grid min-w-0 flex-1 gap-1">
				<span className="font-medium text-primary text-xs">Up next</span>
				<span className="truncate font-semibold font-serif text-xl">
					{item.course.title}
				</span>
				<span className="text-muted-foreground text-sm tabular-nums">
					{resumeSeconds > 0
						? `Resume at ${formatTimestamp(resumeSeconds)}`
						: "Not started"}
				</span>
			</div>
			<div className="flex items-center gap-4">
				<ProgressRing value={percent} size={46} label={`${percent}%`} />
				<div className="grid text-[13px] text-muted-foreground tabular-nums">
					<span>
						{doneCount} of {notebookCount} notebooks done
					</span>
					{remaining ? <span>{remaining} left</span> : null}
				</div>
				<Button asChild className="ml-auto">
					<Link
						to="/notebooks/$courseId"
						params={{ courseId: item.course.id }}
						search={{ chapter: undefined, bookmark: undefined }}
					>
						<HugeIcon name="play" className="size-4" />
						Continue
					</Link>
				</Button>
			</div>
		</ContentPanel>
	);
}

function DeleteShelfButton({
	name,
	pending,
	onConfirm,
}: {
	name: string;
	pending: boolean;
	onConfirm: () => Promise<void>;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button type="button" variant="outline" disabled={pending}>
					<HugeIcon name="delete" className="size-4" />
					<span className="hidden sm:inline">Delete</span>
					<span className="sr-only sm:hidden">Delete shelf</span>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
					<AlertDialogDescription>
						Only the shelf is deleted. Its notebooks, notes and bookmarks stay
						in Notebooks.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={() => void onConfirm()}
					>
						Delete shelf
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

/** Every notebook the learner has that isn't on this shelf yet. */
function candidatesFor(
	entry: ShelfWithNotebooksDTO,
	data: GetShelvesResponseV1,
): CourseLibraryItemDTO[] {
	const onShelf = new Set(entry.notebooks.map((item) => item.course.id));
	const seen = new Set<string>();
	const all = [
		...data.unshelved,
		...data.shelves.flatMap((other) => other.notebooks),
	];

	return all.filter((item) => {
		const id = item.course.id;
		if (onShelf.has(id) || seen.has(id)) {
			return false;
		}
		seen.add(id);
		return true;
	});
}

export { candidatesFor, DeleteShelfButton, UpNext };
