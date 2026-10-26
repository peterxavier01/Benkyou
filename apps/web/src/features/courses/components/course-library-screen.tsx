import { formatTimestamp } from "@benkyou/core";
import type {
	CourseLibraryFilterV1,
	GetCourseLibraryResponseV1,
} from "@benkyou/types";
import {
	Button,
	ContentPanel,
	cn,
	HugeIcon,
	Input,
	ResumeBanner,
} from "@benkyou/ui";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@benkyou/ui/components/empty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	courseLibraryQueryOptions,
	workspaceQueryKeys,
} from "#/features/workspace/workspace.queries";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";
import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import {
	openSampleCourse,
	retryGenerationJob,
} from "../../course-generation/course-generation.functions";
import { deleteCourse } from "../course-workspace.functions";
import {
	countByFilter,
	filterLabels,
	filterNotebooks,
	findResumeCandidate,
	formatRelativeDay,
	hasFailed,
	isPreparing,
} from "./library/library-helpers";
import { NotebookRow, PreparingRow } from "./library/library-rows";

interface CourseLibraryScreenProps {
	initialData: GetCourseLibraryResponseV1;
	search: {
		q: string;
		filter: CourseLibraryFilterV1;
	};
}

function CourseLibraryScreen({
	initialData,
	search,
}: CourseLibraryScreenProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const retryJob = useServerFn(retryGenerationJob);
	const deleteCourseFn = useServerFn(deleteCourse);
	const openSample = useServerFn(openSampleCourse);

	const libraryQuery = useQuery({
		...courseLibraryQueryOptions(),
		initialData,
	});

	const retryMutation = useMutation({
		mutationFn: (generationJobId: string) =>
			retryJob({ data: { generationJobId } }),
		onSuccess: async (result) => {
			trackAnalyticsEvent("generation_job_retry_requested", {
				source: "course_library",
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

	const deleteMutation = useMutation({
		mutationFn: (courseId: string) => deleteCourseFn({ data: { courseId } }),
		onSuccess: async () => {
			trackAnalyticsEvent("course_deleted", { source: "course_library" });
			await queryClient.invalidateQueries({
				queryKey: workspaceQueryKeys.courseLibrary,
			});
		},
	});

	const sampleMutation = useMutation({
		mutationFn: () => openSample(),
		onSuccess: async (result) => {
			trackAnalyticsEvent("sample_course_opened", {
				source: "course_library",
			});
			await queryClient.invalidateQueries({
				queryKey: workspaceQueryKeys.courseLibrary,
			});
			await navigate({ href: `/courses/${result.courseId}` });
		},
	});

	const items = libraryQuery.data.items;
	const filtered = filterNotebooks(items, search.filter, search.q);
	const counts = countByFilter(items);
	const resume = findResumeCandidate(items);
	const jobs = filtered.filter((item) => isPreparing(item) || hasFailed(item));
	const notebooks = filtered.filter(
		(item) => !isPreparing(item) && !hasFailed(item),
	);
	const rowProps = {
		deleting: deleteMutation.isPending,
		onDelete: (courseId: string) => deleteMutation.mutate(courseId),
	};

	const setSearch = (next: Partial<CourseLibraryScreenProps["search"]>) =>
		void navigate({
			to: "/courses",
			search: { ...search, ...next },
			replace: true,
		});

	return (
		<WorkspacePage
			title="Notebooks"
			description="Every video you're studying, and the ones still being prepared."
			action={<BetterAuthHeader />}
		>
			{items.length === 0 ? (
				<LibraryEmptyState
					openingSample={sampleMutation.isPending}
					onOpenSample={() => sampleMutation.mutate()}
				/>
			) : (
				<>
					{resume?.progress ? (
						<ResumeBanner
							time={formatTimestamp(resume.progress.resumeSeconds)}
							context={`${resume.course.title} · ${formatRelativeDay(
								resume.progress.updatedAt,
							).toLowerCase()}`}
							action={
								<Button asChild size="sm">
									<Link
										to="/courses/$courseId"
										params={{ courseId: resume.course.id }}
										search={{ chapter: undefined, bookmark: undefined }}
									>
										<HugeIcon name="play" className="size-3.5" />
										Resume
									</Link>
								</Button>
							}
						/>
					) : null}

					<div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
						<fieldset
							aria-label="Filter notebooks"
							className="-mx-3 m-0 flex min-w-0 touch-scrollbar-none gap-1.5 overflow-x-auto border-0 p-0 px-3 lg:mx-0 lg:flex-wrap lg:px-0"
						>
							{(Object.keys(filterLabels) as CourseLibraryFilterV1[]).map(
								(filter) => {
									const active = search.filter === filter;
									return (
										<button
											key={filter}
											type="button"
											aria-pressed={active}
											onClick={() => {
												trackAnalyticsEvent("library_filter_changed", {
													filter,
													query_length: search.q.length,
												});
												setSearch({ filter });
											}}
											className={cn(
												"inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-8",
												active
													? "border-foreground bg-foreground font-semibold text-background"
													: "border-border bg-card font-medium text-foreground hover:bg-muted",
											)}
										>
											{filterLabels[filter]}
											<span className="tabular-nums opacity-70">
												{counts[filter]}
											</span>
										</button>
									);
								},
							)}
						</fieldset>
						<label
							htmlFor="notebook-search"
							className="relative block min-w-0 lg:w-72"
						>
							<span className="sr-only">Search notebooks</span>
							<HugeIcon
								name="search"
								className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
							/>
							<Input
								id="notebook-search"
								type="search"
								value={search.q}
								placeholder="Search title or channel"
								className="ph-no-capture h-11 pl-9 text-base lg:h-9 lg:text-sm"
								onChange={(event) => setSearch({ q: event.target.value })}
							/>
						</label>
					</div>

					{jobs.length > 0 ? (
						<ContentPanel className="overflow-hidden p-0">
							<h2 className="px-4 pt-3 pb-1 font-semibold text-muted-foreground text-xs">
								Being prepared
							</h2>
							<ul className="divide-y divide-border">
								{jobs.map((item) => (
									<PreparingRow
										key={item.course.id}
										item={item}
										retrying={retryMutation.isPending}
										onRetry={(jobId) => retryMutation.mutate(jobId)}
										{...rowProps}
									/>
								))}
							</ul>
						</ContentPanel>
					) : null}

					{notebooks.length > 0 ? (
						<ContentPanel className="overflow-hidden p-0">
							<ul aria-label="Notebooks" className="divide-y divide-border">
								{notebooks.map((item) => (
									<NotebookRow key={item.course.id} item={item} {...rowProps} />
								))}
							</ul>
						</ContentPanel>
					) : null}

					{filtered.length === 0 ? (
						<ContentPanel className="p-8">
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<HugeIcon name="search" />
									</EmptyMedia>
									<EmptyTitle>No notebooks match</EmptyTitle>
									<EmptyDescription>
										Try a different search or filter.
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button
										type="button"
										variant="outline"
										onClick={() => setSearch({ q: "", filter: "all" })}
									>
										Show all notebooks
									</Button>
								</EmptyContent>
							</Empty>
						</ContentPanel>
					) : null}
				</>
			)}
		</WorkspacePage>
	);
}

function LibraryEmptyState({
	openingSample,
	onOpenSample,
}: {
	openingSample: boolean;
	onOpenSample: () => void;
}) {
	return (
		<ContentPanel className="genko-grid p-8 sm:p-12">
			<Empty>
				<EmptyHeader>
					<EmptyTitle className="font-serif text-2xl">
						No notebooks yet
					</EmptyTitle>
					<EmptyDescription>
						Paste a YouTube link to make your first one, or open the sample
						notebook to see how it works.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-wrap justify-center gap-2">
						<Button asChild>
							<Link to="/">
								<HugeIcon name="add" className="size-4" />
								New notebook
							</Link>
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={openingSample}
							onClick={onOpenSample}
						>
							<HugeIcon name="playCircle" className="size-4" />
							{openingSample ? "Opening…" : "Open the sample"}
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</ContentPanel>
	);
}

export { CourseLibraryScreen };
