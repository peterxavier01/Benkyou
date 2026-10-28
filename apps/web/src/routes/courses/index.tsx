import { createFileRoute } from "@tanstack/react-router";
import { redirectFromLegacyCourseUrl } from "#/features/courses/legacy-course-urls";

export const Route = createFileRoute("/courses/")({
	beforeLoad: ({ location }) => redirectFromLegacyCourseUrl(location),
});
