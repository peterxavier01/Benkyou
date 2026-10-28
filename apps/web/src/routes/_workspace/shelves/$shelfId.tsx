import { createFileRoute } from "@tanstack/react-router";
import { shelvesQueryOptions } from "#/features/workspace/workspace.queries";

export const Route = createFileRoute("/_workspace/shelves/$shelfId")({
	loader: ({ context: { queryClient } }) =>
		queryClient.query(shelvesQueryOptions()),
});
