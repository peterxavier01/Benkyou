import type { CourseLibraryFilterV1 } from "@benkyou/types";
import { createFileRoute } from "@tanstack/react-router";
import { CourseLibraryScreen } from "../../features/courses/components/course-library-screen";
import { getCourseLibrary } from "../../features/courses/course-workspace.functions";

const filters = new Set<CourseLibraryFilterV1>([
	"all",
	"in-progress",
	"completed",
	"processing",
	"failed",
]);

export const Route = createFileRoute("/courses/")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : "",
		filter:
			typeof search.filter === "string" &&
			filters.has(search.filter as CourseLibraryFilterV1)
				? (search.filter as CourseLibraryFilterV1)
				: "all",
	}),
	loader: () => getCourseLibrary(),
	component: CoursesRoute,
});

function CoursesRoute() {
	const initialData = Route.useLoaderData();
	const search = Route.useSearch();

	return <CourseLibraryScreen initialData={initialData} search={search} />;
}
