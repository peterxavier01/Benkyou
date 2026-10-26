import { createFileRoute } from "@tanstack/react-router";
import { bookmarksQueryOptions } from "#/features/workspace/workspace.queries";

export const Route = createFileRoute("/_workspace/bookmarks")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : "",
		// `course` is the old name for this filter, kept for older links.
		notebook:
			typeof search.notebook === "string"
				? search.notebook
				: typeof search.course === "string"
					? search.course
					: "all",
	}),
	loader: ({ context: { queryClient } }) =>
		queryClient.query(bookmarksQueryOptions()),
});
