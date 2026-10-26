import { summarizeShelf } from "@benkyou/core";
import type {
	CourseLibraryItemDTO,
	GetShelvesResponseV1,
	ShelfWithNotebooksDTO,
} from "@benkyou/types";
import {
	Button,
	ContentPanel,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	HugeIcon,
	ProgressRing,
} from "@benkyou/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	formatLength,
	formatTimeLeft,
} from "#/features/courses/components/library/library-helpers";
import { Thumbnail } from "#/features/courses/components/library/library-rows";
import { shelvesQueryOptions } from "#/features/workspace/workspace.queries";
import { WorkspacePage } from "#components/workspace-layout";
import { useShelfMutations } from "../use-shelf-mutations";
import { ShelfNameDialog } from "./shelf-name-dialog";
import { ShelfCovers, ShelvesEmpty } from "./shelf-parts";

function ShelvesScreen({ initialData }: { initialData: GetShelvesResponseV1 }) {
	const { data } = useQuery({ ...shelvesQueryOptions(), initialData });
	const mutations = useShelfMutations();
	const navigate = useNavigate();
	const [creating, setCreating] = useState(false);

	const newShelfButton = (
		<Button type="button" onClick={() => setCreating(true)}>
			<HugeIcon name="add" className="size-4" />
			New shelf
		</Button>
	);

	return (
		<WorkspacePage
			title="Shelves"
			description="Group notebooks that belong together, like a course split across several videos."
			action={data.shelves.length > 0 ? newShelfButton : null}
		>
			{data.shelves.length === 0 ? (
				<ShelvesEmpty title="No shelves yet" action={newShelfButton}>
					Make a shelf for a course split across several videos, a topic you
					keep coming back to, or talks to watch next.
				</ShelvesEmpty>
			) : (
				<ContentPanel className="p-0">
					<ul aria-label="Shelves">
						{data.shelves.map((entry) => (
							<ShelfListRow key={entry.shelf.id} entry={entry} />
						))}
					</ul>
				</ContentPanel>
			)}

			{data.shelves.length > 0 && data.unshelved.length > 0 ? (
				<section aria-labelledby="unshelved" className="grid gap-3">
					<div className="grid gap-0.5">
						<h2 id="unshelved" className="font-semibold font-serif text-lg">
							Not on a shelf
						</h2>
						<p className="text-muted-foreground text-sm">
							Use Add to shelf to put a notebook on one or more shelves.
						</p>
					</div>
					<ContentPanel className="p-0">
						<ul aria-label="Notebooks not on a shelf">
							{data.unshelved.map((item) => (
								<UnshelvedRow
									key={item.course.id}
									item={item}
									shelves={data.shelves}
									pending={mutations.addNotebook.isPending}
									onAdd={(shelfId) =>
										mutations.addNotebook.mutate({
											shelfId,
											courseId: item.course.id,
										})
									}
								/>
							))}
						</ul>
					</ContentPanel>
				</section>
			) : null}

			<ShelfNameDialog
				open={creating}
				onOpenChange={setCreating}
				mode="create"
				onSubmit={async (name) => {
					const { shelf } = await mutations.create.mutateAsync(name);
					await navigate({
						to: "/shelves/$shelfId",
						params: { shelfId: shelf.id },
					});
				}}
			/>
		</WorkspacePage>
	);
}

function ShelfListRow({ entry }: { entry: ShelfWithNotebooksDTO }) {
	const summary = summarizeShelf(entry.notebooks);
	const length = formatLength(summary.totalSeconds);

	return (
		<li className="relative flex items-center gap-4 border-border border-b p-4 last:border-b-0 hover:bg-muted/40 sm:px-5">
			<ShelfCovers notebooks={entry.notebooks} />
			<div className="grid min-w-0 flex-1 gap-1">
				<Link
					data-slot="shelf-link"
					to="/shelves/$shelfId"
					params={{ shelfId: entry.shelf.id }}
					className="truncate font-semibold font-serif text-[17px] text-foreground no-underline after:absolute after:inset-0 hover:underline"
				>
					{entry.shelf.name}
				</Link>
				<p className="truncate text-muted-foreground text-[13px]">
					{summary.notebookCount === 0
						? "Empty"
						: summary.next
							? `Next: ${summary.next.course.title}`
							: "Every notebook done"}
				</p>
				<p className="text-muted-foreground text-[13px] tabular-nums sm:hidden">
					{summary.doneCount} of {summary.notebookCount} done
					{length ? ` · ${length}` : ""}
				</p>
			</div>
			<div className="hidden items-center gap-3 sm:flex">
				<ProgressRing
					value={summary.percent}
					size={42}
					label={`${summary.percent}%`}
				/>
				<span className="w-36 text-muted-foreground text-[13px] tabular-nums">
					{summary.doneCount} of {summary.notebookCount} notebooks done
				</span>
				<span className="w-16 text-right text-muted-foreground text-[13px] tabular-nums">
					{length ?? "—"}
				</span>
			</div>
		</li>
	);
}

function UnshelvedRow({
	item,
	shelves,
	pending,
	onAdd,
}: {
	item: CourseLibraryItemDTO;
	shelves: ShelfWithNotebooksDTO[];
	pending: boolean;
	onAdd: (shelfId: string) => void;
}) {
	const percent = item.progress?.completionPercent ?? 0;

	return (
		<li className="flex items-center gap-3 border-border border-b p-3 last:border-b-0 sm:px-5">
			<Thumbnail url={item.video.thumbnailUrl} className="w-14 sm:w-[72px]" />
			<div className="grid min-w-0 flex-1 gap-0.5">
				<span className="truncate font-medium text-sm">
					{item.course.title}
				</span>
				<span className="text-muted-foreground text-xs tabular-nums">
					{formatTimeLeft(percent, item.video.durationSeconds)}
				</span>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button type="button" variant="outline" size="sm" disabled={pending}>
						<HugeIcon name="add" className="size-4" />
						<span className="hidden sm:inline">Add to shelf</span>
						<span className="sr-only sm:hidden">
							Add {item.course.title} to a shelf
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel>Add to shelf</DropdownMenuLabel>
					{shelves.map((entry) => (
						<DropdownMenuItem
							key={entry.shelf.id}
							onSelect={() => onAdd(entry.shelf.id)}
						>
							<HugeIcon name="library" className="size-4" />
							<span className="truncate">{entry.shelf.name}</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</li>
	);
}

export { ShelvesScreen };
