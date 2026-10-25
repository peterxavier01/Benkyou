import { ContentPanel, Skeleton } from "@benkyou/ui";
import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "#/components/workspace-layout";
import { BookmarksScreen } from "#/features/courses/components/bookmarks-screen";

export const Route = createLazyFileRoute("/_workspace/bookmarks")({
	component: BookmarksRoute,
	pendingComponent: BookmarksPendingRoute,
});

function BookmarksRoute() {
	const initialData = Route.useLoaderData();
	const search = Route.useSearch();

	return <BookmarksScreen initialData={initialData} search={search} />;
}

function BookmarksPendingRoute() {
	return (
		<WorkspacePage
			title="Bookmarks"
			description="Every moment you marked, across all your notebooks."
		>
			<output className="sr-only">Loading your bookmarks</output>
			<div className="grid gap-2 sm:grid-cols-[minmax(0,22rem)_minmax(0,14rem)]">
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-9 w-full" />
			</div>
			<ContentPanel className="p-0">
				{[0, 1, 2, 3].map((item) => (
					<div
						key={item}
						className="border-border border-b p-4 last:border-b-0"
					>
						<Skeleton className="h-5 w-48" />
						<Skeleton className="mt-2 h-4 w-full max-w-2xl" />
						<Skeleton className="mt-3 h-4 w-32" />
					</div>
				))}
			</ContentPanel>
		</WorkspacePage>
	);
}
