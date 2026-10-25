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
			title="Notebooks"
			description="Every video you're studying, and the ones still being prepared."
		>
			<output className="sr-only">Loading your notebooks</output>
			<Skeleton className="h-[62px] w-full rounded-lg" />
			<div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex gap-1.5">
					{["w-14", "w-28", "w-20", "w-32", "w-20"].map((width) => (
						<Skeleton key={width} className={`h-8 rounded-full ${width}`} />
					))}
				</div>
				<Skeleton className="h-9 w-full lg:w-72" />
			</div>
			<ContentPanel className="divide-y divide-border p-0">
				{[0, 1, 2, 3, 4].map((item) => (
					<div key={item} className="flex items-center gap-4 px-4 py-3.5">
						<Skeleton className="aspect-video w-[72px] shrink-0 sm:w-24" />
						<div className="grid flex-1 gap-2">
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-3 w-1/3" />
						</div>
						<div className="hidden w-[200px] gap-2 sm:grid">
							<Skeleton className="h-3 w-2/3" />
							<Skeleton className="h-1 w-full" />
						</div>
					</div>
				))}
			</ContentPanel>
		</WorkspacePage>
	);
}
