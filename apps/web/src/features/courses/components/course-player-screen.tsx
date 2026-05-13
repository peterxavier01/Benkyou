import {
	calculateProgressPercent,
	DEFAULT_CHAPTER_COMPLETION_THRESHOLD,
	DEFAULT_PROGRESS_SAVE_INTERVAL_MS,
	isChapterCompleteByWatchTime,
} from "@benkyou/core";
import type {
	BookmarkDTO,
	ChapterProgressDTO,
	CourseChapterDTO,
	CoursePlayerDataDTO,
} from "@benkyou/types";
import {
	Button,
	ContentPanel,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	HugeIcon,
	PlayerAside,
	PlayerPrimary,
	PlayerTabletStack,
	PlayerVideoFrame,
	PlayerWorkspace,
	Progress,
	StatusBadge,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@benkyou/ui";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@benkyou/ui/components/alert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkspacePage } from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import { retryGenerationJob } from "../../course-generation/course-generation.functions";
import {
	getCoursePlayerData,
	upsertChapterProgress,
	upsertCourseProgress,
} from "../course-workspace.functions";
import { NotesEditor } from "./notes-editor";
import { YouTubePlayer } from "./youtube-player";

interface CoursePlayerScreenProps {
	initialData: CoursePlayerDataDTO;
	courseId: string;
	initialChapterId?: string;
}

function CoursePlayerScreen({
	initialData,
	courseId,
	initialChapterId,
}: CoursePlayerScreenProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const getPlayerData = useServerFn(getCoursePlayerData);
	const saveCourseProgress = useServerFn(upsertCourseProgress);
	const saveChapterProgress = useServerFn(upsertChapterProgress);
	const retryJob = useServerFn(retryGenerationJob);
	const initialSelectedChapterId = useMemo(
		() => resolveInitialChapterId(initialData, initialChapterId),
		[initialData, initialChapterId],
	);
	const [selectedChapterId, setSelectedChapterId] = useState(
		initialSelectedChapterId,
	);
	const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);
	const [currentSeconds, setCurrentSeconds] = useState(
		initialData.progress?.resumeSeconds ?? 0,
	);
	const [durationSeconds, setDurationSeconds] = useState(
		initialData.video.durationSeconds ?? 0,
	);
	const [watchedByChapter, setWatchedByChapter] = useState(() =>
		toWatchedMap(initialData.chapterProgress),
	);
	const [completedByChapter, setCompletedByChapter] = useState(() =>
		toCompletedMap(initialData.chapterProgress),
	);
	const [saveError, setSaveError] = useState<string | null>(null);
	const latestProgressRef = useRef({
		currentSeconds,
		durationSeconds,
		selectedChapterId,
		watchedByChapter,
		completedByChapter,
	});

	const playerQuery = useQuery({
		queryKey: ["course-player", courseId],
		queryFn: async () => {
			const response = await getPlayerData({ data: { courseId } });
			return response.data;
		},
		initialData,
	});
	const data = playerQuery.data;
	const selectedChapter =
		data.chapters.find((chapter) => chapter.id === selectedChapterId) ??
		data.chapters[0] ??
		null;
	const selectedNote = data.notes.find(
		(note) => note.chapterId === selectedChapter?.id,
	);
	const selectedBookmarks = data.bookmarks.filter(
		(bookmark) => bookmark.chapterId === selectedChapter?.id,
	);

	const courseProgressMutation = useMutation({
		mutationFn: (input: { resumeSeconds: number; completionPercent: number }) =>
			saveCourseProgress({
				data: {
					courseId,
					resumeSeconds: input.resumeSeconds,
					completionPercent: input.completionPercent,
				},
			}),
		onSuccess: (result) => {
			queryClient.setQueryData<CoursePlayerDataDTO>(
				["course-player", courseId],
				(current) =>
					current ? { ...current, progress: result.progress } : current,
			);
			setSaveError(null);
		},
		onError: () => setSaveError("Progress could not be saved."),
	});

	const chapterProgressMutation = useMutation({
		mutationFn: (input: {
			chapterId: string;
			watchedSeconds: number;
			completed: boolean;
		}) => saveChapterProgress({ data: input }),
		onSuccess: (result) => {
			queryClient.setQueryData<CoursePlayerDataDTO>(
				["course-player", courseId],
				(current) =>
					current
						? {
								...current,
								chapterProgress: mergeChapterProgress(
									current.chapterProgress,
									result.progress,
								),
							}
						: current,
			);
			setSaveError(null);
		},
		onError: () => setSaveError("Chapter progress could not be saved."),
	});

	const retryMutation = useMutation({
		mutationFn: (generationJobId: string) =>
			retryJob({ data: { generationJobId } }),
		onSuccess: async (result) => {
			await queryClient.invalidateQueries({
				queryKey: ["course-player", courseId],
			});
			await navigate({ href: `/courses/new/${result.generationJobId}` });
		},
	});

	const persistProgress = useCallback(() => {
		const latest = latestProgressRef.current;
		const courseCompletion = calculateProgressPercent(
			latest.currentSeconds,
			latest.durationSeconds,
		);

		courseProgressMutation.mutate({
			resumeSeconds: latest.currentSeconds,
			completionPercent: courseCompletion,
		});

		if (latest.selectedChapterId) {
			chapterProgressMutation.mutate({
				chapterId: latest.selectedChapterId,
				watchedSeconds: latest.watchedByChapter[latest.selectedChapterId] ?? 0,
				completed: latest.completedByChapter[latest.selectedChapterId] ?? false,
			});
		}
	}, [chapterProgressMutation, courseProgressMutation]);

	useEffect(() => {
		latestProgressRef.current = {
			currentSeconds,
			durationSeconds,
			selectedChapterId: selectedChapter?.id ?? null,
			watchedByChapter,
			completedByChapter,
		};
	}, [
		currentSeconds,
		durationSeconds,
		selectedChapter?.id,
		watchedByChapter,
		completedByChapter,
	]);

	useEffect(() => {
		const intervalId = window.setInterval(
			persistProgress,
			DEFAULT_PROGRESS_SAVE_INTERVAL_MS,
		);

		return () => window.clearInterval(intervalId);
	}, [persistProgress]);

	useEffect(() => {
		const handleBeforeUnload = () => persistProgress();
		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [persistProgress]);

	const selectChapter = useCallback(
		(chapter: CourseChapterDTO, seek = true) => {
			setSelectedChapterId(chapter.id);
			if (seek) {
				setSeekToSeconds(chapter.startSeconds);
			}
			void navigate({
				to: "/courses/$courseId",
				params: { courseId },
				search: { chapter: chapter.id },
				replace: true,
			});
		},
		[courseId, navigate],
	);

	const handleTimeUpdate = useCallback(
		(timeSeconds: number, playerDurationSeconds: number) => {
			const duration = playerDurationSeconds || data.video.durationSeconds || 0;
			const activeChapter = findChapterAtTime(data.chapters, timeSeconds);

			setCurrentSeconds(timeSeconds);
			setDurationSeconds(duration);

			if (activeChapter && activeChapter.id !== selectedChapterId) {
				setSelectedChapterId(activeChapter.id);
				void navigate({
					to: "/courses/$courseId",
					params: { courseId },
					search: { chapter: activeChapter.id },
					replace: true,
				});
			}

			if (activeChapter) {
				const chapterDuration = getChapterDuration(
					activeChapter,
					data.chapters,
					duration,
				);
				const watchedSeconds = Math.max(
					0,
					Math.min(chapterDuration, timeSeconds - activeChapter.startSeconds),
				);
				const completed = isChapterCompleteByWatchTime(
					watchedSeconds,
					chapterDuration,
					DEFAULT_CHAPTER_COMPLETION_THRESHOLD,
				);

				setWatchedByChapter((current) => ({
					...current,
					[activeChapter.id]: Math.max(
						current[activeChapter.id] ?? 0,
						Math.floor(watchedSeconds),
					),
				}));
				if (completed) {
					setCompletedByChapter((current) => ({
						...current,
						[activeChapter.id]: true,
					}));
				}
			}
		},
		[
			courseId,
			data.chapters,
			data.video.durationSeconds,
			navigate,
			selectedChapterId,
		],
	);

	const toggleChapterComplete = (chapter: CourseChapterDTO) => {
		const nextCompleted = !completedByChapter[chapter.id];
		setCompletedByChapter((current) => ({
			...current,
			[chapter.id]: nextCompleted,
		}));
		chapterProgressMutation.mutate({
			chapterId: chapter.id,
			watchedSeconds: watchedByChapter[chapter.id] ?? 0,
			completed: nextCompleted,
		});
	};

	if (data.chapters.length === 0) {
		return (
			<NoChaptersScreen
				data={data}
				retrying={retryMutation.isPending}
				onRetry={(generationJobId) => retryMutation.mutate(generationJobId)}
			/>
		);
	}

	return (
		<WorkspacePage
			title="Course player"
			description={data.course.title}
			maxWidth="full"
			className="p-0 sm:p-0"
			action={
				<div className="flex items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<a href={`/courses/${courseId}/manage`}>
							<HugeIcon name="settings" className="size-4" />
							Manage
						</a>
					</Button>
					<Button asChild size="sm" variant="outline">
						<Link to="/courses" search={{ q: "", filter: "all" }}>
							<HugeIcon name="arrowLeft" className="size-4" />
							Library
						</Link>
					</Button>
					<BetterAuthHeader />
				</div>
			}
		>
			<PlayerWorkspace>
				<PlayerPrimary>
					<ContentPanel className="p-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<StatusBadge tone="success">Ready</StatusBadge>
									<span className="text-muted-foreground text-xs">
										{data.chapters.length} chapters
									</span>
									<span className="text-muted-foreground text-xs">
										{Math.round(
											calculateProgressPercent(currentSeconds, durationSeconds),
										)}
										% complete
									</span>
								</div>
								<h1 className="mt-2 truncate font-semibold text-xl tracking-normal">
									{data.course.title}
								</h1>
								<p className="mt-1 text-muted-foreground text-sm">
									{data.video.channelTitle ?? "YouTube"} -{" "}
									{formatTimestamp(currentSeconds)}
								</p>
							</div>
							<MobileChapterDrawer
								chapters={data.chapters}
								selectedChapterId={selectedChapter?.id ?? null}
								watchedByChapter={watchedByChapter}
								completedByChapter={completedByChapter}
								durationSeconds={durationSeconds}
								onSelect={selectChapter}
								onToggleComplete={toggleChapterComplete}
							/>
						</div>
						<div className="mt-3">
							<Progress
								value={calculateProgressPercent(
									currentSeconds,
									durationSeconds,
								)}
							/>
						</div>
					</ContentPanel>

					<PlayerVideoFrame>
						<YouTubePlayer
							providerVideoId={data.video.providerVideoId}
							initialSeconds={data.progress?.resumeSeconds ?? 0}
							seekToSeconds={seekToSeconds}
							onReady={(duration) => {
								if (duration > 0) {
									setDurationSeconds(duration);
								}
							}}
							onTimeUpdate={handleTimeUpdate}
							onPauseOrEnd={(time, duration) => {
								handleTimeUpdate(time, duration);
								persistProgress();
							}}
						/>
					</PlayerVideoFrame>

					<PlayerTabletStack>
						<ChapterPanel
							chapters={data.chapters}
							selectedChapterId={selectedChapter?.id ?? null}
							watchedByChapter={watchedByChapter}
							completedByChapter={completedByChapter}
							durationSeconds={durationSeconds}
							onSelect={selectChapter}
							onToggleComplete={toggleChapterComplete}
						/>
					</PlayerTabletStack>

					<LearningTabs
						courseId={courseId}
						chapter={selectedChapter}
						note={selectedNote}
						bookmarks={selectedBookmarks}
					/>

					{saveError ? (
						<Alert variant="destructive">
							<AlertTitle>Save failed</AlertTitle>
							<AlertDescription>{saveError}</AlertDescription>
						</Alert>
					) : null}
				</PlayerPrimary>

				<PlayerAside>
					<ChapterPanel
						chapters={data.chapters}
						selectedChapterId={selectedChapter?.id ?? null}
						watchedByChapter={watchedByChapter}
						completedByChapter={completedByChapter}
						durationSeconds={durationSeconds}
						onSelect={selectChapter}
						onToggleComplete={toggleChapterComplete}
					/>
				</PlayerAside>
			</PlayerWorkspace>
		</WorkspacePage>
	);
}

function ChapterPanel({
	chapters,
	selectedChapterId,
	watchedByChapter,
	completedByChapter,
	durationSeconds,
	onSelect,
	onToggleComplete,
}: {
	chapters: CourseChapterDTO[];
	selectedChapterId: string | null;
	watchedByChapter: Record<string, number>;
	completedByChapter: Record<string, boolean>;
	durationSeconds: number;
	onSelect: (chapter: CourseChapterDTO) => void;
	onToggleComplete: (chapter: CourseChapterDTO) => void;
}) {
	return (
		<div className="min-h-0 flex-1 overflow-hidden">
			<div className="border-b border-border p-3">
				<h2 className="font-semibold text-sm">Chapters</h2>
				<p className="text-muted-foreground text-xs">
					Jump through the generated outline.
				</p>
			</div>
			<div className="max-h-[420px] overflow-auto p-2 lg:max-h-none">
				{chapters.map((chapter) => (
					<ChapterItem
						key={chapter.id}
						chapter={chapter}
						chapters={chapters}
						active={chapter.id === selectedChapterId}
						watchedSeconds={watchedByChapter[chapter.id] ?? 0}
						completed={completedByChapter[chapter.id] ?? false}
						durationSeconds={durationSeconds}
						onSelect={onSelect}
						onToggleComplete={onToggleComplete}
					/>
				))}
			</div>
		</div>
	);
}

function ChapterItem({
	chapter,
	chapters,
	active,
	watchedSeconds,
	completed,
	durationSeconds,
	onSelect,
	onToggleComplete,
}: {
	chapter: CourseChapterDTO;
	chapters: CourseChapterDTO[];
	active: boolean;
	watchedSeconds: number;
	completed: boolean;
	durationSeconds: number;
	onSelect: (chapter: CourseChapterDTO) => void;
	onToggleComplete: (chapter: CourseChapterDTO) => void;
}) {
	const chapterDuration = getChapterDuration(
		chapter,
		chapters,
		durationSeconds,
	);
	const percent = calculateProgressPercent(watchedSeconds, chapterDuration);

	return (
		<div
			className={`mb-2 rounded-md border p-2 transition-colors ${
				active
					? "border-primary/35 bg-primary/5"
					: "border-border bg-background hover:bg-muted/45"
			}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<button
						type="button"
						className="line-clamp-2 cursor-pointer text-left font-medium text-sm transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
						onClick={() => onSelect(chapter)}
					>
						{chapter.title}
					</button>
					<p className="mt-1 text-muted-foreground text-xs">
						{formatTimestamp(chapter.startSeconds)}
						{chapter.endSeconds
							? ` - ${formatTimestamp(chapter.endSeconds)}`
							: ""}
					</p>
				</div>
				{completed ? (
					<HugeIcon
						name="checkmarkCircle"
						className="mt-0.5 size-4 shrink-0 text-primary"
					/>
				) : null}
			</div>
			<div className="mt-2">
				<Progress value={completed ? 100 : percent} />
			</div>
			<Button
				type="button"
				size="xs"
				variant="ghost"
				className="mt-2"
				onClick={() => onToggleComplete(chapter)}
			>
				{completed ? "Mark incomplete" : "Mark complete"}
			</Button>
		</div>
	);
}

function MobileChapterDrawer(props: Parameters<typeof ChapterPanel>[0]) {
	return (
		<div className="md:hidden">
			<Drawer>
				<DrawerTrigger asChild>
					<Button type="button" variant="outline" size="sm">
						<HugeIcon name="menu" className="size-4" />
						Chapters
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Chapters</DrawerTitle>
						<DrawerDescription>Select a chapter to jump.</DrawerDescription>
					</DrawerHeader>
					<ChapterPanel {...props} />
				</DrawerContent>
			</Drawer>
		</div>
	);
}

function LearningTabs({
	courseId,
	chapter,
	note,
	bookmarks,
}: {
	courseId: string;
	chapter: CourseChapterDTO | null;
	note: CoursePlayerDataDTO["notes"][number] | undefined;
	bookmarks: BookmarkDTO[];
}) {
	return (
		<ContentPanel className="min-w-0 overflow-hidden p-0">
			<Tabs defaultValue="summary" className="flex-col gap-0">
				<TabsList
					variant="line"
					className="h-10 w-full justify-start rounded-none border-border border-b px-3"
				>
					<TabsTrigger value="summary" className="h-9 px-2.5">
						Summary
					</TabsTrigger>
					<TabsTrigger value="notes" className="h-9 px-2.5">
						Notes
					</TabsTrigger>
					<TabsTrigger value="bookmarks" className="h-9 px-2.5">
						Bookmarks
					</TabsTrigger>
				</TabsList>
				<TabsContent value="summary" className="p-4">
					<p className="max-w-3xl text-muted-foreground text-sm leading-6">
						{chapter?.summary ?? "No summary is available for this chapter."}
					</p>
				</TabsContent>
				<TabsContent value="notes" className="p-4">
					<NotesEditor courseId={courseId} chapter={chapter} note={note} />
				</TabsContent>
				<TabsContent value="bookmarks" className="p-4">
					{bookmarks.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No bookmarks for this chapter yet.
						</p>
					) : (
						<ul className="space-y-2">
							{bookmarks.map((bookmark) => (
								<li
									key={bookmark.id}
									className="rounded-md border border-border p-2 text-sm"
								>
									<p className="font-medium">
										{bookmark.title ??
											`Bookmark at ${formatTimestamp(bookmark.timestampSeconds)}`}
									</p>
									<p className="text-muted-foreground text-xs">
										{formatTimestamp(bookmark.timestampSeconds)}
									</p>
									{bookmark.note ? (
										<p className="mt-1 text-muted-foreground">
											{bookmark.note}
										</p>
									) : null}
								</li>
							))}
						</ul>
					)}
				</TabsContent>
			</Tabs>
		</ContentPanel>
	);
}

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
	const canOpenJob = Boolean(latestJob);
	const canRetry =
		Boolean(latestJob?.retryable) &&
		(latestJob?.status === "failed" || latestJob?.status === "cancelled");

	return (
		<WorkspacePage
			title="Course player"
			description="This course is missing generated chapters."
			maxWidth="narrow"
			action={<BetterAuthHeader />}
		>
			<ContentPanel className="p-6">
				<StatusBadge tone="warning">No chapters</StatusBadge>
				<h1 className="mt-3 font-semibold text-2xl tracking-normal">
					{data.course.title}
				</h1>
				<p className="mt-2 text-muted-foreground text-sm leading-6">
					This course does not have generated chapters yet. Recover the latest
					generation job, retry it, or return to your library.
				</p>
				<div className="mt-4 flex flex-wrap gap-2">
					{canOpenJob ? (
						<Button asChild>
							<Link
								to="/courses/new/$jobId"
								params={{ jobId: latestJob?.id ?? "" }}
							>
								Open generation job
							</Link>
						</Button>
					) : null}
					{canRetry ? (
						<Button
							type="button"
							variant="outline"
							disabled={retrying}
							onClick={() => onRetry(latestJob?.id ?? "")}
						>
							<HugeIcon name="refresh" className="size-4" />
							{retrying ? "Retrying..." : "Retry generation"}
						</Button>
					) : null}
					<Button asChild>
						<Link to="/courses" search={{ q: "", filter: "all" }}>
							Back to library
						</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/">Use another URL</Link>
					</Button>
				</div>
			</ContentPanel>
		</WorkspacePage>
	);
}

function resolveInitialChapterId(
	data: CoursePlayerDataDTO,
	chapterId: string | undefined,
) {
	if (chapterId && data.chapters.some((chapter) => chapter.id === chapterId)) {
		return chapterId;
	}

	const resumeSeconds = data.progress?.resumeSeconds ?? 0;
	const resumeChapter = findChapterAtTime(data.chapters, resumeSeconds);

	return resumeChapter?.id ?? data.chapters[0]?.id ?? null;
}

function findChapterAtTime(chapters: CourseChapterDTO[], seconds: number) {
	return (
		chapters.find((chapter, index) => {
			const nextChapter = chapters[index + 1];
			const endSeconds =
				chapter.endSeconds ?? nextChapter?.startSeconds ?? Infinity;
			return seconds >= chapter.startSeconds && seconds < endSeconds;
		}) ??
		chapters[0] ??
		null
	);
}

function getChapterDuration(
	chapter: CourseChapterDTO,
	chapters: CourseChapterDTO[],
	durationSeconds: number,
) {
	const index = chapters.findIndex((candidate) => candidate.id === chapter.id);
	const nextChapter = chapters[index + 1];
	const endSeconds =
		chapter.endSeconds ?? nextChapter?.startSeconds ?? durationSeconds;

	return Math.max(1, endSeconds - chapter.startSeconds);
}

function toWatchedMap(progress: ChapterProgressDTO[]) {
	return Object.fromEntries(
		progress.map((item) => [item.chapterId, item.watchedSeconds]),
	) as Record<string, number>;
}

function toCompletedMap(progress: ChapterProgressDTO[]) {
	return Object.fromEntries(
		progress.map((item) => [item.chapterId, item.completed]),
	) as Record<string, boolean>;
}

function mergeChapterProgress(
	current: ChapterProgressDTO[],
	next: ChapterProgressDTO,
) {
	const existingIndex = current.findIndex(
		(item) => item.chapterId === next.chapterId,
	);

	if (existingIndex === -1) {
		return [...current, next];
	}

	return current.map((item, index) => (index === existingIndex ? next : item));
}

function formatTimestamp(totalSeconds: number) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
			.toString()
			.padStart(2, "0")}`;
	}

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export { CoursePlayerScreen };
