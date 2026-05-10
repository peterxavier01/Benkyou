import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceLayout } from "#components/workspace-layout";

export const Route = createFileRoute("/_workspace")({
	component: WorkspaceRoute,
});

function WorkspaceRoute() {
	return (
		<WorkspaceLayout>
			<Outlet />
		</WorkspaceLayout>
	);
}
