import { formatTimestamp } from "@benkyou/core";
import type {
	BookmarkListItemDTO,
	GetBookmarksResponseV1,
} from "@benkyou/types";
import {
	Button,
	ContentPanel,
	HugeIcon,
	Input,
	Select,
	SelectContent,
	SelectItem,
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
import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";

interface BookmarksScreenProps {
	initialData: GetBookmarksResponseV1;
	search: {
		course: string;
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

	return (
		<WorkspacePage
			title="Bookmarks"
			description="Saved timestamps across your courses."
			action={<BetterAuthHeader />}
		>
			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<h1 className="font-semibold text-2xl tracking-normal">
							Bookmarks
						</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Find saved moments without reopening every course.
						</p>
					</div>
					<div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,18rem)_minmax(0,13rem)]">
						<label htmlFor="bookmark-search" className="relative block min-w-0">
							<span className="sr-only">Search bookmarks</span>
							<HugeIcon
								name="search"
								className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
							/>
							<Input
								id="bookmark-search"
								value={search.q}
								placeholder="Search bookmarks"
								className="pl-9"
								onChange={(event) =>
									void navigate({
										to: "/bookmarks",
										search: {
											...search,
											q: event.target.value,
										},
										replace: true,
									})
								}
							/>
						</label>
						<Select
							value={search.course}
							onValueChange={(course) =>
								void navigate({
									to: "/bookmarks",
									search: {
										...search,
										course,
									},
									replace: true,
								})
							}
						>
							<SelectTrigger className="w-full min-w-[0] **:data-[slot=select-value]:min-w-[0] **:data-[slot=select-value]:truncate">
								<SelectValue placeholder="All courses" />
							</SelectTrigger>
							<SelectContent className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]">
								<SelectItem value="all">
									<span className="block truncate">All courses</span>
								</SelectItem>
								{courses.map((course) => (
									<SelectItem key={course.id} value={course.id}>
										<span className="block truncate">{course.title}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</ContentPanel>

			{bookmarksQuery.data.items.length === 0 ? (
				<EmptyBookmarksState />
			) : filteredItems.length === 0 ? (
				<ContentPanel className="p-8">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<HugeIcon name="search" />
							</EmptyMedia>
							<EmptyTitle>No matching bookmarks</EmptyTitle>
							<EmptyDescription>
								Adjust the search or course filter to see more saved moments.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</ContentPanel>
			) : (
				<div className="grid gap-3">
					{filteredItems.map((item) => (
						<BookmarkRow key={item.bookmark.id} item={item} />
					))}
				</div>
			)}
		</WorkspacePage>
	);
}

function EmptyBookmarksState() {
	return (
		<ContentPanel className="p-8">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeIcon name="bookmark" />
					</EmptyMedia>
					<EmptyTitle>No bookmarks yet</EmptyTitle>
					<EmptyDescription>
						Open a course and save the moments you want to revisit.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-wrap justify-center gap-2">
						<Button asChild>
							<Link to="/courses" search={{ q: "", filter: "all" }}>
								Open courses
							</Link>
						</Button>
						<Button asChild variant="outline">
							<Link to="/">Create course</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</ContentPanel>
	);
}

function BookmarkRow({ item }: { item: BookmarkListItemDTO }) {
	const title =
		item.bookmark.title ??
		`Bookmark at ${formatTimestamp(item.bookmark.timestampSeconds)}`;

	return (
		<ContentPanel className="overflow-hidden p-0">
			<div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<span className="rounded-md border border-border bg-muted px-2 py-1 font-medium text-foreground">
							{formatTimestamp(item.bookmark.timestampSeconds)}
						</span>
						<span className="text-muted-foreground">{item.course.title}</span>
						{item.chapter ? (
							<span className="text-muted-foreground">
								{item.chapter.title}
							</span>
						) : null}
					</div>
					<h2 className="mt-2 truncate font-semibold text-base tracking-normal">
						{title}
					</h2>
					{item.bookmark.note ? (
						<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
							{item.bookmark.note}
						</p>
					) : (
						<p className="mt-1 text-muted-foreground text-sm">
							No bookmark note.
						</p>
					)}
					<p className="mt-2 truncate text-muted-foreground text-xs">
						{item.video.channelTitle ?? "YouTube"}
						{item.video.title ? ` - ${item.video.title}` : ""}
					</p>
				</div>
				<div className="flex shrink-0 flex-wrap gap-2">
					<Button asChild size="sm">
						<Link
							to="/courses/$courseId"
							params={{ courseId: item.course.id }}
							search={{
								chapter: item.bookmark.chapterId ?? undefined,
								bookmark: item.bookmark.id,
							}}
						>
							Open moment
						</Link>
					</Button>
				</div>
			</div>
		</ContentPanel>
	);
}

function getCourseFilterOptions(items: BookmarkListItemDTO[]) {
	const options = new Map<string, { id: string; title: string }>();

	for (const item of items) {
		options.set(item.course.id, {
			id: item.course.id,
			title: item.course.title,
		});
	}

	return Array.from(options.values()).sort((a, b) =>
		a.title.localeCompare(b.title),
	);
}

function filterBookmarks(
	items: BookmarkListItemDTO[],
	search: BookmarksScreenProps["search"],
) {
	const query = search.q.trim().toLowerCase();

	return items.filter((item) => {
		if (search.course !== "all" && item.course.id !== search.course) {
			return false;
		}

		if (!query) {
			return true;
		}

		return [
			item.bookmark.title,
			item.bookmark.note,
			item.course.title,
			item.video.title,
			item.video.channelTitle,
			item.chapter?.title,
		]
			.filter(Boolean)
			.some((value) => value?.toLowerCase().includes(query));
	});
}

export { BookmarksScreen };
