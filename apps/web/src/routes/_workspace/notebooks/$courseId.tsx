import { createFileRoute } from "@tanstack/react-router";
import { coursePlayerQueryOptions } from "#/features/workspace/workspace.queries";

export const Route = createFileRoute("/_workspace/notebooks/$courseId")({
	validateSearch: (search: Record<string, unknown>) => ({
		chapter: typeof search.chapter === "string" ? search.chapter : undefined,
		bookmark: typeof search.bookmark === "string" ? search.bookmark : undefined,
	}),
	loader: ({ context: { queryClient }, params }) =>
		queryClient.query(coursePlayerQueryOptions(params.courseId)),
});
