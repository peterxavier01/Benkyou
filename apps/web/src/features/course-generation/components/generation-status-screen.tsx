import type {
	GenerationJobDetailV1,
	GenerationJobStatus,
} from "@benkyou/types";
import { Button, ContentPanel, HugeIcon, StatusBadge } from "@benkyou/ui";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@benkyou/ui/components/alert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef } from "react";

import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import {
	cancelGenerationJob,
	getGenerationJob,
	processGenerationJob,
	retryGenerationJob,
} from "../course-generation.functions";

interface GenerationStatusScreenProps {
	initialDetail: GenerationJobDetailV1;
	jobId: string;
}

function GenerationStatusScreen({
	initialDetail,
	jobId,
}: GenerationStatusScreenProps) {
	const navigate = useNavigate();
	const router = useRouter();
	const queryClient = useQueryClient();
	const getJob = useServerFn(getGenerationJob);
	const processJob = useServerFn(processGenerationJob);
	const retryJob = useServerFn(retryGenerationJob);
	const cancelJob = useServerFn(cancelGenerationJob);
	const triggeredProcessingJobIdRef = useRef<string | null>(null);
	const refreshedJobIdRef = useRef<string | null>(null);

	const jobQuery = useQuery({
		queryKey: ["generation-job", jobId],
		queryFn: () => getJob({ data: { generationJobId: jobId } }),
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
			queryClient.setQueryData(["generation-job", jobId], result.detail);
			await refreshCourseCaches(result.detail.course.id);
		},
	});

	const retryMutation = useMutation({
		mutationFn: () => retryJob({ data: { generationJobId: jobId } }),
		onSuccess: async (result) => {
			queryClient.removeQueries({
				queryKey: ["course-player", result.courseId],
			});
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["course-library"] }),
				router.invalidate(),
			]);
			await navigate({ href: `/courses/new/${result.generationJobId}` });
		},
	});

	const cancelMutation = useMutation({
		mutationFn: () => cancelJob({ data: { generationJobId: jobId } }),
		onSuccess: async (result) => {
			queryClient.setQueryData(["generation-job", jobId], result.detail);
			await refreshCourseCaches(result.detail.course.id);
		},
	});

	const refreshCourseCaches = useCallback(
		async (courseId: string) => {
			queryClient.removeQueries({ queryKey: ["course-player", courseId] });
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["course-library"] }),
				router.invalidate(),
			]);
		},
		[queryClient, router],
	);

	useEffect(() => {
		if (!detail.canOpenCourse || refreshedJobIdRef.current === detail.job.id) {
			return;
		}

		refreshedJobIdRef.current = detail.job.id;
		void refreshCourseCaches(detail.course.id);
	}, [
		detail.canOpenCourse,
		detail.course.id,
		detail.job.id,
		refreshCourseCaches,
	]);

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

	const terminal = isTerminalStatus(detail.job.status);

	return (
		<WorkspacePage
			title="Generation"
			description="Convert this video into a structured course."
			className="lg:grid-cols-[minmax(0,1fr)_360px]"
			action={<BetterAuthHeader />}
		>
			<ContentPanel className="p-4 sm:p-6">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
					<VideoPreview detail={detail} />
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge tone={getBadgeTone(detail.job.status)}>
								{formatStatus(detail.job.status)}
							</StatusBadge>
							{jobQuery.isFetching && !terminal ? (
								<span className="text-muted-foreground text-xs">
									Refreshing
								</span>
							) : null}
						</div>
						<h1 className="mt-3 font-semibold text-2xl leading-tight tracking-normal">
							{detail.course.title}
						</h1>
						<p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
							{getStatusCopy(detail.job.status)}
						</p>

						{detail.job.status === "failed" ? (
							<Alert variant="destructive" className="mt-4">
								<AlertTitle>Generation failed</AlertTitle>
								<AlertDescription>
									{detail.job.failureReason ??
										"Benkyou could not generate this course."}
								</AlertDescription>
							</Alert>
						) : null}

						<div className="mt-5 flex flex-wrap gap-2">
							{detail.canOpenCourse ? (
								<Button asChild>
									<Link
										to="/courses/$courseId"
										params={{ courseId: detail.course.id }}
										search={{ chapter: undefined, bookmark: undefined }}
									>
										Open course
										<HugeIcon name="arrowRight" className="size-4" />
									</Link>
								</Button>
							) : null}
							{detail.canRetry ? (
								<Button
									type="button"
									variant="outline"
									disabled={retryMutation.isPending}
									onClick={() => retryMutation.mutate()}
								>
									<HugeIcon name="refresh" className="size-4" />
									{retryMutation.isPending ? "Retrying..." : "Retry"}
								</Button>
							) : null}
							{detail.canCancel ? (
								<Button
									type="button"
									variant="outline"
									disabled={cancelMutation.isPending}
									onClick={() => cancelMutation.mutate()}
								>
									<HugeIcon name="pause" className="size-4" />
									{cancelMutation.isPending ? "Cancelling..." : "Cancel"}
								</Button>
							) : null}
							<Button asChild type="button" variant="outline">
								<Link to="/">Use another URL</Link>
							</Button>
							<Button asChild type="button" variant="ghost">
								<Link to="/courses" search={{ q: "", filter: "all" }}>
									Keep working in background
								</Link>
							</Button>
						</div>

						{processMutation.isError ? (
							<p className="mt-3 text-destructive text-sm">
								{processMutation.error instanceof Error
									? processMutation.error.message
									: "Could not start generation."}
							</p>
						) : null}
						{cancelMutation.isError ? (
							<p className="mt-3 text-destructive text-sm">
								{cancelMutation.error instanceof Error
									? cancelMutation.error.message
									: "Could not cancel generation."}
							</p>
						) : null}
					</div>
				</div>
			</ContentPanel>

			<ContentPanel className="p-5">
				<div className="flex items-center justify-between gap-3">
					<h2 className="font-semibold text-base">Timeline</h2>
					<span className="text-muted-foreground text-xs">
						{detail.chapterCount} chapters
					</span>
				</div>
				<ol className="mt-4 space-y-3">
					{detail.timeline.map((step) => (
						<li
							key={step.key}
							className="rounded-md border border-border bg-muted/25 p-3"
						>
							<div className="flex items-start gap-3">
								<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
									<TimelineIcon status={step.status} />
								</span>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-medium text-sm">{step.label}</p>
										<StatusBadge tone={getTimelineTone(step.status)}>
											{step.status}
										</StatusBadge>
									</div>
									<p className="mt-1 text-muted-foreground text-xs leading-5">
										{step.description}
									</p>
								</div>
							</div>
						</li>
					))}
				</ol>
			</ContentPanel>
		</WorkspacePage>
	);
}

