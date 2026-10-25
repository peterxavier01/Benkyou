import type {
	GenerationJobDetailV1,
	GenerationJobStatus,
	GenerationTimelineStepV1,
} from "@benkyou/types";
import { ContentPanel, cn, HugeIcon, Skeleton } from "@benkyou/ui";

const stepStatusLabel: Record<GenerationTimelineStepV1["status"], string> = {
	pending: "Not started",
	processing: "In progress",
	completed: "Done",
	failed: "Failed",
	skipped: "Skipped",
};

function GenerationSteps({ steps }: { steps: GenerationTimelineStepV1[] }) {
	return (
		<ol aria-label="Progress" className="grid">
			{steps.map((step, index) => {
				const last = index === steps.length - 1;
				return (
					<li key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
						{last ? null : (
							<span
								aria-hidden="true"
								className={cn(
									"absolute top-8 bottom-1 left-[13px] w-0.5",
									step.status === "completed" ? "bg-foreground" : "bg-border",
								)}
							/>
						)}
						<StepMark status={step.status} />
						<span className="min-w-0 pt-1">
							<span
								className={cn(
									"block text-[15px]",
									step.status === "pending" && "text-muted-foreground",
									step.status === "failed" && "font-semibold text-destructive",
									step.status === "processing" && "font-semibold",
									(step.status === "completed" || step.status === "skipped") &&
										"font-medium",
								)}
							>
								{step.label}
								<span className="sr-only">
									: {stepStatusLabel[step.status]}
								</span>
							</span>
							<span className="mt-0.5 block text-muted-foreground text-[13px] leading-normal">
								{step.status === "skipped"
									? "Not needed: the creator’s timestamps were used."
									: step.description}
							</span>
						</span>
					</li>
				);
			})}
		</ol>
	);
}

function StepMark({ status }: { status: GenerationTimelineStepV1["status"] }) {
	const base =
		"relative flex size-7 shrink-0 items-center justify-center rounded-full";

	if (status === "completed" || status === "skipped") {
		return (
			<span className={cn(base, "bg-foreground text-background")}>
				<HugeIcon name="check" className="size-4" />
			</span>
		);
	}

	if (status === "processing") {
		return (
			<span className={cn(base, "bg-accent text-primary")}>
				<HugeIcon
					name="loading"
					className="size-4 animate-spin motion-reduce:animate-none"
				/>
			</span>
		);
	}

	if (status === "failed") {
		return (
			<span className={cn(base, "bg-destructive/10 text-destructive")}>
				<HugeIcon name="alertCircle" className="size-4" />
			</span>
		);
	}

	return <span className={cn(base, "border-[1.5px] border-input")} />;
}

function VideoSummary({ detail }: { detail: GenerationJobDetailV1 }) {
	const minutes = detail.video.durationSeconds
		? Math.max(1, Math.round(detail.video.durationSeconds / 60))
		: null;
	const length = minutes
		? minutes >= 60
			? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`
			: `${minutes}m`
		: null;

	return (
		<div className="flex items-center gap-4">
			{detail.video.thumbnailUrl ? (
				<img
					src={detail.video.thumbnailUrl}
					alt=""
					className="aspect-video w-28 shrink-0 rounded object-cover sm:w-40"
				/>
			) : (
				<span className="flex aspect-video w-28 shrink-0 items-center justify-center rounded bg-foreground text-muted sm:w-40">
					<HugeIcon name="play" className="size-4 fill-current" />
				</span>
			)}
			<div className="min-w-0">
				<p className="line-clamp-2 font-semibold font-serif text-lg leading-snug sm:text-xl">
					{detail.course.title}
				</p>
				<p className="mt-1 truncate text-muted-foreground text-[13px] tabular-nums">
					{["YouTube", detail.video.channelTitle, length]
						.filter(Boolean)
						.join(" · ")}
				</p>
			</div>
		</div>
	);
}

function ChaptersPreview({ status }: { status: GenerationJobStatus }) {
	const widths = ["58%", "44%", "66%", "38%", "52%", "47%"];

	if (status === "failed" || status === "cancelled") {
		return (
			<aside className="grid gap-2 rounded-lg bg-muted p-5">
				<h2 className="font-semibold text-sm">Which videos always work</h2>
				<p className="text-muted-foreground text-sm leading-relaxed">
					Videos whose description lists timestamps (like{" "}
					<span className="tabular-nums">0:00 Intro</span>). Benkyou uses those
					as chapters directly, without needing captions.
				</p>
			</aside>
		);
	}

	return (
		<ContentPanel
			aria-hidden="true"
			className="hidden gap-1.5 px-2 py-4 lg:grid"
		>
			<span className="px-3 pb-1.5 font-medium text-muted-foreground text-[13px]">
				Your chapters will appear here
			</span>
			{widths.map((width) => (
				<span key={width} className="flex h-11 items-center gap-3 px-3">
					<Skeleton className="size-[22px] shrink-0 rounded-full" />
					<Skeleton className="h-2.5 w-5 shrink-0" />
					<Skeleton className="h-3" style={{ width }} />
					<Skeleton className="ml-auto h-2.5 w-10 shrink-0" />
				</span>
			))}
		</ContentPanel>
	);
}

function headingFor(status: GenerationJobStatus) {
	switch (status) {
		case "completed":
			return "Your notebook is ready";
		case "failed":
			return "Couldn’t prepare this notebook";
		case "cancelled":
			return "Notebook cancelled";
		default:
			return "Preparing your notebook";
	}
}

export { ChaptersPreview, GenerationSteps, headingFor, VideoSummary };
