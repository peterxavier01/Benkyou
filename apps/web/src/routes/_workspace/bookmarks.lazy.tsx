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
			description="Saved timestamps across your courses."
		>
			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<Skeleton className="h-7 w-32" />
						<Skeleton className="mt-2 h-4 w-72 max-w-full" />
					</div>
					<div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,18rem)_minmax(0,13rem)]">
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-9 w-full" />
					</div>
				</div>
			</ContentPanel>
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
