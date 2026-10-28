import { moveInOrder, summarizeShelf } from "@benkyou/core";
import type {
	GetShelvesResponseV1,
	ShelfWithNotebooksDTO,
} from "@benkyou/types";
import { Button, ContentPanel, HugeIcon } from "@benkyou/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { formatLength } from "#/features/courses/components/library/library-helpers";
import { shelvesQueryOptions } from "#/features/workspace/workspace.queries";
import { WorkspacePage } from "#components/workspace-layout";
import { useShelfMutations } from "../use-shelf-mutations";
import { AddNotebookDialog } from "./add-notebook-dialog";
import { candidatesFor, DeleteShelfButton, UpNext } from "./shelf-detail-parts";
import { ShelfNameDialog } from "./shelf-name-dialog";
import { ShelfNotebookRow } from "./shelf-notebook-row";
import { ShelvesEmpty } from "./shelf-parts";

function ShelfScreen({
	shelfId,
	initialData,
}: {
	shelfId: string;
	initialData: GetShelvesResponseV1;
}) {
	const { data } = useQuery({ ...shelvesQueryOptions(), initialData });
	const entry = data.shelves.find((item) => item.shelf.id === shelfId);

	if (!entry) {
		return (
			<WorkspacePage title="Shelf">
				<ShelvesEmpty
					title="This shelf isn’t here"
					action={
						<Button asChild>
							<Link to="/shelves">All shelves</Link>
						</Button>
					}
				>
					It may have been deleted, or the link may be incomplete.
				</ShelvesEmpty>
			</WorkspacePage>
		);
	}

	return <ShelfDetail entry={entry} data={data} />;
}

function ShelfDetail({
	entry,
	data,
}: {
	entry: ShelfWithNotebooksDTO;
	data: GetShelvesResponseV1;
}) {
	const mutations = useShelfMutations();
	const navigate = useNavigate();
	const [renaming, setRenaming] = useState(false);
	const { shelf, notebooks } = entry;
	const summary = summarizeShelf(notebooks);
	const length = formatLength(summary.totalSeconds);
	const ids = notebooks.map((item) => item.course.id);
	const busy =
		mutations.reorder.isPending || mutations.removeNotebook.isPending;
	const error =
		mutations.reorder.error ??
		mutations.removeNotebook.error ??
		mutations.addNotebook.error;

	return (
		<WorkspacePage
			title={shelf.name}
			description={[
				`${summary.notebookCount} ${summary.notebookCount === 1 ? "notebook" : "notebooks"}`,
				length,
			]
				.filter(Boolean)
				.join(" · ")}
			action={
				<div className="flex items-center gap-1 sm:gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => setRenaming(true)}
					>
						<HugeIcon name="edit" className="size-4" />
						<span className="hidden sm:inline">Rename</span>
						<span className="sr-only sm:hidden">Rename shelf</span>
					</Button>
					<DeleteShelfButton
						name={shelf.name}
						pending={mutations.remove.isPending}
						onConfirm={async () => {
							await mutations.remove.mutateAsync(shelf.id);
							await navigate({ to: "/shelves" });
						}}
					/>
				</div>
			}
		>
			<Link to="/shelves" className="flex w-fit items-center gap-1 text-sm">
				<HugeIcon name="arrowLeft" className="size-4" />
				All shelves
			</Link>

			{summary.next ? (
				<UpNext
					item={summary.next}
					doneCount={summary.doneCount}
					notebookCount={summary.notebookCount}
					percent={summary.percent}
					remaining={formatLength(summary.remainingSeconds)}
				/>
			) : null}

			{error ? (
				<p
					role="alert"
					className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm"
				>
					<HugeIcon name="alertCircle" className="mt-0.5 size-4 shrink-0" />
					{error.message}
				</p>
			) : null}

			<section aria-labelledby="shelf-order" className="grid gap-3">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div className="grid gap-0.5">
						<h2 id="shelf-order" className="font-semibold font-serif text-lg">
							In order
						</h2>
						<p className="text-muted-foreground text-sm">
							Continue always picks the first unfinished notebook.
						</p>
					</div>
					<AddNotebookDialog
						candidates={candidatesFor(entry, data)}
						pendingId={
							mutations.addNotebook.isPending
								? (mutations.addNotebook.variables?.courseId ?? null)
								: null
						}
						onAdd={(courseId) =>
							mutations.addNotebook.mutate({ shelfId: shelf.id, courseId })
						}
					/>
				</div>
				{notebooks.length === 0 ? (
					<ShelvesEmpty title="This shelf is empty" action={null}>
						Use Add notebook to put notebooks on it, in the order you want to
						study them.
					</ShelvesEmpty>
				) : (
					<ContentPanel className="p-0">
						<ol aria-label={`Notebooks on ${shelf.name}`}>
							{notebooks.map((item, index) => (
								<ShelfNotebookRow
									key={item.course.id}
									item={item}
									index={index}
									isFirst={index === 0}
									isLast={index === notebooks.length - 1}
									isNext={summary.next?.course.id === item.course.id}
									busy={busy}
									onMove={(direction) =>
										mutations.reorder.mutate({
											shelfId: shelf.id,
											courseIds: moveInOrder(ids, item.course.id, direction),
										})
									}
									onRemove={() =>
										mutations.removeNotebook.mutate({
											shelfId: shelf.id,
											courseId: item.course.id,
										})
									}
								/>
							))}
						</ol>
					</ContentPanel>
				)}
			</section>

			<ShelfNameDialog
				open={renaming}
				onOpenChange={setRenaming}
				mode="rename"
				initialName={shelf.name}
				onSubmit={(name) =>
					mutations.rename.mutateAsync({ shelfId: shelf.id, name })
				}
			/>
		</WorkspacePage>
	);
}

export { ShelfScreen };
