import type { CourseLibraryItemDTO } from "@benkyou/types";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	HugeIcon,
	Input,
} from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Thumbnail } from "#/features/courses/components/library/library-rows";

/** Pick notebooks to add to a shelf. Stays open so several can be added. */
function AddNotebookDialog({
	candidates,
	pendingId,
	onAdd,
}: {
	candidates: CourseLibraryItemDTO[];
	pendingId: string | null;
	onAdd: (courseId: string) => void;
}) {
	const [query, setQuery] = useState("");
	const normalized = query.trim().toLowerCase();
	const matches = normalized
		? candidates.filter((item) =>
				[item.course.title, item.video.channelTitle]
					.join(" ")
					.toLowerCase()
					.includes(normalized),
			)
		: candidates;

	return (
		<Dialog onOpenChange={(open) => (open ? null : setQuery(""))}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline">
					<HugeIcon name="add" className="size-4" />
					Add notebook
				</Button>
			</DialogTrigger>
			<DialogContent className="grid max-h-[85dvh] grid-rows-[auto_auto_minmax(0,1fr)] sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-serif text-xl">
						Add notebooks
					</DialogTitle>
					<DialogDescription>
						New notebooks go to the end of the shelf.
					</DialogDescription>
				</DialogHeader>
				{candidates.length > 0 ? (
					<Input
						type="search"
						aria-label="Search notebooks"
						placeholder="Search notebooks"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				) : null}
				<div className="min-h-0 overflow-auto">
					{candidates.length === 0 ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							Every notebook is already on this shelf.{" "}
							<Link to="/">Make a new notebook</Link>
						</p>
					) : matches.length === 0 ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							No notebooks match “{query.trim()}”.
						</p>
					) : (
						<ul className="grid gap-1">
							{matches.map((item) => (
								<li
									key={item.course.id}
									className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"
								>
									<Thumbnail url={item.video.thumbnailUrl} className="w-14" />
									<span className="min-w-0 flex-1 truncate text-sm">
										{item.course.title}
									</span>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={pendingId !== null}
										onClick={() => onAdd(item.course.id)}
									>
										{pendingId === item.course.id ? "Adding…" : "Add"}
										<span className="sr-only"> {item.course.title}</span>
									</Button>
								</li>
							))}
						</ul>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export { AddNotebookDialog };
