import { createFileRoute } from "@tanstack/react-router";
import { generationJobQueryOptions } from "#/features/workspace/workspace.queries";

export const Route = createFileRoute("/_workspace/notebooks/new/$jobId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.query(generationJobQueryOptions(params.jobId)),
});
