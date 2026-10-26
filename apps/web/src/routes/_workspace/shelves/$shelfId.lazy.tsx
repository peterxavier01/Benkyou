import { ContentPanel, Skeleton } from "@benkyou/ui";
import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "#/components/workspace-layout";
import { ShelfScreen } from "#/features/shelves/components/shelf-screen";

export const Route = createLazyFileRoute("/_workspace/shelves/$shelfId")({
	component: ShelfRoute,
	pendingComponent: ShelfPendingRoute,
});

function ShelfRoute() {
	const initialData = Route.useLoaderData();
	const { shelfId } = Route.useParams();

	return <ShelfScreen shelfId={shelfId} initialData={initialData} />;
}

function ShelfPendingRoute() {
	return (
		<WorkspacePage title="Shelf">
			<output className="sr-only">Loading this shelf</output>
			<ContentPanel className="flex items-center gap-4 p-5">
				<Skeleton className="aspect-video w-40 shrink-0" />
				<div className="grid flex-1 gap-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-6 w-64 max-w-full" />
				</div>
			</ContentPanel>
			<ContentPanel className="p-0">
				{[0, 1, 2].map((item) => (
					<div
						key={item}
						className="flex items-center gap-4 border-border border-b p-4 last:border-b-0"
					>
						<Skeleton className="aspect-video w-[72px] shrink-0" />
						<Skeleton className="h-5 w-56 max-w-full" />
					</div>
				))}
			</ContentPanel>
		</WorkspacePage>
	);
}
