import { ContentPanel, Skeleton } from "@benkyou/ui";
import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "#/components/workspace-layout";
import { ShelvesScreen } from "#/features/shelves/components/shelves-screen";

export const Route = createLazyFileRoute("/_workspace/shelves/")({
	component: ShelvesRoute,
	pendingComponent: ShelvesPendingRoute,
});

function ShelvesRoute() {
	const initialData = Route.useLoaderData();

	return <ShelvesScreen initialData={initialData} />;
}

function ShelvesPendingRoute() {
	return (
		<WorkspacePage
			title="Shelves"
			description="Group notebooks that belong together, like a course split across several videos."
		>
			<output className="sr-only">Loading your shelves</output>
			<ContentPanel className="p-0">
				{[0, 1, 2].map((item) => (
					<div
						key={item}
						className="flex items-center gap-4 border-border border-b p-4 last:border-b-0"
					>
						<Skeleton className="aspect-video w-24 shrink-0" />
						<div className="grid flex-1 gap-2">
							<Skeleton className="h-5 w-48 max-w-full" />
							<Skeleton className="h-4 w-64 max-w-full" />
						</div>
					</div>
				))}
			</ContentPanel>
		</WorkspacePage>
	);
}
