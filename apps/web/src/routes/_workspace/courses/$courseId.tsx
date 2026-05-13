import { Button, ContentPanel, HugeIcon, Skeleton } from "@benkyou/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspacePage } from "#/components/workspace-layout";
import { CoursePlayerScreen } from "#/features/courses/components/course-player-screen";
import { getCoursePlayerData } from "#/features/courses/course-workspace.functions";

export const Route = createFileRoute("/_workspace/courses/$courseId")({
	validateSearch: (search: Record<string, unknown>) => ({
		chapter: typeof search.chapter === "string" ? search.chapter : undefined,
	}),
	loader: ({ params }) =>
		getCoursePlayerData({ data: { courseId: params.courseId } }),
	pendingComponent: CoursePlayerPendingRoute,
	errorComponent: CoursePlayerErrorRoute,
	component: CoursePlayerRoute,
});

function CoursePlayerRoute() {
	const response = Route.useLoaderData();
	const params = Route.useParams();
	const search = Route.useSearch();

	return (
		<CoursePlayerScreen
			initialData={response.data}
			courseId={params.courseId}
			initialChapterId={search.chapter}
		/>
	);
}

function CoursePlayerPendingRoute() {
	return (
		<WorkspacePage
			title="Course player"
			description="Loading course workspace."
			maxWidth="full"
			className="p-0 sm:p-0"
		>
			<div className="grid min-h-[calc(100dvh-3.5rem)] gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className="min-w-0 space-y-3 border-border border-r p-3 sm:p-4">
					<ContentPanel className="p-4">
						<div className="flex items-start justify-between gap-4">
							<div className="w-full max-w-xl space-y-2">
								<Skeleton className="h-5 w-28" />
								<Skeleton className="h-7 w-3/4" />
								<Skeleton className="h-4 w-48" />
							</div>
							<Skeleton className="h-9 w-28 md:hidden" />
						</div>
						<Skeleton className="mt-3 h-2 w-full" />
					</ContentPanel>
					<Skeleton className="aspect-video w-full rounded-lg" />
					<ContentPanel className="p-4">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="mt-4 h-24 w-full" />
					</ContentPanel>
				</div>
				<aside className="hidden min-h-0 border-border border-l lg:block">
					<div className="border-border border-b p-3">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="mt-2 h-3 w-44" />
					</div>
					<div className="space-y-2 p-2">
						{[0, 1, 2, 3].map((item) => (
							<Skeleton key={item} className="h-24 w-full" />
						))}
					</div>
				</aside>
			</div>
		</WorkspacePage>
	);
}

function CoursePlayerErrorRoute() {
	return (
		<WorkspacePage
			title="Course player"
			description="This course could not be opened."
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
