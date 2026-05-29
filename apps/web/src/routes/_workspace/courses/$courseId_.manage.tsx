import { createFileRoute } from "@tanstack/react-router";
import { courseManagementQueryOptions } from "#/features/workspace/workspace.queries";

export const Route = createFileRoute("/_workspace/courses/$courseId_/manage")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(courseManagementQueryOptions(params.courseId)),
});
