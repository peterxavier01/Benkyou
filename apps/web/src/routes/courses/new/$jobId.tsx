import { createFileRoute } from "@tanstack/react-router";
import { GenerationStatusScreen } from "#/features/course-generation/components/generation-status-screen";
import { getGenerationJob } from "#/features/course-generation/course-generation.functions";

export const Route = createFileRoute("/courses/new/$jobId")({
	loader: ({ params }) =>
		getGenerationJob({ data: { generationJobId: params.jobId } }),
	component: GenerationStatusRoute,
});

function GenerationStatusRoute() {
	const detail = Route.useLoaderData();
	const { jobId } = Route.useParams();

	return <GenerationStatusScreen initialDetail={detail} jobId={jobId} />;
}
