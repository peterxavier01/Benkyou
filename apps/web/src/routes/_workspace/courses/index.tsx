import type { CourseLibraryFilterV1 } from "@benkyou/types";
import { createFileRoute } from "@tanstack/react-router";
import { courseLibraryQueryOptions } from "#/features/workspace/workspace.queries";

const filters = new Set<CourseLibraryFilterV1>([
	"all",
	"in-progress",
	"completed",
	"processing",
	"failed",
]);

export const Route = createFileRoute("/_workspace/courses/")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : "",
		filter:
			typeof search.filter === "string" &&
			filters.has(search.filter as CourseLibraryFilterV1)
				? (search.filter as CourseLibraryFilterV1)
				: "all",
	}),
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(courseLibraryQueryOptions()),
});
