import { ContentPanel, Skeleton } from "@benkyou/ui";
import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "#/components/workspace-layout";
import { CourseLibraryScreen } from "#/features/courses/components/course-library-screen";

export const Route = createLazyFileRoute("/_workspace/courses/")({
	component: CoursesRoute,
	pendingComponent: CourseLibraryPendingRoute,
});

function CoursesRoute() {
	const initialData = Route.useLoaderData();
	const search = Route.useSearch();

	return <CourseLibraryScreen initialData={initialData} search={search} />;
}

function CourseLibraryPendingRoute() {
	return (
		<WorkspacePage
			title="Courses"
			description="Resume saved study workspaces and recover jobs in progress."
		>
			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="w-full max-w-xl">
						<Skeleton className="h-7 w-28" />
						<Skeleton className="mt-2 h-4 w-80 max-w-full" />
					</div>
					<Skeleton className="h-9 w-full sm:w-72" />
				</div>
				<div className="mt-4 flex flex-wrap gap-2">
					{[0, 1, 2, 3, 4].map((item) => (
						<Skeleton key={item} className="h-8 w-24" />
					))}
				</div>
			</ContentPanel>
			<div className="grid gap-3">
				{[0, 1, 2].map((item) => (
					<ContentPanel key={item} className="p-3 sm:p-4">
						<div className="grid gap-4 sm:grid-cols-[168px_minmax(0,1fr)]">
							<Skeleton className="aspect-video w-full" />
							<div className="min-w-0">
								<Skeleton className="h-5 w-36" />
								<Skeleton className="mt-3 h-6 w-2/3" />
								<Skeleton className="mt-2 h-4 w-full" />
								<Skeleton className="mt-4 h-2 w-full" />
							</div>
						</div>
					</ContentPanel>
				))}
			</div>
		</WorkspacePage>
	);
}
