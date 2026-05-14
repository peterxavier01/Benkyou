import { createFileRoute } from "@tanstack/react-router";
import { BookmarksScreen } from "#/features/courses/components/bookmarks-screen";
import { getBookmarks } from "#/features/courses/course-workspace.functions";

export const Route = createFileRoute("/_workspace/bookmarks")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : "",
		course: typeof search.course === "string" ? search.course : "all",
	}),
	loader: () => getBookmarks(),
	component: BookmarksRoute,
});

function BookmarksRoute() {
	const initialData = Route.useLoaderData();
	const search = Route.useSearch();

	return <BookmarksScreen initialData={initialData} search={search} />;
}
