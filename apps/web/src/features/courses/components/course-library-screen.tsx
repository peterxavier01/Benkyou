import type {
	CourseLibraryFilterV1,
	CourseLibraryItemDTO,
	GenerationJobStatus,
	GetCourseLibraryResponseV1,
} from "@benkyou/types";
import {
	Button,
	ContentPanel,
	HugeIcon,
	Input,
	Progress,
	StatusBadge,
} from "@benkyou/ui";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@benkyou/ui/components/alert-dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@benkyou/ui/components/empty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import {
	openSampleCourse,
	retryGenerationJob,
} from "../../course-generation/course-generation.functions";
import { deleteCourse, getCourseLibrary } from "../course-workspace.functions";

interface CourseLibraryScreenProps {
	initialData: GetCourseLibraryResponseV1;
	search: {
		q: string;
		filter: CourseLibraryFilterV1;
	};
}

const filterLabels: Record<CourseLibraryFilterV1, string> = {
	all: "All",
	"in-progress": "In progress",
	completed: "Completed",
	processing: "Processing",
	failed: "Failed",
};

function CourseLibraryScreen({
	initialData,
	search,
}: CourseLibraryScreenProps) {
	const navigate = useNavigate();
	const router = useRouter();
	const queryClient = useQueryClient();
	const getLibrary = useServerFn(getCourseLibrary);
	const retryJob = useServerFn(retryGenerationJob);
	const deleteCourseFn = useServerFn(deleteCourse);
	const openSample = useServerFn(openSampleCourse);

	const libraryQuery = useQuery({
		queryKey: ["course-library"],
		queryFn: () => getLibrary(),
		initialData,
	});

	const retryMutation = useMutation({
		mutationFn: (generationJobId: string) =>
			retryJob({ data: { generationJobId } }),
		onSuccess: async (result) => {
			await navigate({ href: `/courses/new/${result.generationJobId}` });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (courseId: string) => deleteCourseFn({ data: { courseId } }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["course-library"] });
			await router.invalidate();
		},
	});

	const sampleMutation = useMutation({
		mutationFn: () => openSample(),
		onSuccess: async (result) => {
			await navigate({ href: `/courses/${result.courseId}` });
		},
	});

	const filteredItems = useMemo(
		() => filterCourses(libraryQuery.data.items, search.filter, search.q),
		[libraryQuery.data.items, search.filter, search.q],
	);

	return (
		<WorkspacePage
			title="Courses"
			description="Resume generated courses and recover jobs in progress."
			action={
				<div className="flex items-center gap-2">
					<Button asChild size="sm">
						<Link to="/">Create course</Link>
					</Button>
					<BetterAuthHeader />
				</div>
			}
		>
			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<h1 className="font-semibold text-2xl tracking-normal">Courses</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Resume generated courses and recover jobs in progress.
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<label
							htmlFor="course-library-search"
							className="relative block min-w-0 sm:w-72"
						>
							<span className="sr-only">Search courses</span>
							<HugeIcon
								name="search"
								className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
							/>
							<Input
								id="course-library-search"
								value={search.q}
								placeholder="Search title or channel"
								className="pl-9"
								onChange={(event) =>
									void navigate({
										to: "/courses",
										search: {
											...search,
											q: event.target.value,
										},
										replace: true,
									})
								}
							/>
						</label>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap gap-2">
					{Object.entries(filterLabels).map(([filter, label]) => (
						<Button
							key={filter}
							type="button"
							size="sm"
							variant={search.filter === filter ? "default" : "outline"}
							onClick={() =>
								void navigate({
									to: "/courses",
									search: {
										...search,
										filter: filter as CourseLibraryFilterV1,
									},
									replace: true,
								})
							}
						>
							{label}
						</Button>
					))}
				</div>
			</ContentPanel>

			{libraryQuery.data.items.length === 0 ? (
				<EmptyState
					openingSample={sampleMutation.isPending}
					onOpenSample={() => sampleMutation.mutate()}
				/>
			) : (
				<div className="grid gap-3">
					{filteredItems.length === 0 ? (
						<ContentPanel className="p-8">
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<HugeIcon name="search" />
									</EmptyMedia>
									<EmptyTitle>No matching courses</EmptyTitle>
									<EmptyDescription>
										Adjust the search or filter to see more courses.
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						</ContentPanel>
					) : (
						filteredItems.map((item) => (
							<CourseRow
								key={item.course.id}
								item={item}
								deleting={deleteMutation.isPending}
								retrying={retryMutation.isPending}
								onRetry={(jobId) => retryMutation.mutate(jobId)}
								onDelete={(courseId) => deleteMutation.mutate(courseId)}
							/>
						))
					)}
				</div>
			)}
		</WorkspacePage>
	);
}

function EmptyState({
	openingSample,
	onOpenSample,
}: {
	openingSample: boolean;
	onOpenSample: () => void;
}) {
	return (
		<ContentPanel className="p-8">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HugeIcon name="library" />
					</EmptyMedia>
					<EmptyTitle>No courses yet</EmptyTitle>
					<EmptyDescription>
						Create a course from a YouTube URL or open the seeded sample.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-wrap justify-center gap-2">
						<Button asChild>
							<Link to="/">Create course</Link>
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={openingSample}
							onClick={onOpenSample}
						>
							<HugeIcon name="playCircle" className="size-4" />
							{openingSample ? "Opening..." : "Try sample course"}
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</ContentPanel>
	);
}

