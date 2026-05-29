import { createFileRoute } from "@tanstack/react-router";
import { bookmarksQueryOptions } from "#/features/workspace/workspace.queries";

export const Route = createFileRoute("/_workspace/bookmarks")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : "",
		course: typeof search.course === "string" ? search.course : "all",
	}),
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(bookmarksQueryOptions()),
});
