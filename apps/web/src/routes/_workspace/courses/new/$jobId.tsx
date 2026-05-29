import { createFileRoute } from "@tanstack/react-router";
import { generationJobQueryOptions } from "#/features/workspace/workspace.queries";

export const Route = createFileRoute("/_workspace/courses/new/$jobId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(generationJobQueryOptions(params.jobId)),
});
