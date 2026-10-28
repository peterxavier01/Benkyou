import type { CoursePlayerDataDTO } from "@benkyou/types";
import { Button, ContentPanel, HugeIcon } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../../integrations/better-auth/header-user";

function NoChaptersScreen({
	data,
	onRetry,
	retrying,
}: {
	data: CoursePlayerDataDTO;
	onRetry: (generationJobId: string) => void;
	retrying: boolean;
}) {
	const latestJob = data.latestGenerationJob;
	const canRetry =
		Boolean(latestJob?.retryable) &&
		(latestJob?.status === "failed" || latestJob?.status === "cancelled");

	return (
		<WorkspacePage
			title={data.course.title}
			description="This notebook has no chapters yet."
			maxWidth="narrow"
			action={<BetterAuthHeader />}
		>
			<ContentPanel className="genko-grid flex flex-col items-center gap-4 p-8 text-center sm:p-12">
				<h1 className="max-w-lg font-semibold font-serif text-3xl leading-tight">
					This notebook has no chapters yet
				</h1>
				<p className="max-w-md text-muted-foreground text-sm leading-6">
					Chapters for “{data.course.title}” weren’t created. Check what
					happened, try again, or make a notebook from a different video.
				</p>
				<div className="flex flex-wrap justify-center gap-2 pt-1">
					{canRetry ? (
						<Button
							type="button"
							disabled={retrying}
							onClick={() => onRetry(latestJob?.id ?? "")}
						>
							<HugeIcon name="refresh" className="size-4" />
							{retrying ? "Trying again…" : "Try again"}
						</Button>
					) : null}
					{latestJob ? (
						<Button asChild variant="outline">
							<Link to="/notebooks/new/$jobId" params={{ jobId: latestJob.id }}>
								See what happened
							</Link>
						</Button>
					) : null}
					<Button asChild variant="outline">
						<Link to="/">Use a different video</Link>
					</Button>
				</div>
			</ContentPanel>
		</WorkspacePage>
	);
}

export { NoChaptersScreen };
