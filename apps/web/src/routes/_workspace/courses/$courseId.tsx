import { createFileRoute } from "@tanstack/react-router";
import { CoursePlayerScreen } from "#/features/courses/components/course-player-screen";
import { getCoursePlayerData } from "#/features/courses/course-workspace.functions";

export const Route = createFileRoute("/_workspace/courses/$courseId")({
	validateSearch: (search: Record<string, unknown>) => ({
		chapter: typeof search.chapter === "string" ? search.chapter : undefined,
	}),
	loader: ({ params }) =>
		getCoursePlayerData({ data: { courseId: params.courseId } }),
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