function CourseRow({
	item,
	deleting,
	retrying,
	onRetry,
	onDelete,
}: {
	item: CourseLibraryItemDTO;
	deleting: boolean;
	retrying: boolean;
	onRetry: (generationJobId: string) => void;
	onDelete: (courseId: string) => void;
}) {
	const status = item.latestGenerationJob?.status ?? "completed";
	const action = getCourseAction(item);

	return (
		<ContentPanel className="overflow-hidden p-0">
			<div className="grid gap-4 p-3 sm:grid-cols-[168px_minmax(0,1fr)] sm:p-4">
				<Thumbnail item={item} />
				<div className="min-w-0">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<StatusBadge tone={getStatusTone(status)}>
									{formatStatus(status)}
								</StatusBadge>
								<span className="text-muted-foreground text-xs">
									{item.chapterCount} chapters
								</span>
								{item.video.channelTitle ? (
									<span className="text-muted-foreground text-xs">
										{item.video.channelTitle}
									</span>
								) : null}
							</div>
							<h2 className="mt-2 truncate font-semibold text-lg tracking-normal">
								{item.course.title}
							</h2>
							<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
								{item.course.description ?? "No course description yet."}
							</p>
						</div>
						<div className="flex shrink-0 flex-wrap gap-2">
							<Button asChild size="sm" variant={action.variant}>
								<Link to={action.href}>{action.label}</Link>
							</Button>
							{(item.latestGenerationJob?.status === "failed" ||
								item.latestGenerationJob?.status === "cancelled") &&
							item.latestGenerationJob.retryable ? (
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={retrying}
									onClick={() => onRetry(item.latestGenerationJob?.id ?? "")}
								>
									<HugeIcon name="refresh" className="size-4" />
									Retry
								</Button>
							) : null}
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button type="button" size="icon-sm" variant="ghost">
										<HugeIcon name="delete" className="size-4" />
										<span className="sr-only">Delete {item.course.title}</span>
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete course?</AlertDialogTitle>
										<AlertDialogDescription>
											This removes the course from your library. Notes,
											bookmarks, and progress stay in the database for now.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											variant="destructive"
											disabled={deleting}
											onClick={() => onDelete(item.course.id)}
										>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
					<div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
						<div>
							<div className="mb-1 flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Progress</span>
								<span className="font-medium">
									{Math.round(item.progress?.completionPercent ?? 0)}%
								</span>
							</div>
							<Progress value={item.progress?.completionPercent ?? 0} />
						</div>
						<span className="text-muted-foreground text-xs">
							Updated {formatDate(item.course.updatedAt)}
						</span>
					</div>
				</div>
			</div>
		</ContentPanel>
	);
}

function Thumbnail({ item }: { item: CourseLibraryItemDTO }) {
	if (!item.video.thumbnailUrl) {
		return (
			<div className="flex aspect-video items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
				<HugeIcon name="aiVideo" className="size-8" />
			</div>
		);
	}

	return (
		<img
			src={item.video.thumbnailUrl}
			alt=""
			className="aspect-video w-full rounded-md border border-border object-cover"
		/>
	);
}

function filterCourses(
	items: CourseLibraryItemDTO[],
	filter: CourseLibraryFilterV1,
	query: string,
) {
	const normalizedQuery = query.trim().toLowerCase();

	return items.filter((item) => {
		const matchesFilter = matchesCourseFilter(item, filter);
		const haystack = [
			item.course.title,
			item.course.description,
			item.video.title,
			item.video.channelTitle,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		return (
			matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery))
		);
	});
}

function matchesCourseFilter(
	item: CourseLibraryItemDTO,
	filter: CourseLibraryFilterV1,
) {
	const status = item.latestGenerationJob?.status;
	const progress = item.progress?.completionPercent ?? 0;

	if (filter === "all") {
		return true;
	}

	if (filter === "processing") {
		return status === "queued" || status === "processing";
	}

	if (filter === "failed") {
		return status === "failed" || status === "cancelled";
	}

	if (filter === "completed") {
		return progress >= 100;
	}

	return progress > 0 && progress < 100;
}

function getCourseAction(item: CourseLibraryItemDTO) {
	const job = item.latestGenerationJob;

	if (job?.status === "queued" || job?.status === "processing") {
		return {
			href: `/courses/new/${job.id}`,
			label: "View job",
			variant: "outline" as const,
		};
	}

	if (job?.status === "failed" || job?.status === "cancelled") {
		return {
			href: `/courses/new/${job.id}`,
			label: "Review",
			variant: "outline" as const,
		};
	}

	return {
		href: `/courses/${item.course.id}`,
		label: "Open course",
		variant: "default" as const,
	};
}

function getStatusTone(status: GenerationJobStatus) {
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

function formatStatus(status: GenerationJobStatus) {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "recently";
	}

	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export { CourseLibraryScreen };
