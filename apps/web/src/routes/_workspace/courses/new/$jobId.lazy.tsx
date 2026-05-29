import { ContentPanel, Skeleton } from "@benkyou/ui";
import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "#/components/workspace-layout";
import { GenerationStatusScreen } from "#/features/course-generation/components/generation-status-screen";

export const Route = createLazyFileRoute("/_workspace/courses/new/$jobId")({
	component: GenerationStatusRoute,
	pendingComponent: GenerationStatusPendingRoute,
});

function GenerationStatusRoute() {
	const detail = Route.useLoaderData();
	const { jobId } = Route.useParams();

	return <GenerationStatusScreen initialDetail={detail} jobId={jobId} />;
}

function GenerationStatusPendingRoute() {
	return (
		<WorkspacePage
			title="Generation"
			description="Prepare this video as a study workspace."
			className="lg:grid-cols-[minmax(0,1fr)_360px]"
		>
			<ContentPanel className="p-4 sm:p-6">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
					<Skeleton className="aspect-video w-full shrink-0 sm:w-64" />
					<div className="min-w-0 flex-1">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="mt-3 h-7 w-3/4" />
						<Skeleton className="mt-2 h-4 w-full max-w-2xl" />
						<div className="mt-5 flex flex-wrap gap-2">
							<Skeleton className="h-9 w-28" />
							<Skeleton className="h-9 w-24" />
							<Skeleton className="h-9 w-40" />
						</div>
					</div>
				</div>
			</ContentPanel>
			<ContentPanel className="p-5">
				<div className="flex items-center justify-between gap-3">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-4 w-20" />
				</div>
				<div className="mt-4 space-y-3">
					{[0, 1, 2, 3].map((item) => (
						<Skeleton key={item} className="h-20 w-full" />
					))}
				</div>
			</ContentPanel>
		</WorkspacePage>
	);
}
