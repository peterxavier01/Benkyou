import {
	updateChapterRequestV1Schema,
	updateCourseMetadataRequestV1Schema,
} from "@benkyou/core";
import type {
	CourseChapterDTO,
	GetCourseManagementDataResponseV1,
} from "@benkyou/types";
import {
	Button,
	ContentPanel,
	HugeIcon,
	Input,
	Label,
	StatusBadge,
	Textarea,
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@benkyou/ui/components/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@benkyou/ui/components/table";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
	courseManagementQueryOptions,
	workspaceQueryKeys,
} from "#/features/workspace/workspace.queries";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";
import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import {
	deleteCourse,
	exportCourseMarkdown,
	regenerateChapters,
	updateChapter,
	updateCourseMetadata,
} from "../course-workspace.functions";

interface CourseManagementScreenProps {
	courseId: string;
	initialData: GetCourseManagementDataResponseV1;
}

interface MetadataValues {
	title: string;
	description: string;
}

interface ChapterValues {
	title: string;
	summary: string;
	startSeconds: number;
	endSeconds: number | null;
}

function CourseManagementScreen({
	courseId,
	initialData,
}: CourseManagementScreenProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const updateMetadataFn = useServerFn(updateCourseMetadata);
	const updateChapterFn = useServerFn(updateChapter);
	const regenerateFn = useServerFn(regenerateChapters);
	const deleteCourseFn = useServerFn(deleteCourse);
	const exportCourse = useServerFn(exportCourseMarkdown);
	const [editingChapter, setEditingChapter] = useState<CourseChapterDTO | null>(
		null,
	);
	const [formError, setFormError] = useState<string | null>(null);
	const [exportPending, setExportPending] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	const managementQuery = useQuery({
		...courseManagementQueryOptions(courseId),
		initialData,
	});
	const data = managementQuery.data.data;

	const metadataMutation = useMutation({
		mutationFn: (values: MetadataValues) =>
			updateMetadataFn({
				data: {
					courseId,
					title: values.title,
					description: values.description,
				},
			}),
		onSuccess: async () => {
			trackAnalyticsEvent("course_metadata_updated");
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: workspaceQueryKeys.courseManagement(courseId),
				}),
				queryClient.invalidateQueries({
					queryKey: workspaceQueryKeys.coursePlayer(courseId),
				}),
				queryClient.invalidateQueries({
					queryKey: workspaceQueryKeys.courseLibrary,
				}),
			]);
		},
	});

	const chapterMutation = useMutation({
		mutationFn: (values: ChapterValues & { chapterId: string }) =>
			updateChapterFn({
				data: {
					chapterId: values.chapterId,
					title: values.title,
					summary: values.summary,
					startSeconds: values.startSeconds,
					endSeconds: values.endSeconds,
				},
			}),
		onSuccess: async () => {
			trackAnalyticsEvent("chapter_metadata_updated");
			setEditingChapter(null);
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: workspaceQueryKeys.courseManagement(courseId),
				}),
				queryClient.invalidateQueries({
					queryKey: workspaceQueryKeys.coursePlayer(courseId),
				}),
				queryClient.invalidateQueries({
					queryKey: workspaceQueryKeys.courseLibrary,
				}),
			]);
		},
	});

	const regenerateMutation = useMutation({
		mutationFn: () => regenerateFn({ data: { courseId } }),
		onSuccess: async (result) => {
			trackAnalyticsEvent("course_regenerate_requested", {
				chapter_count: data.chapters.length,
			});
			trackAnalyticsEvent("generation_job_started", {
				source: "course_management",
			});
			queryClient.removeQueries({
				queryKey: workspaceQueryKeys.coursePlayer(courseId),
			});
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: workspaceQueryKeys.courseManagement(courseId),
				}),
				queryClient.invalidateQueries({
					queryKey: workspaceQueryKeys.courseLibrary,
				}),
			]);
			await navigate({ href: `/courses/new/${result.generationJobId}` });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => deleteCourseFn({ data: { courseId } }),
		onSuccess: async () => {
			trackAnalyticsEvent("course_deleted", {
				source: "course_management",
			});
			queryClient.removeQueries({
				queryKey: workspaceQueryKeys.courseManagement(courseId),
			});
			queryClient.removeQueries({
				queryKey: workspaceQueryKeys.coursePlayer(courseId),
			});
			await queryClient.invalidateQueries({
				queryKey: workspaceQueryKeys.courseLibrary,
			});
			await navigate({ to: "/courses", search: { q: "", filter: "all" } });
		},
	});

	async function handleExportCourse() {
		setExportError(null);
		setExportPending(true);
		try {
			const result = await exportCourse({ data: { courseId } });
			trackAnalyticsEvent("course_exported", {
				source: "course_management",
			});
			downloadText(result.filename, result.markdown);
		} catch (error) {
			setExportError(error instanceof Error ? error.message : "Export failed.");
		}
		setExportPending(false);
	}

	const metadataForm = useForm({
		defaultValues: {
			title: data.course.title,
			description: data.course.description ?? "",
		} satisfies MetadataValues,
		validators: {
			onSubmit: ({ value }) => {
				const result = updateCourseMetadataRequestV1Schema.safeParse({
					courseId,
					title: value.title,
					description: value.description,
				});

				return result.success ? undefined : zodFormErrors(result.error);
			},
		},
		onSubmit: async ({ value }) => {
			setFormError(null);
			try {
				await metadataMutation.mutateAsync(value);
			} catch (error) {
				setFormError(toErrorMessage(error));
			}
		},
	});

	return (
		<WorkspacePage
			title="Manage course"
			description="Correct metadata, chapters, and data ownership."
			maxWidth="wide"
			action={
				<div className="flex items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<Link
							to="/courses/$courseId"
							params={{ courseId }}
							search={{ chapter: undefined, bookmark: undefined }}
						>
							Open course
						</Link>
					</Button>
					<BetterAuthHeader />
				</div>
			}
		>
			<ContentPanel className="overflow-hidden p-4 sm:p-5">
				<div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge tone="success">Private</StatusBadge>
							{data.latestGenerationJob ? (
								<StatusBadge tone="info">
									{data.latestGenerationJob.status}
								</StatusBadge>
							) : null}
						</div>
						<h1 className="mt-3 max-w-[72rem] truncate font-semibold text-2xl tracking-normal">
							{data.course.title}
						</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							{data.chapters.length} chapters. Updated{" "}
							{formatDate(data.course.updatedAt)}.
						</p>
					</div>
					<div className="grid min-w-0 gap-2 sm:grid-cols-3 xl:w-[29rem]">
						<Button
							type="button"
							variant="outline"
							className="w-full"
							disabled={exportPending}
							onClick={() => void handleExportCourse()}
						>
							<HugeIcon name="note" className="size-4" />
							<span className="truncate">
								{exportPending ? "Exporting..." : "Export"}
							</span>
						</Button>
						<RegenerateDialog
							pending={regenerateMutation.isPending}
							onConfirm={() => regenerateMutation.mutate()}
						/>
						<DeleteDialog
							title={data.course.title}
							pending={deleteMutation.isPending}
							onConfirm={() => deleteMutation.mutate()}
						/>
					</div>
				</div>
				{exportError ? (
					<p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
						{exportError}
					</p>
				) : null}
			</ContentPanel>

			<div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
				<ContentPanel className="min-w-0 p-4 sm:p-5">
					<h2 className="font-semibold text-base">Course metadata</h2>
					{formError ? (
						<p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
							{formError}
						</p>
					) : null}
					<form
						className="mt-4 grid gap-4"
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void metadataForm.handleSubmit();
						}}
					>
						<metadataForm.Field name="title">
							{(field) => (
								<div className="grid min-w-0 gap-2">
									<Label htmlFor="course-title">Title</Label>
									<Input
										id="course-title"
										className="ph-no-capture min-w-0"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</metadataForm.Field>
						<metadataForm.Field name="description">
							{(field) => (
								<div className="grid min-w-0 gap-2">
									<Label htmlFor="course-description">Description</Label>
									<Textarea
										id="course-description"
										className="ph-no-capture min-w-0 resize-y"
										value={field.state.value}
										rows={5}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</metadataForm.Field>
						<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
							<p className="min-w-0 text-muted-foreground text-xs">
								Public and unlisted visibility are disabled for the Open Beta.
							</p>
							<Button type="submit" disabled={metadataMutation.isPending}>
								{metadataMutation.isPending ? "Saving..." : "Save metadata"}
							</Button>
						</div>
					</form>
				</ContentPanel>

				<SourceVideoPanel data={data} />
			</div>

			<ContentPanel className="min-w-0 overflow-hidden p-0">
				<div className="border-border border-b p-4 sm:p-5">
					<h2 className="font-semibold text-base">Chapters</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						Correct generated titles, summaries, and time ranges.
					</p>
				</div>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[76px]">Start</TableHead>
								<TableHead>Title</TableHead>
								<TableHead className="hidden md:table-cell">Summary</TableHead>
								<TableHead className="w-[96px] text-right">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.chapters.map((chapter) => (
								<TableRow key={chapter.id}>
									<TableCell className="font-medium text-xs">
										{formatTimestamp(chapter.startSeconds)}
									</TableCell>
									<TableCell>
										<p className="font-medium">{chapter.title}</p>
										<p className="text-muted-foreground text-xs md:hidden">
											{chapter.summary ?? "No summary."}
										</p>
									</TableCell>
									<TableCell className="hidden max-w-xl text-muted-foreground text-sm md:table-cell">
										<p className="line-clamp-2">
											{chapter.summary ?? "No summary."}
										</p>
									</TableCell>
									<TableCell className="text-right">
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => setEditingChapter(chapter)}
										>
											Edit
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</ContentPanel>

			<ChapterEditDialog
				chapter={editingChapter}
				pending={chapterMutation.isPending}
				error={chapterMutation.error}
				onOpenChange={(open) => {
					if (!open) {
						setEditingChapter(null);
						chapterMutation.reset();
					}
				}}
				onSubmit={(values) => {
					if (editingChapter) {
						chapterMutation.mutate({ ...values, chapterId: editingChapter.id });
					}
				}}
			/>
		</WorkspacePage>
	);
}

function SourceVideoPanel({
	data,
}: {
	data: GetCourseManagementDataResponseV1["data"];
}) {
	const fallbackDurationSeconds = getChapterMapDuration(data.chapters);
	const durationSeconds = data.video.durationSeconds ?? fallbackDurationSeconds;

	return (
		<ContentPanel className="min-w-0 overflow-hidden p-4 sm:p-5">
			<h2 className="font-semibold text-base">Source video</h2>
			{data.video.thumbnailUrl ? (
				<img
					src={data.video.thumbnailUrl}
					alt=""
					className="mt-4 aspect-video w-full rounded-md border border-border object-cover"
				/>
			) : (
				<div className="mt-4 flex aspect-video items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
					<HugeIcon name="aiVideo" className="size-8" />
				</div>
			)}
			<div className="mt-4 grid min-w-0 gap-3 text-sm">
				<Detail label="Provider" value={data.video.provider} />
				<Detail label="Video" value={data.video.title ?? "Untitled video"} />
				<Detail label="Channel" value={data.video.channelTitle ?? "Unknown"} />
				<Detail
					label="Duration"
					value={
						durationSeconds
							? `${formatTimestamp(durationSeconds)}${
									data.video.durationSeconds ? "" : " from chapter map"
								}`
							: "Unknown"
					}
				/>
				<a
					href={data.video.canonicalUrl}
					className="block min-w-0 truncate text-primary text-sm"
					target="_blank"
					rel="noreferrer"
				>
					{data.video.canonicalUrl}
				</a>
			</div>
		</ContentPanel>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="mt-0.5 wrap-break-word font-medium">{value}</p>
		</div>
	);
}

function getChapterMapDuration(chapters: CourseChapterDTO[]) {
	const finalChapter = chapters.at(-1);

	return finalChapter?.endSeconds ?? null;
}

function ChapterEditDialog({
	chapter,
	error,
	onOpenChange,
	onSubmit,
	pending,
}: {
	chapter: CourseChapterDTO | null;
	error: Error | null;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: ChapterValues) => void;
	pending: boolean;
}) {
	const form = useForm({
		defaultValues: {
			title: chapter?.title ?? "",
			summary: chapter?.summary ?? "",
			startSeconds: chapter?.startSeconds ?? 0,
			endSeconds: chapter?.endSeconds ?? null,
		} satisfies ChapterValues,
		validators: {
			onSubmit: ({ value }) => {
				const result = updateChapterRequestV1Schema.safeParse({
					chapterId: chapter?.id,
					...value,
				});

				return result.success ? undefined : zodFormErrors(result.error);
			},
		},
		onSubmit: ({ value }) => onSubmit(value),
	});

	useEffect(() => {
		if (!chapter) {
			return;
		}

		form.reset({
			title: chapter.title,
			summary: chapter.summary ?? "",
			startSeconds: chapter.startSeconds,
			endSeconds: chapter.endSeconds ?? null,
		});
	}, [chapter, form]);

	return (
		<Dialog open={Boolean(chapter)} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit chapter</DialogTitle>
					<DialogDescription>
						Update the generated chapter without changing learner notes.
					</DialogDescription>
				</DialogHeader>
				{error ? (
					<p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
						{error.message}
					</p>
				) : null}
				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="title">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor="chapter-title">Title</Label>
								<Input
									id="chapter-title"
									className="ph-no-capture"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="summary">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor="chapter-summary">Summary</Label>
								<Textarea
									id="chapter-summary"
									className="ph-no-capture"
									value={field.state.value}
									rows={4}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<div className="grid gap-3 sm:grid-cols-2">
						<form.Field name="startSeconds">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="chapter-start">Start seconds</Label>
									<Input
										id="chapter-start"
										type="number"
										min={0}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) =>
											field.handleChange(event.target.valueAsNumber || 0)
										}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
						<form.Field name="endSeconds">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="chapter-end">End seconds</Label>
									<Input
										id="chapter-end"
										type="number"
										min={0}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(event) =>
											field.handleChange(
												event.target.value === ""
													? null
													: event.target.valueAsNumber,
											)
										}
									/>
									<FieldError errors={field.state.meta.errors} />
								</div>
							)}
						</form.Field>
					</div>
					<DialogFooter className="mt-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={pending}>
							{pending ? "Saving..." : "Save chapter"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function RegenerateDialog({
	onConfirm,
	pending,
}: {
	onConfirm: () => void;
	pending: boolean;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button type="button" variant="outline" className="w-full">
					<HugeIcon name="refresh" className="size-4" />
					<span className="truncate">
						{pending ? "Starting..." : "Regenerate"}
					</span>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Regenerate chapters?</AlertDialogTitle>
					<AlertDialogDescription>
						Benkyou will create a new generation job. Existing notes, progress,
						and bookmarks are preserved by matching timestamps where possible.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction disabled={pending} onClick={onConfirm}>
						{pending ? "Starting..." : "Regenerate"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function DeleteDialog({
	onConfirm,
	pending,
	title,
}: {
	onConfirm: () => void;
	pending: boolean;
	title: string;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button type="button" variant="destructive" className="w-full">
					<HugeIcon name="delete" className="size-4" />
					<span className="truncate">{pending ? "Deleting..." : "Delete"}</span>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {title}?</AlertDialogTitle>
					<AlertDialogDescription>
						This removes the course from the library. The action is intentional
						and can be recovered only from the database.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={pending}
						onClick={onConfirm}
					>
						{pending ? "Deleting..." : "Delete course"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function FieldError({ errors }: { errors: unknown[] }) {
	const error = getFieldError(errors);

	return error ? <p className="text-destructive text-sm">{error}</p> : null;
}

function zodFormErrors(error: {
	issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
	const fields: Record<string, string> = {};

	for (const issue of error.issues) {
		const [field] = issue.path;
		if (typeof field === "string") {
			fields[field] = issue.message;
		}
	}

	return { fields };
}

function getFieldError(errors: unknown[]) {
	const [firstError] = errors;

	if (!firstError) {
		return undefined;
	}

	if (typeof firstError === "string") {
		return firstError;
	}

	if (
		typeof firstError === "object" &&
		firstError !== null &&
		"message" in firstError &&
		typeof firstError.message === "string"
	) {
		return firstError.message;
	}

	return "Check this field.";
}

function toErrorMessage(error: unknown) {
	return error instanceof Error
		? error.message
		: "Something went wrong. Try again.";
}

function downloadText(filename: string, text: string) {
	const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

function formatTimestamp(totalSeconds: number) {
	const safeSeconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(safeSeconds / 3600);
	const minutes = Math.floor((safeSeconds % 3600) / 60);
	const seconds = safeSeconds % 60;
	const minuteText =
		hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
	const secondText = String(seconds).padStart(2, "0");

	return hours > 0
		? `${hours}:${minuteText}:${secondText}`
		: `${minuteText}:${secondText}`;
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

export { CourseManagementScreen };
