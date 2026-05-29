import { Button, ContentPanel, HugeIcon, Skeleton } from "@benkyou/ui";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { WorkspacePage } from "#/components/workspace-layout";
import { CourseManagementScreen } from "#/features/courses/components/course-management-screen";

export const Route = createLazyFileRoute(
	"/_workspace/courses/$courseId_/manage",
)({
	component: CourseManageRoute,
	errorComponent: CourseManageErrorRoute,
	pendingComponent: CourseManagePendingRoute,
});

function CourseManageRoute() {
	const response = Route.useLoaderData();
	const params = Route.useParams();

	return (
		<CourseManagementScreen courseId={params.courseId} initialData={response} />
	);
}

function CourseManagePendingRoute() {
	return (
		<WorkspacePage
			title="Manage course"
			description="Loading course controls."
			maxWidth="wide"
		>
			<ContentPanel className="p-5">
				<Skeleton className="h-5 w-24" />
				<Skeleton className="mt-3 h-8 w-2/3" />
				<Skeleton className="mt-2 h-4 w-56" />
			</ContentPanel>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
				<Skeleton className="h-80 w-full" />
				<Skeleton className="h-80 w-full" />
			</div>
			<Skeleton className="h-96 w-full" />
		</WorkspacePage>
	);
}

function CourseManageErrorRoute() {
	return (
		<WorkspacePage
			title="Manage course"
			description="This course could not be managed."
			maxWidth="narrow"
		>
			<ContentPanel className="p-6">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
						<HugeIcon name="alertCircle" className="size-5" />
					</div>
					<div className="min-w-0 flex-1">
						<h1 className="font-semibold text-2xl tracking-normal">
							Course unavailable
						</h1>
						<p className="mt-2 text-muted-foreground text-sm leading-6">
							This course may be private, deleted, or no longer available to the
							current session.
						</p>
						<div className="mt-5 flex flex-wrap gap-2">
							<Button asChild>
								<Link to="/courses" search={{ q: "", filter: "all" }}>
									Open library
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link to="/">Use another URL</Link>
							</Button>
						</div>
					</div>
				</div>
			</ContentPanel>
		</WorkspacePage>
	);
}
