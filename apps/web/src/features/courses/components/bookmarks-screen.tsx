import { formatTimestamp } from "@benkyou/core";
import type {
	BookmarkListItemDTO,
	GetBookmarksResponseV1,
} from "@benkyou/types";
import {
	BookmarkItem,
	Button,
	ContentPanel,
	HugeIcon,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@benkyou/ui";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@benkyou/ui/components/empty";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { bookmarksQueryOptions } from "#/features/workspace/workspace.queries";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";
import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import {
	filterBookmarks,
	formatDay,
	getCourseFilterOptions,
	groupByNotebook,
} from "./bookmarks/bookmarks-helpers";

interface BookmarksScreenProps {
	initialData: GetBookmarksResponseV1;
	search: {
		notebook: string;
		q: string;
	};
}

function BookmarksScreen({ initialData, search }: BookmarksScreenProps) {
	const navigate = useNavigate();
	const bookmarksQuery = useQuery({
		...bookmarksQueryOptions(),
		initialData,
	});
	const courses = getCourseFilterOptions(bookmarksQuery.data.items);
	const filteredItems = filterBookmarks(bookmarksQuery.data.items, search);

	const groups = groupByNotebook(filteredItems);

	return (
		<WorkspacePage
			title="Bookmarks"
			description="Every moment you marked, across all your notebooks."
			action={<BetterAuthHeader />}
		>
			{bookmarksQuery.data.items.length === 0 ? (
				<EmptyBookmarksState />
			) : (
				<>
					<div className="grid gap-2 sm:grid-cols-[minmax(0,22rem)_minmax(0,14rem)_1fr] sm:items-center">
						<label htmlFor="bookmark-search" className="relative block min-w-0">
							<span className="sr-only">Search bookmarks and notes</span>
							<HugeIcon
								name="search"
								className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
							/>
							<Input
								id="bookmark-search"
								type="search"
								value={search.q}
								placeholder="Search bookmarks and notes"
								className="ph-no-capture h-11 pl-9 text-base sm:h-9 sm:text-sm"
								onChange={(event) =>
									void navigate({
										to: "/bookmarks",
										search: { ...search, q: event.target.value },
										replace: true,
									})
								}
							/>
						</label>
						<Select
							value={search.notebook}
							onValueChange={(notebook) => {
								trackAnalyticsEvent("bookmark_filter_changed", {
									course_filter: notebook === "all" ? "all" : "specific",
									query_length: search.q.length,
								});
								void navigate({
									to: "/bookmarks",
									search: { ...search, notebook },
									replace: true,
								});
							}}
						>
							<SelectTrigger
								aria-label="Filter by notebook"
								className="h-11 w-full min-w-[0] sm:h-9 **:data-[slot=select-value]:min-w-[0] **:data-[slot=select-value]:truncate"
							>
								<SelectValue placeholder="All notebooks" />
							</SelectTrigger>
							<SelectContent
								position="popper"
								side="bottom"
								align="start"
								collisionPadding={16}
								className="max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-(--radix-select-trigger-width) max-w-[min(28rem,calc(100vw-2rem))] p-1"
							>
								<SelectItem value="all" className="py-1.5 *:[span]:last:min-w-0">
									<span className="block min-w-0 truncate">All notebooks</span>
								</SelectItem>
								{courses.length > 0 ? <SelectSeparator /> : null}
								{courses.map((course) => (
									<SelectItem
										key={course.id}
										value={course.id}
										title={course.title}
										className="py-1.5 *:[span]:last:min-w-0"
									>
										<span className="block min-w-0 truncate">
											{course.title}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-[13px] tabular-nums sm:text-right">
							{filteredItems.length}{" "}
							{filteredItems.length === 1 ? "bookmark" : "bookmarks"} in{" "}
							{groups.length} {groups.length === 1 ? "notebook" : "notebooks"}
						</p>
					</div>

					{groups.length === 0 ? (
						<ContentPanel className="p-8">
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<HugeIcon name="search" />
									</EmptyMedia>
									<EmptyTitle>No bookmarks match</EmptyTitle>
									<EmptyDescription>
										Try a different search, or show every notebook.
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						</ContentPanel>
					) : (
						groups.map((group) => (
							<ContentPanel
								key={group.course.id}
								className="overflow-hidden p-0"
								aria-labelledby={`bookmarks-${group.course.id}`}
							>
								<div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-1">
									<h2
										id={`bookmarks-${group.course.id}`}
										className="min-w-0 truncate font-semibold font-serif text-lg"
									>
										{group.course.title}
									</h2>
									<Link
										to="/notebooks/$courseId"
										params={{ courseId: group.course.id }}
										search={{ chapter: undefined, bookmark: undefined }}
										className="inline-flex shrink-0 items-center gap-1 font-medium text-[13px]"
									>
										Open notebook
										<HugeIcon name="arrowRight" className="size-3.5" />
									</Link>
								</div>
								<ul className="divide-y divide-border">
									{group.items.map((item) => (
										<li key={item.bookmark.id}>
											<BookmarkRow item={item} />
										</li>
									))}
								</ul>
							</ContentPanel>
						))
					)}
				</>
			)}
		</WorkspacePage>
	);
}

function EmptyBookmarksState() {
	return (
		<ContentPanel className="genko-grid p-8 sm:p-12">
			<Empty>
				<EmptyHeader>
					<EmptyTitle className="font-serif text-2xl">
						No bookmarks yet
					</EmptyTitle>
					<EmptyDescription>
						While you study, bookmark moments worth coming back to. They all
						show up here.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button asChild>
						<Link to="/notebooks" search={{ q: "", filter: "all" }}>
							Go to your notebooks
						</Link>
					</Button>
				</EmptyContent>
			</Empty>
		</ContentPanel>
	);
}

function BookmarkRow({ item }: { item: BookmarkListItemDTO }) {
	const time = formatTimestamp(item.bookmark.timestampSeconds);
	const label = item.bookmark.title ?? `Bookmark at ${time}`;

	return (
		<BookmarkItem
			className="rounded-none px-4 py-3.5"
			time={time}
			label={
				<Link
					data-slot="bookmark-link"
					to="/notebooks/$courseId"
					params={{ courseId: item.course.id }}
					search={{
						chapter: item.bookmark.chapterId ?? undefined,
						bookmark: item.bookmark.id,
					}}
					className="text-foreground no-underline hover:underline"
					onClick={() =>
						trackAnalyticsEvent("bookmark_jumped_to", {
							source: "bookmarks",
							has_chapter: Boolean(item.bookmark.chapterId),
							has_note: Boolean(item.bookmark.note),
						})
					}
				>
					{label}
				</Link>
			}
			context={[item.chapter?.title, formatDay(item.bookmark.createdAt)]
				.filter(Boolean)
				.join(" · ")}
			note={item.bookmark.note}
		/>
	);
}

export { BookmarksScreen };