function VideoPreview({ detail }: { detail: GenerationJobDetailV1 }) {
	if (!detail.video.thumbnailUrl) {
		return (
			<div className="flex aspect-video w-full shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground sm:w-64">
				<HugeIcon name="aiVideo" className="size-8" />
			</div>
		);
	}

	return (
		<img
			src={detail.video.thumbnailUrl}
			alt=""
			className="aspect-video w-full shrink-0 rounded-md border border-border object-cover sm:w-64"
		/>
	);
}

function TimelineIcon({
	status,
}: {
	status: GenerationJobDetailV1["timeline"][number]["status"];
}) {
	const iconName =
		status === "completed"
			? "checkmarkCircle"
			: status === "failed"
				? "alertCircle"
				: status === "processing"
					? "loading"
					: "circle";

	return <HugeIcon name={iconName} className="size-4 text-primary" />;
}

function isTerminalStatus(status: GenerationJobStatus) {
	return (
		status === "completed" || status === "failed" || status === "cancelled"
	);
}

function getBadgeTone(status: GenerationJobStatus) {
	if (status === "completed") {
		return "success";
	}

	if (status === "failed" || status === "cancelled") {
		return "danger";
	}

	if (status === "processing") {
		return "info";
	}

	return "warning";
}

function getTimelineTone(
	status: GenerationJobDetailV1["timeline"][number]["status"],
) {
	if (status === "completed") {
		return "success";
	}

	if (status === "failed") {
		return "danger";
	}

	if (status === "processing") {
		return "info";
	}

	if (status === "skipped") {
		return "neutral";
	}

	return "neutral";
}

function formatStatus(status: GenerationJobStatus) {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusCopy(status: GenerationJobStatus) {
	if (status === "queued") {
		return "Benkyou is preparing this video for generation.";
	}

	if (status === "processing") {
		return "Captions are being converted into a structured course outline.";
	}

	if (status === "completed") {
		return "Your course is ready to open in the player.";
	}

	if (status === "failed") {
		return "The job stopped before chapters could be saved.";
	}

	return "This generation job was cancelled. You can retry it or use another URL.";
}

export { GenerationStatusScreen };
