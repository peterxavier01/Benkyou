import type {
	GenerationJobDetailV1,
	GenerationJobStatus,
} from "@benkyou/types";
import { Button, ContentPanel, HugeIcon } from "@benkyou/ui";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@benkyou/ui/components/alert";
import {
	type QueryClient,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import {
	generationJobQueryOptions,
	workspaceQueryKeys,
} from "#/features/workspace/workspace.queries";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";
import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import {
	cancelGenerationJob,
	processGenerationJob,
	retryGenerationJob,
} from "../course-generation.functions";
import {
	ChaptersPreview,
	GenerationSteps,
	headingFor,
	VideoSummary,
} from "./generation-parts";

interface GenerationStatusScreenProps {
	initialDetail: GenerationJobDetailV1;
	jobId: string;
}

async function refreshCourseCaches(queryClient: QueryClient, courseId: string) {
	queryClient.removeQueries({
		queryKey: workspaceQueryKeys.coursePlayer(courseId),
	});
	await queryClient.invalidateQueries({
		queryKey: workspaceQueryKeys.courseLibrary,
	});
}

function GenerationStatusScreen({
	initialDetail,
	jobId,
}: GenerationStatusScreenProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const processJob = useServerFn(processGenerationJob);
	const retryJob = useServerFn(retryGenerationJob);
	const cancelJob = useServerFn(cancelGenerationJob);
	const triggeredProcessingJobIdRef = useRef<string | null>(null);
	const refreshedJobIdRef = useRef<string | null>(null);
	const trackedTerminalStatusRef = useRef<GenerationJobStatus | null>(null);

	const jobQuery = useQuery({
		...generationJobQueryOptions(jobId),
		initialData: initialDetail,
		refetchInterval: (query) =>
			isTerminalStatus(query.state.data?.job.status ?? initialDetail.job.status)
				? false
				: 2500,
	});
	const detail = jobQuery.data;

	const processMutation = useMutation({
		mutationFn: () => processJob({ data: { generationJobId: jobId } }),
		onSuccess: async (result) => {
			queryClient.setQueryData(
				workspaceQueryKeys.generationJob(jobId),
				result.detail,
			);
			await refreshCourseCaches(queryClient, result.detail.course.id);
		},
	});

	const retryMutation = useMutation({
		mutationFn: () => retryJob({ data: { generationJobId: jobId } }),
		onSuccess: async (result) => {
			trackAnalyticsEvent("generation_job_retry_requested", {
				previous_status: detail.job.status,
			});
			queryClient.removeQueries({
				queryKey: workspaceQueryKeys.coursePlayer(result.courseId),
			});
			await queryClient.invalidateQueries({
				queryKey: workspaceQueryKeys.courseLibrary,
			});
			await navigate({ href: `/courses/new/${result.generationJobId}` });
		},
	});

	const cancelMutation = useMutation({
		mutationFn: () => cancelJob({ data: { generationJobId: jobId } }),
		onSuccess: async (result) => {
			trackAnalyticsEvent("generation_job_cancelled");
			queryClient.setQueryData(
				workspaceQueryKeys.generationJob(jobId),
				result.detail,
			);
			await refreshCourseCaches(queryClient, result.detail.course.id);
		},
	});

	useEffect(() => {
		if (!detail.canOpenCourse || refreshedJobIdRef.current === detail.job.id) {
			return;
		}

		refreshedJobIdRef.current = detail.job.id;
		void refreshCourseCaches(queryClient, detail.course.id);
	}, [detail.canOpenCourse, detail.course.id, detail.job.id, queryClient]);

	useEffect(() => {
		if (
			detail.job.status !== "queued" ||
			triggeredProcessingJobIdRef.current === jobId
		) {
			return;
		}

		triggeredProcessingJobIdRef.current = jobId;
		processMutation.mutate();
	}, [detail.job.status, jobId, processMutation]);

	useEffect(() => {
		if (
			!isTerminalStatus(detail.job.status) ||
			trackedTerminalStatusRef.current === detail.job.status
		) {
			return;
		}

		trackedTerminalStatusRef.current = detail.job.status;

		if (detail.job.status === "completed") {
			trackAnalyticsEvent("generation_status_completed_viewed", {
				chapter_count: detail.chapterCount,
			});
			return;
		}

		if (detail.job.status === "failed") {
			trackAnalyticsEvent("generation_status_failed_viewed", {
				has_failure_reason: Boolean(detail.job.failureReason),
			});
		}
	}, [detail.chapterCount, detail.job.failureReason, detail.job.status]);

	const status = detail.job.status;
	const terminal = isTerminalStatus(status);
	const failed = status === "failed" || status === "cancelled";

	return (
		<WorkspacePage
			title={headingFor(status)}
			description={detail.course.title}
			className="lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
			action={<BetterAuthHeader />}
		>
			<ContentPanel className="grid gap-6 p-5 sm:p-7" aria-live="polite">
				<VideoSummary detail={detail} />
				<div className="h-px bg-border" />
				<GenerationSteps steps={detail.timeline} />

				{status === "failed" ? (
					<Alert variant="destructive">
						<HugeIcon name="alertCircle" />
						<AlertTitle>Chapters couldn’t be created</AlertTitle>
						<AlertDescription className="text-pretty">
							{detail.job.failureReason ??
								"Something stopped the job before chapters were saved. Try again, or use a different video."}
						</AlertDescription>
					</Alert>
				) : null}
				{status === "cancelled" ? (
					<p className="text-muted-foreground text-sm">
						This was cancelled before the chapters were ready. You can try again
						or use a different video.
					</p>
				) : null}

				<div className="flex flex-wrap items-center gap-2 border-border border-t pt-5">
					{detail.canOpenCourse ? (
						<Button asChild>
							<Link
								to="/courses/$courseId"
								params={{ courseId: detail.course.id }}
								search={{ chapter: undefined, bookmark: undefined }}
							>
								Open notebook
								<HugeIcon name="arrowRight" className="size-4" />
							</Link>
						</Button>
					) : null}
					{detail.canRetry ? (
						<Button
							type="button"
							variant={failed ? "default" : "outline"}
							disabled={retryMutation.isPending}
							onClick={() => retryMutation.mutate()}
						>
							<HugeIcon name="refresh" className="size-4" />
							{retryMutation.isPending ? "Trying again…" : "Try again"}
						</Button>
					) : null}
					{failed ? (
						<Button asChild variant="outline">
							<Link to="/">Use a different video</Link>
						</Button>
					) : null}
					{detail.canCancel ? (
						<Button
							type="button"
							variant="ghost"
							disabled={cancelMutation.isPending}
							onClick={() => cancelMutation.mutate()}
						>
							{cancelMutation.isPending ? "Cancelling…" : "Cancel"}
						</Button>
					) : null}
					{terminal ? null : (
						<p className="basis-full text-[13px] text-muted-foreground sm:ml-auto sm:basis-auto">
							You can leave this page. It will be waiting in{" "}
							<Link to="/courses" search={{ q: "", filter: "all" }}>
								Notebooks
							</Link>
							.
						</p>
					)}
				</div>

				{processMutation.isError ? (
					<p role="alert" className="text-destructive text-sm">
						{processMutation.error instanceof Error
							? processMutation.error.message
							: "Couldn’t start preparing this notebook. Try again."}
					</p>
				) : null}
				{cancelMutation.isError ? (
					<p role="alert" className="text-destructive text-sm">
						{cancelMutation.error instanceof Error
							? cancelMutation.error.message
							: "Couldn’t cancel. Try again."}
					</p>
				) : null}
			</ContentPanel>

			{status === "completed" ? null : <ChaptersPreview status={status} />}
		</WorkspacePage>
	);
}

function isTerminalStatus(status: GenerationJobStatus) {
	return (
		status === "completed" || status === "failed" || status === "cancelled"
	);
}

export { GenerationStatusScreen };
