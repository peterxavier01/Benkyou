import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceLayout } from "#components/workspace-layout";
import { buildNoIndexHead } from "#lib/seo";

export const Route = createFileRoute("/_workspace")({
	head: () =>
		buildNoIndexHead(
			"Learning workspace | Benkyou",
			"Private Benkyou workspace for courses, notes, bookmarks, settings, and generation progress.",
		),
	component: WorkspaceRoute,
});

function WorkspaceRoute() {
	return (
		<WorkspaceLayout>
			<Outlet />
		</WorkspaceLayout>
	);
}
