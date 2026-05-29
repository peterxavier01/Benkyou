import {
	calculateProgressPercent,
	DEFAULT_CHAPTER_COMPLETION_THRESHOLD,
	DEFAULT_PROGRESS_SAVE_INTERVAL_MS,
	formatCompactDuration,
	formatTimestamp,
	getChapterDurationSeconds,
	getChapterEndSeconds,
	getDefaultLearningPreferences,
	isChapterCompleteByWatchTime,
} from "@benkyou/core";
import type {
	BookmarkDTO,
	ChapterProgressDTO,
	CourseChapterDTO,
	CoursePlayerDataDTO,
	GetLearningPreferencesResponseV1,
	LearningPreferencesDTO,
	UpsertPlaybackProgressRequestV1,
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
	Slider,
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
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { workspaceQueryKeys } from "#/features/workspace/workspace.queries";
import {
	useWorkspaceNavigationFlush,
	WorkspacePage,
} from "#components/workspace-layout";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import { retryGenerationJob } from "../../course-generation/course-generation.functions";
import {
	createBookmark,
	deleteBookmark,
	getCoursePlayerData,
	getLearningPreferences,
	updateBookmark,
	updateLearningPreferences,
	upsertChapterProgress,
	upsertPlaybackProgress,
} from "../course-workspace.functions";
import {
	readLocalPreferences,
	writeLocalPreferences,
} from "../learning-preferences.local";
import { BookmarkDialog, type BookmarkDialogValues } from "./bookmark-dialog";
import { NotesEditor } from "./notes-editor";
import {
	PlayerFullscreenButton,
	usePlayerFullscreen,
} from "./player-fullscreen";
import { PlayerPlaybackSpeedMenu } from "./player-playback-speed-menu";
import { PlayerVolumeControl } from "./player-volume-control";
import { YouTubePlayer, type YouTubePlayerHandle } from "./youtube-player";

interface CoursePlayerScreenProps {
	initialData: CoursePlayerDataDTO;
	courseId: string;
	initialBookmarkId?: string;
	initialChapterId?: string;
}

function CoursePlayerScreen({
	initialData,
	courseId,
	initialBookmarkId,
	initialChapterId,
}: CoursePlayerScreenProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { registerNavigationFlush } = useWorkspaceNavigationFlush();
	const getPlayerData = useServerFn(getCoursePlayerData);
	const getPreferences = useServerFn(getLearningPreferences);
	const updatePreferences = useServerFn(updateLearningPreferences);
	const savePlaybackProgress = useServerFn(upsertPlaybackProgress);
	const saveChapterProgress = useServerFn(upsertChapterProgress);
	const createBookmarkFn = useServerFn(createBookmark);
	const updateBookmarkFn = useServerFn(updateBookmark);
	const deleteBookmarkFn = useServerFn(deleteBookmark);
	const retryJob = useServerFn(retryGenerationJob);
	const playerQueryKey = useMemo(
		() => ["course-player", courseId] as const,
		[courseId],
	);
	const startData = useMemo(
		() =>
			chooseNewestPlayerData(
				initialData,
				queryClient.getQueryData<CoursePlayerDataDTO>(playerQueryKey),
			),
		[initialData, playerQueryKey, queryClient],
	);
	const initialBookmark = useMemo(
		() =>
			initialBookmarkId
				? (startData.bookmarks.find(
						(bookmark) => bookmark.id === initialBookmarkId,
					) ?? null)
				: null,
		[initialBookmarkId, startData.bookmarks],
	);
	const initialCurrentSeconds = useMemo(
		() => resolveInitialSeconds(startData, initialChapterId, initialBookmark),
		[startData, initialBookmark, initialChapterId],
	);
	const initialSelectedChapterId = useMemo(
		() => resolveInitialChapterId(startData, initialCurrentSeconds),
		[startData, initialCurrentSeconds],
	);
	const [selectedChapterId, setSelectedChapterId] = useState(
		initialSelectedChapterId,
	);
	const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);
	const [currentSeconds, setCurrentSeconds] = useState(initialCurrentSeconds);
	const [durationSeconds, setDurationSeconds] = useState(
		startData.video.durationSeconds ?? 0,
	);
	const [watchedByChapter, setWatchedByChapter] = useState(() =>
		toWatchedMap(startData.chapterProgress),
	);
	const [completedByChapter, setCompletedByChapter] = useState(() =>
		toCompletedMap(startData.chapterProgress),
	);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
	const [editingBookmark, setEditingBookmark] = useState<BookmarkDTO | null>(
		null,
	);
	const [playerControls, setPlayerControls] = useState({
		muted: false,
		playing: false,
		volume: 100,
	});
	const playerPlaying = playerControls.playing;
	const playerVolume = playerControls.volume;
	const playerMuted = playerControls.muted;
	const latestProgressRef = useRef({
		currentSeconds,
		durationSeconds,
		selectedChapterId,
		watchedByChapter,
		completedByChapter,
	});
	const dirtyChapterIdsRef = useRef(new Set<string>());
	const lastAudibleVolumeRef = useRef(100);
	const youtubePlayerRef = useRef<YouTubePlayerHandle | null>(null);
	const {
		fullscreenError,
		isFullscreen,
		isSupported: isFullscreenSupported,
		playerSurfaceRef,
		toggleFullscreen,
	} = usePlayerFullscreen();
	const pendingSeekRef = useRef<{
		chapterId: string;
		targetSeconds: number;
		direction: "backward" | "exact" | "forward";
	} | null>(null);

	const playerQuery = useQuery({
		queryKey: playerQueryKey,
		queryFn: async () => {
			const response = await getPlayerData({ data: { courseId } });
			return response.data;
		},
		initialData: startData,
	});
	const preferencesQuery = useQuery({
		queryKey: workspaceQueryKeys.learningPreferences,
		queryFn: async () => {
			const response = await getPreferences();
			const localPreferences = readLocalPreferences();

			return localPreferences ? { preferences: localPreferences } : response;
		},
	});
	const fallbackLearningPreferences = useMemo(
		() => getDefaultLearningPreferences(),
		[],
	);
	const data = playerQuery.data;
	const learningPreferences =
		preferencesQuery.data?.preferences ?? fallbackLearningPreferences;
	const selectedChapter =
		data.chapters.find((chapter) => chapter.id === selectedChapterId) ??
		data.chapters[0] ??
		null;
	const selectedChapterEndSeconds = selectedChapter
		? getChapterEndSeconds(
				selectedChapter,
				data.chapters,
				durationSeconds || data.video.durationSeconds,
			)
		: null;
	const selectedChapterCurrentSeconds = selectedChapter
		? Math.min(
				selectedChapterEndSeconds ?? currentSeconds,
				Math.max(selectedChapter.startSeconds, currentSeconds),
			)
		: currentSeconds;
	const courseProgressPercent = calculateProgressPercent(
		currentSeconds,
		durationSeconds || data.video.durationSeconds || 0,
	);
	const selectedNote = data.notes.find(
		(note) => note.chapterId === selectedChapter?.id,
	);
	const selectedBookmarks = data.bookmarks.filter(
		(bookmark) => bookmark.chapterId === selectedChapter?.id,
	);

	function clearSavedDirtyChapters(
		chapters: UpsertPlaybackProgressRequestV1["chapters"],
	) {
		const latest = latestProgressRef.current;

		for (const chapter of chapters) {
			if (
				(latest.watchedByChapter[chapter.chapterId] ?? 0) ===
					chapter.watchedSeconds &&
				(latest.completedByChapter[chapter.chapterId] ?? false) ===
					chapter.completed
			) {
				dirtyChapterIdsRef.current.delete(chapter.chapterId);
			}
		}
	}

	const applyProgressPayloadToCache = useCallback(
		(payload: UpsertPlaybackProgressRequestV1) => {
			queryClient.setQueryData<CoursePlayerDataDTO>(
				playerQueryKey,
				(current) => {
					if (!current) {
						return current;
					}

					return {
						...current,
						progress: {
							id: current.progress?.id ?? "optimistic-progress",
							userId: current.progress?.userId ?? current.course.ownerId,
							courseId,
							resumeSeconds: payload.resumeSeconds,
							completionPercent: Math.max(
								current.progress?.completionPercent ?? 0,
								payload.completionPercent,
							),
							updatedAt: payload.occurredAt,
						},
						chapterProgress: mergeChapterProgressPayload(
							current.chapterProgress,
							payload.chapters,
							payload.occurredAt,
						),
					};
				},
			);
		},
		[courseId, playerQueryKey, queryClient],
	);

	const playbackProgressMutation = useMutation({
		mutationFn: (input: UpsertPlaybackProgressRequestV1) =>
			savePlaybackProgress({ data: input }),
		onSuccess: async (result, input) => {
			queryClient.setQueryData<CoursePlayerDataDTO>(
				playerQueryKey,
				(current) =>
					current
						? {
								...current,
								progress: mergeCourseProgress(
									current.progress,
									result.progress,
								),
								chapterProgress: mergeChapterProgressList(
									current.chapterProgress,
									result.chapterProgress,
								),
							}
						: current,
			);
			clearSavedDirtyChapters(input.chapters);
			await queryClient.invalidateQueries({ queryKey: ["course-library"] });
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
				playerQueryKey,
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

	const preferencesMutation = useMutation({
		mutationFn: (preferences: LearningPreferencesDTO) =>
			updatePreferences({ data: preferences }),
		onMutate: async (preferences) => {
			await queryClient.cancelQueries({
				queryKey: workspaceQueryKeys.learningPreferences,
			});
			const previousPreferences =
				queryClient.getQueryData<GetLearningPreferencesResponseV1>(
					workspaceQueryKeys.learningPreferences,
				);

			queryClient.setQueryData<GetLearningPreferencesResponseV1>(
				workspaceQueryKeys.learningPreferences,
				{ preferences },
			);

			return { previousPreferences };
		},
		onSuccess: async (result) => {
			writeLocalPreferences(result.preferences);
			queryClient.setQueryData<GetLearningPreferencesResponseV1>(
				workspaceQueryKeys.learningPreferences,
				result,
			);
			await queryClient.invalidateQueries({
				queryKey: workspaceQueryKeys.learningPreferences,
			});
			setSaveError(null);
		},
		onError: (_error, _preferences, context) => {
			if (context?.previousPreferences) {
				queryClient.setQueryData<GetLearningPreferencesResponseV1>(
					workspaceQueryKeys.learningPreferences,
					context.previousPreferences,
				);
			}
			setSaveError("Playback speed could not be saved.");
		},
	});

	const createBookmarkMutation = useMutation({
		mutationFn: (input: BookmarkDialogValues) =>
			createBookmarkFn({
				data: {
					courseId,
					timestampSeconds: currentSeconds,
					title: input.title,
					note: input.note,
				},
			}),
		onSuccess: async (result) => {
			queryClient.setQueryData<CoursePlayerDataDTO>(
				playerQueryKey,
				(current) =>
					current
						? {
								...current,
								bookmarks: mergeBookmark(current.bookmarks, result.bookmark),
							}
						: current,
			);
			await queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			setBookmarkDialogOpen(false);
			setEditingBookmark(null);
			setSaveError(null);
		},
		onError: () => setSaveError("Bookmark could not be saved."),
	});

	const updateBookmarkMutation = useMutation({
		mutationFn: (input: BookmarkDialogValues & { bookmarkId: string }) =>
			updateBookmarkFn({
				data: {
					bookmarkId: input.bookmarkId,
					title: input.title,
					note: input.note,
				},
			}),
		onSuccess: async (result) => {
			queryClient.setQueryData<CoursePlayerDataDTO>(
				playerQueryKey,
				(current) =>
					current
						? {
								...current,
								bookmarks: mergeBookmark(current.bookmarks, result.bookmark),
							}
						: current,
			);
			await queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			setBookmarkDialogOpen(false);
			setEditingBookmark(null);
			setSaveError(null);
		},
		onError: () => setSaveError("Bookmark could not be updated."),
	});

	const deleteBookmarkMutation = useMutation({
		mutationFn: (bookmarkId: string) =>
			deleteBookmarkFn({ data: { bookmarkId } }),
		onSuccess: async (result, bookmarkId) => {
			if (!result.deleted) {
				setSaveError("Bookmark could not be deleted.");
				return;
			}

			queryClient.setQueryData<CoursePlayerDataDTO>(
				playerQueryKey,
				(current) =>
					current
						? {
								...current,
								bookmarks: current.bookmarks.filter(
									(bookmark) => bookmark.id !== bookmarkId,
								),
							}
						: current,
			);
			await queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			setSaveError(null);
		},
		onError: () => setSaveError("Bookmark could not be deleted."),
	});

	const retryMutation = useMutation({
		mutationFn: (generationJobId: string) =>
			retryJob({ data: { generationJobId } }),
		onSuccess: async (result) => {
			await queryClient.invalidateQueries({
				queryKey: playerQueryKey,
			});
			await navigate({ href: `/courses/new/${result.generationJobId}` });
		},
	});

	const mutatePlaybackProgressRef = useRef(playbackProgressMutation.mutate);

	useEffect(() => {
		mutatePlaybackProgressRef.current = playbackProgressMutation.mutate;
	});

	const applyPlaybackSnapshot = useCallback(
		(timeSeconds: number, playerDurationSeconds: number) => {
			const duration = playerDurationSeconds || data.video.durationSeconds || 0;
			const latest = latestProgressRef.current;
			const activeChapter = findChapterAtTime(
				data.chapters,
				timeSeconds,
				duration,
				latest.selectedChapterId,
			);
			let nextWatchedByChapter = latest.watchedByChapter;
			let nextCompletedByChapter = latest.completedByChapter;

			setCurrentSeconds(timeSeconds);
			setDurationSeconds(duration);

			if (activeChapter) {
				if (activeChapter.id !== latest.selectedChapterId) {
					setSelectedChapterId(activeChapter.id);
				}

				const chapterDuration = getChapterDurationSeconds(
					activeChapter,
					data.chapters,
					duration,
				);
				const watchedSeconds = Math.max(
					0,
					Math.min(chapterDuration, timeSeconds - activeChapter.startSeconds),
				);
				const watchedSecondsFloor = Math.floor(watchedSeconds);
				const nextWatchedSeconds = Math.max(
					latest.watchedByChapter[activeChapter.id] ?? 0,
					watchedSecondsFloor,
				);
				const completed =
					!learningPreferences.manualCompletionOnly &&
					isChapterCompleteByWatchTime(
						watchedSeconds,
						chapterDuration,
						DEFAULT_CHAPTER_COMPLETION_THRESHOLD,
					);

				nextWatchedByChapter = {
					...latest.watchedByChapter,
					[activeChapter.id]: nextWatchedSeconds,
				};
				setWatchedByChapter((current) => ({
					...current,
					[activeChapter.id]: Math.max(
						current[activeChapter.id] ?? 0,
						watchedSecondsFloor,
					),
				}));

				if (completed) {
					nextCompletedByChapter = {
						...latest.completedByChapter,
						[activeChapter.id]: true,
					};
					setCompletedByChapter((current) => ({
						...current,
						[activeChapter.id]: true,
					}));
				}

				dirtyChapterIdsRef.current.add(activeChapter.id);
			}

			latestProgressRef.current = {
				currentSeconds: timeSeconds,
				durationSeconds: duration,
				selectedChapterId:
					activeChapter?.id ?? latestProgressRef.current.selectedChapterId,
				watchedByChapter: nextWatchedByChapter,
				completedByChapter: nextCompletedByChapter,
			};

			return activeChapter;
		},
		[
			data.chapters,
			data.video.durationSeconds,
			learningPreferences.manualCompletionOnly,
		],
	);

	const refreshLatestProgressFromPlayer = useCallback(() => {
		const snapshot = youtubePlayerRef.current?.getPlaybackSnapshot();

		if (!snapshot) {
			return;
		}

		const pendingSeek = pendingSeekRef.current;
		if (pendingSeek) {
			const reachedPendingTarget = hasReachedPendingSeek(
				snapshot.timeSeconds,
				pendingSeek,
			);
			if (!reachedPendingTarget) {
				return;
			}

			pendingSeekRef.current = null;
		}

		applyPlaybackSnapshot(snapshot.timeSeconds, snapshot.durationSeconds);
	}, [applyPlaybackSnapshot]);

	const completeChapterAtBoundary = useCallback(
		(
			chapter: CourseChapterDTO,
			timeSeconds: number,
			playerDurationSeconds: number,
		) => {
			const chapterDuration = getChapterDurationSeconds(
				chapter,
				data.chapters,
				playerDurationSeconds || data.video.durationSeconds,
			);
			const completed = !learningPreferences.manualCompletionOnly;
			const nextWatchedByChapter = {
				...latestProgressRef.current.watchedByChapter,
				[chapter.id]: chapterDuration,
			};
			const nextCompletedByChapter = {
				...latestProgressRef.current.completedByChapter,
				...(completed ? { [chapter.id]: true } : {}),
			};

			setWatchedByChapter((current) => ({
				...current,
				[chapter.id]: Math.max(current[chapter.id] ?? 0, chapterDuration),
			}));
			if (completed) {
				setCompletedByChapter((current) => ({
					...current,
					[chapter.id]: true,
				}));
			}
			dirtyChapterIdsRef.current.add(chapter.id);
			latestProgressRef.current = {
				...latestProgressRef.current,
				currentSeconds: timeSeconds,
				durationSeconds:
					playerDurationSeconds || data.video.durationSeconds || 0,
				watchedByChapter: nextWatchedByChapter,
				completedByChapter: nextCompletedByChapter,
			};
		},
		[
			data.chapters,
			data.video.durationSeconds,
			learningPreferences.manualCompletionOnly,
		],
	);

	const createProgressPayload = useCallback(
		(
			options: { refreshFromPlayer?: boolean } = {},
		): UpsertPlaybackProgressRequestV1 => {
			const { refreshFromPlayer = true } = options;
			if (refreshFromPlayer) {
				refreshLatestProgressFromPlayer();
			}
			const latest = latestProgressRef.current;
			const courseCompletion = calculateProgressPercent(
				latest.currentSeconds,
				latest.durationSeconds,
			);

			return {
				courseId,
				resumeSeconds: Math.floor(latest.currentSeconds),
				completionPercent: courseCompletion,
				occurredAt: new Date().toISOString(),
				chapters: Array.from(dirtyChapterIdsRef.current).map((chapterId) => ({
					chapterId,
					watchedSeconds: latest.watchedByChapter[chapterId] ?? 0,
					completed: latest.completedByChapter[chapterId] ?? false,
				})),
			};
		},
		[courseId, refreshLatestProgressFromPlayer],
	);

	const persistProgress = useCallback(
		(options?: { refreshFromPlayer?: boolean }) => {
			const payload = createProgressPayload(options);
			applyProgressPayloadToCache(payload);
			mutatePlaybackProgressRef.current(payload);
		},
		[applyProgressPayloadToCache, createProgressPayload],
	);

	const persistProgressOnUnload = useCallback(() => {
		const payload = createProgressPayload();
		applyProgressPayloadToCache(payload);
		sendProgressBeacon(payload);
	}, [applyProgressPayloadToCache, createProgressPayload]);

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

	useEffect(
		() => registerNavigationFlush(persistProgressOnUnload),
		[registerNavigationFlush, persistProgressOnUnload],
	);

	useEffect(() => {
		const handleBeforeUnload = () => persistProgressOnUnload();
		const handlePageHide = () => persistProgressOnUnload();
		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				persistProgressOnUnload();
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("pagehide", handlePageHide);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			persistProgressOnUnload();
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("pagehide", handlePageHide);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [persistProgressOnUnload]);

	const selectChapter = useCallback(
		(
			chapter: CourseChapterDTO,
			options: { seek?: boolean; persistBeforeSelect?: boolean } = {},
		) => {
			const { seek = true, persistBeforeSelect = true } = options;
			if (persistBeforeSelect) {
				persistProgress();
			}
			const nextSeconds = chapter.startSeconds;
			const seekDirection = getSeekDirection(
				data.chapters,
				latestProgressRef.current.selectedChapterId,
				chapter.id,
				latestProgressRef.current.currentSeconds,
				nextSeconds,
			);
			setSelectedChapterId(chapter.id);
			setCurrentSeconds(nextSeconds);
			latestProgressRef.current = {
				...latestProgressRef.current,
				selectedChapterId: chapter.id,
				currentSeconds: nextSeconds,
			};
			if (seek) {
				pendingSeekRef.current = {
					chapterId: chapter.id,
					targetSeconds: nextSeconds,
					direction: seekDirection,
				};
				setSeekToSeconds(nextSeconds);
				youtubePlayerRef.current?.seekTo(nextSeconds);
			}
			void navigate({
				to: "/courses/$courseId",
				params: { courseId },
				search: { chapter: chapter.id, bookmark: undefined },
				replace: true,
			});
		},
		[courseId, data.chapters, navigate, persistProgress],
	);

	const jumpToBookmark = useCallback(
		(bookmark: BookmarkDTO) => {
			const chapter =
				data.chapters.find(
					(candidate) => candidate.id === bookmark.chapterId,
				) ?? findChapterAtTime(data.chapters, bookmark.timestampSeconds);

			if (chapter) {
				setSelectedChapterId(chapter.id);
				latestProgressRef.current = {
					...latestProgressRef.current,
					selectedChapterId: chapter.id,
					currentSeconds: bookmark.timestampSeconds,
				};
				pendingSeekRef.current = {
					chapterId: chapter.id,
					targetSeconds: bookmark.timestampSeconds,
					direction: getSeekDirection(
						data.chapters,
						latestProgressRef.current.selectedChapterId,
						chapter.id,
						latestProgressRef.current.currentSeconds,
						bookmark.timestampSeconds,
					),
				};
				void navigate({
					to: "/courses/$courseId",
					params: { courseId },
					search: {
						chapter: chapter.id,
						bookmark: bookmark.id,
					},
					replace: true,
				});
			}

			setCurrentSeconds(bookmark.timestampSeconds);
			setSeekToSeconds(bookmark.timestampSeconds);
		},
		[courseId, data.chapters, navigate],
	);

	const handleTimeUpdate = useCallback(
		(timeSeconds: number, playerDurationSeconds: number) => {
			const pendingSeek = pendingSeekRef.current;
			if (pendingSeek) {
				const reachedPendingTarget = hasReachedPendingSeek(
					timeSeconds,
					pendingSeek,
				);
				if (!reachedPendingTarget) {
					return;
				}

				pendingSeekRef.current = null;
			}

			const latest = latestProgressRef.current;
			const previousChapter = latest.selectedChapterId
				? data.chapters.find(
						(chapter) => chapter.id === latest.selectedChapterId,
					)
				: null;
			const previousChapterEndSeconds = previousChapter
				? getChapterEndSeconds(
						previousChapter,
						data.chapters,
						playerDurationSeconds || data.video.durationSeconds,
					)
				: null;
			if (
				playerPlaying &&
				previousChapter &&
				previousChapterEndSeconds !== null &&
				timeSeconds >= previousChapterEndSeconds
			) {
				completeChapterAtBoundary(
					previousChapter,
					previousChapterEndSeconds,
					playerDurationSeconds,
				);

				if (!learningPreferences.autoplayNextChapter) {
					youtubePlayerRef.current?.pause();
					youtubePlayerRef.current?.seekTo(previousChapterEndSeconds);
					setCurrentSeconds(previousChapterEndSeconds);
					setPlayerControls((current) => ({ ...current, playing: false }));
					persistProgress({ refreshFromPlayer: false });
					return;
				}
			}

			const activeChapter = applyPlaybackSnapshot(
				timeSeconds,
				playerDurationSeconds,
			);

			if (activeChapter && activeChapter.id !== selectedChapterId) {
				setSelectedChapterId(activeChapter.id);
			}
		},
		[
			applyPlaybackSnapshot,
			completeChapterAtBoundary,
			data.chapters,
			data.video.durationSeconds,
			learningPreferences.autoplayNextChapter,
			persistProgress,
			playerPlaying,
			selectedChapterId,
		],
	);

	const togglePlayback = useCallback(() => {
		if (playerPlaying) {
			youtubePlayerRef.current?.pause();
			setPlayerControls((current) => ({ ...current, playing: false }));
			return;
		}

		youtubePlayerRef.current?.play();
		setPlayerControls((current) => ({ ...current, playing: true }));
	}, [playerPlaying]);

	const changePlayerMuted = (muted: boolean) => {
		const nextVolume =
			!muted && playerVolume === 0
				? lastAudibleVolumeRef.current
				: playerVolume;

		setPlayerControls((current) => ({
			...current,
			muted,
			volume: nextVolume,
		}));

		if (!muted && playerVolume === 0) {
			youtubePlayerRef.current?.setVolume(nextVolume);
		}

		if (muted) {
			youtubePlayerRef.current?.mute();
			return;
		}

		youtubePlayerRef.current?.unMute();
	};

	const changePlayerVolume = (volume: number) => {
		const nextVolume = Math.max(0, Math.min(100, Math.round(volume)));
		const muted = nextVolume === 0;

		setPlayerControls((current) => ({
			...current,
			muted,
			volume: nextVolume,
		}));
		youtubePlayerRef.current?.setVolume(nextVolume);
		if (nextVolume > 0) {
			lastAudibleVolumeRef.current = nextVolume;
			youtubePlayerRef.current?.unMute();
			return;
		}

		youtubePlayerRef.current?.mute();
	};

	const changePlaybackSpeed = (playbackSpeed: number) => {
		if (playbackSpeed === learningPreferences.playbackSpeed) {
			return;
		}

		preferencesMutation.mutate({
			...learningPreferences,
			playbackSpeed,
		});
	};

	const previewSelectedChapterSeek = useCallback(
		(values: number[]) => {
			if (!selectedChapter) {
				return;
			}

			const absoluteSeconds = Math.floor(
				values[0] ?? selectedChapter.startSeconds,
			);
			setCurrentSeconds(absoluteSeconds);
		},
		[selectedChapter],
	);

	const seekWithinSelectedChapter = useCallback(
		(values: number[]) => {
			if (!selectedChapter) {
				return;
			}

			const absoluteSeconds = Math.floor(
				values[0] ?? selectedChapter.startSeconds,
			);
			pendingSeekRef.current = {
				chapterId: selectedChapter.id,
				targetSeconds: absoluteSeconds,
				direction: getSeekDirection(
					data.chapters,
					latestProgressRef.current.selectedChapterId,
					selectedChapter.id,
					latestProgressRef.current.currentSeconds,
					absoluteSeconds,
				),
			};
			setCurrentSeconds(absoluteSeconds);
			latestProgressRef.current = {
				...latestProgressRef.current,
				currentSeconds: absoluteSeconds,
				selectedChapterId: selectedChapter.id,
			};
			setSeekToSeconds(absoluteSeconds);
			youtubePlayerRef.current?.seekTo(absoluteSeconds);
		},
		[data.chapters, selectedChapter],
	);

	const seekSelectedChapterFromPointer = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (selectedChapterEndSeconds === null) {
				return;
			}

			const rect = event.currentTarget.getBoundingClientRect();
			const ratio =
				rect.width > 0
					? Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
					: 0;
			const absoluteSeconds =
				(selectedChapter?.startSeconds ?? 0) +
				ratio *
					(selectedChapterEndSeconds - (selectedChapter?.startSeconds ?? 0));
			seekWithinSelectedChapter([absoluteSeconds]);
		},
		[
			seekWithinSelectedChapter,
			selectedChapter?.startSeconds,
			selectedChapterEndSeconds,
		],
	);

	const toggleChapterComplete = (chapter: CourseChapterDTO) => {
		const nextCompleted = !completedByChapter[chapter.id];
		setCompletedByChapter((current) => ({
			...current,
			[chapter.id]: nextCompleted,
		}));
		latestProgressRef.current = {
			...latestProgressRef.current,
			completedByChapter: {
				...latestProgressRef.current.completedByChapter,
				[chapter.id]: nextCompleted,
			},
		};
		dirtyChapterIdsRef.current.delete(chapter.id);
		chapterProgressMutation.mutate({
			chapterId: chapter.id,
			watchedSeconds: watchedByChapter[chapter.id] ?? 0,
			completed: nextCompleted,
		});
	};

	const openCreateBookmarkDialog = () => {
		setEditingBookmark(null);
		setBookmarkDialogOpen(true);
	};

	const openEditBookmarkDialog = (bookmark: BookmarkDTO) => {
		setEditingBookmark(bookmark);
		setBookmarkDialogOpen(true);
	};

	const submitBookmarkDialog = async (values: BookmarkDialogValues) => {
		if (editingBookmark) {
			await updateBookmarkMutation.mutateAsync({
				bookmarkId: editingBookmark.id,
				...values,
			});
			return;
		}

		await createBookmarkMutation.mutateAsync(values);
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
						<Link
							to="/courses/$courseId/manage"
							params={{ courseId }}
							onClick={persistProgressOnUnload}
						>
							<HugeIcon name="settings" className="size-4" />
							Manage
						</Link>
					</Button>
					<Button asChild size="sm" variant="outline">
						<Link
							to="/courses"
							search={{ q: "", filter: "all" }}
							onClick={persistProgressOnUnload}
						>
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
										{selectedChapterEndSeconds === null
											? "Chapter duration unknown"
											: `${formatTimestamp(
													selectedChapterCurrentSeconds,
												)} / ${formatTimestamp(selectedChapterEndSeconds)}`}
									</span>
								</div>
								<h1 className="mt-2 truncate font-semibold text-xl tracking-normal">
									{data.course.title}
								</h1>
								<p className="mt-1 text-muted-foreground text-sm">
									{data.video.channelTitle ?? "YouTube"} -{" "}
									{formatTimestamp(currentSeconds)}
									{selectedChapter ? ` in ${selectedChapter.title}` : ""}
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
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<Button
								type="button"
								size="sm"
								onClick={openCreateBookmarkDialog}
							>
								<HugeIcon name="bookmark" className="size-4" />
								Add bookmark
							</Button>
							<span className="text-muted-foreground text-xs">
								{formatTimestamp(currentSeconds)}
								{selectedChapter ? ` in ${selectedChapter.title}` : ""}
							</span>
						</div>
						<div className="mt-3">
							<Progress value={courseProgressPercent} />
						</div>
					</ContentPanel>

					<div
						ref={playerSurfaceRef}
						className="flex flex-col gap-3"
						data-course-player-surface
					>
						<PlayerVideoFrame className="lg:shadow-sm">
							<YouTubePlayer
								ref={youtubePlayerRef}
								providerVideoId={data.video.providerVideoId}
								initialSeconds={currentSeconds}
								muted={playerMuted}
								playbackRate={learningPreferences.playbackSpeed}
								seekToSeconds={seekToSeconds}
								volume={playerVolume}
								onReady={(duration) => {
									if (duration > 0) {
										setDurationSeconds(duration);
									}
								}}
								onTimeUpdate={handleTimeUpdate}
								onPlayingChange={(playing) =>
									setPlayerControls((current) => ({ ...current, playing }))
								}
								onPauseOrEnd={(time, duration) => {
									handleTimeUpdate(time, duration);
									persistProgress();
								}}
							/>
						</PlayerVideoFrame>
						<ContentPanel className="p-3" data-player-controls>
							<div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
								<div className="flex items-center gap-2">
									<Button
										type="button"
										size="icon-sm"
										variant="outline"
										onClick={togglePlayback}
									>
										<HugeIcon
											name={playerPlaying ? "pause" : "play"}
											className="size-4"
										/>
										<span className="sr-only">
											{playerPlaying ? "Pause chapter" : "Play chapter"}
										</span>
									</Button>
									<PlayerVolumeControl
										muted={playerMuted}
										volume={playerVolume}
										onMutedChange={changePlayerMuted}
										onVolumeChange={changePlayerVolume}
									/>
									<PlayerFullscreenButton
										isFullscreen={isFullscreen}
										isSupported={isFullscreenSupported}
										onToggle={() => {
											void toggleFullscreen();
										}}
									/>
									<PlayerPlaybackSpeedMenu
										pending={preferencesMutation.isPending}
										playbackSpeed={learningPreferences.playbackSpeed}
										onPlaybackSpeedChange={changePlaybackSpeed}
									/>
								</div>
								<Slider
									aria-label="Chapter playback position"
									className="h-6 cursor-pointer **:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-track]:h-2"
									min={selectedChapter?.startSeconds ?? 0}
									max={selectedChapterEndSeconds ?? currentSeconds}
									step={1}
									value={[selectedChapterCurrentSeconds]}
									disabled={selectedChapterEndSeconds === null}
									onPointerDownCapture={seekSelectedChapterFromPointer}
									onValueChange={previewSelectedChapterSeek}
									onValueCommit={seekWithinSelectedChapter}
								/>
								<span className="text-muted-foreground text-xs tabular-nums">
									{selectedChapterEndSeconds === null
										? "Duration unknown"
										: `${formatTimestamp(
												selectedChapterCurrentSeconds,
											)} / ${formatTimestamp(selectedChapterEndSeconds)}`}
								</span>
							</div>
							{fullscreenError ? (
								<output className="mt-2 block text-muted-foreground text-xs">
									{fullscreenError}
								</output>
							) : null}
						</ContentPanel>
					</div>

					<div className="flex flex-col gap-3">
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
							deletingBookmark={deleteBookmarkMutation.isPending}
							onDeleteBookmark={(bookmark) =>
								deleteBookmarkMutation.mutate(bookmark.id)
							}
							onEditBookmark={openEditBookmarkDialog}
							onJumpToBookmark={jumpToBookmark}
						/>

						{saveError ? (
							<Alert variant="destructive">
								<AlertTitle>Save failed</AlertTitle>
								<AlertDescription>{saveError}</AlertDescription>
							</Alert>
						) : null}
					</div>
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
			<BookmarkDialog
				bookmark={editingBookmark}
				chapter={
					editingBookmark
						? (data.chapters.find(
								(chapter) => chapter.id === editingBookmark.chapterId,
							) ?? null)
						: selectedChapter
				}
				open={bookmarkDialogOpen}
				submitting={
					createBookmarkMutation.isPending || updateBookmarkMutation.isPending
				}
				timestampSeconds={
					editingBookmark?.timestampSeconds ?? Math.floor(currentSeconds)
				}
				onOpenChange={(open) => {
					setBookmarkDialogOpen(open);
					if (!open) {
						setEditingBookmark(null);
					}
				}}
				onSubmit={submitBookmarkDialog}
			/>
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
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="border-b border-border p-3">
				<h2 className="font-semibold text-sm">Chapters</h2>
				<p className="text-muted-foreground text-xs">
					Jump through the generated outline.
				</p>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-2 md:max-h-[420px] lg:max-h-none">
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
	const chapterDuration = getChapterDurationSeconds(
		chapter,
		chapters,
		durationSeconds,
	);
	const chapterEnd = getChapterEndSeconds(chapter, chapters, durationSeconds);
	const percent = calculateProgressPercent(watchedSeconds, chapterDuration);
	const durationLabel =
		chapterEnd === null ? null : formatCompactDuration(chapterDuration);

	return (
		<div
			aria-current={active ? "true" : undefined}
			className={`mb-1.5 rounded-md border px-2 py-1.5 transition-colors ${
				active
					? "border-primary/40 bg-accent text-accent-foreground"
					: "border-border bg-background hover:bg-muted/45"
			}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<button
						type="button"
						className="line-clamp-2 cursor-pointer text-left font-medium text-sm leading-5 transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
						onClick={() => onSelect(chapter)}
					>
						{chapter.title}
					</button>
					<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
						<span>
							{formatTimestamp(chapter.startSeconds)}
							{chapter.endSeconds
								? ` - ${formatTimestamp(chapter.endSeconds)}`
								: ""}
						</span>
						{durationLabel ? <span>{durationLabel}</span> : null}
						{active ? (
							<span className="font-medium text-primary">Now playing</span>
						) : null}
					</div>
				</div>
				<Button
					type="button"
					size="icon-xs"
					variant={completed ? "secondary" : "ghost"}
					className="mt-0.5"
					aria-pressed={completed}
					onClick={() => onToggleComplete(chapter)}
				>
					<HugeIcon
						name={completed ? "checkmarkCircle" : "circle"}
						className={completed ? "size-4 text-primary" : "size-4"}
					/>
					<span className="sr-only">
						{completed ? "Mark chapter incomplete" : "Mark chapter complete"}
					</span>
				</Button>
			</div>
			<div className="mt-1.5">
				<Progress value={completed ? 100 : percent} />
			</div>
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
	deletingBookmark,
	onDeleteBookmark,
	onEditBookmark,
	onJumpToBookmark,
}: {
	courseId: string;
	chapter: CourseChapterDTO | null;
	note: CoursePlayerDataDTO["notes"][number] | undefined;
	bookmarks: BookmarkDTO[];
	deletingBookmark: boolean;
	onDeleteBookmark: (bookmark: BookmarkDTO) => void;
	onEditBookmark: (bookmark: BookmarkDTO) => void;
	onJumpToBookmark: (bookmark: BookmarkDTO) => void;
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
									<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div className="min-w-0">
											<p className="font-medium">
												{bookmark.title ??
													`Bookmark at ${formatTimestamp(
														bookmark.timestampSeconds,
													)}`}
											</p>
											<p className="text-muted-foreground text-xs">
												{formatTimestamp(bookmark.timestampSeconds)}
											</p>
											{bookmark.note ? (
												<p className="mt-1 text-muted-foreground">
													{bookmark.note}
												</p>
											) : null}
										</div>
										<div className="flex shrink-0 flex-wrap gap-1">
											<Button
												type="button"
												size="xs"
												variant="outline"
												onClick={() => onJumpToBookmark(bookmark)}
											>
												Jump
											</Button>
											<Button
												type="button"
												size="icon-xs"
												variant="ghost"
												onClick={() => onEditBookmark(bookmark)}
											>
												<HugeIcon name="edit" className="size-4" />
												<span className="sr-only">Edit bookmark</span>
											</Button>
											<Button
												type="button"
												size="icon-xs"
												variant="ghost"
												disabled={deletingBookmark}
												onClick={() => onDeleteBookmark(bookmark)}
											>
												<HugeIcon name="delete" className="size-4" />
												<span className="sr-only">Delete bookmark</span>
											</Button>
										</div>
									</div>
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

function resolveInitialChapterId(data: CoursePlayerDataDTO, seconds: number) {
	const resumeChapter = findChapterAtTime(data.chapters, seconds);

	return resumeChapter?.id ?? data.chapters[0]?.id ?? null;
}

function resolveInitialSeconds(
	data: CoursePlayerDataDTO,
	chapterId: string | undefined,
	bookmark: BookmarkDTO | null,
) {
	if (bookmark?.chapterId) {
		const bookmarkedChapter = data.chapters.find(
			(chapter) => chapter.id === bookmark.chapterId,
		);

		if (bookmarkedChapter) {
			return bookmark.timestampSeconds;
		}
	}

	if (bookmark) {
		const bookmarkedChapter = findChapterAtTime(
			data.chapters,
			bookmark.timestampSeconds,
		);

		if (bookmarkedChapter) {
			return bookmark.timestampSeconds;
		}
	}

	if (chapterId) {
		const chapter = data.chapters.find(
			(candidate) => candidate.id === chapterId,
		);

		if (chapter) {
			return chapter.startSeconds;
		}
	}

	return data.progress?.resumeSeconds ?? 0;
}

function findChapterAtTime(
	chapters: CourseChapterDTO[],
	seconds: number,
	durationSeconds?: number | null,
	preferredChapterId?: string | null,
) {
	const preferredChapter = preferredChapterId
		? chapters.find((chapter) => chapter.id === preferredChapterId)
		: null;

	if (preferredChapter) {
		const preferredEndSeconds = getChapterEndSeconds(
			preferredChapter,
			chapters,
			durationSeconds,
		);

		if (
			preferredEndSeconds !== null &&
			seconds >= preferredChapter.startSeconds &&
			seconds <= preferredEndSeconds
		) {
			return preferredChapter;
		}
	}

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

function getSeekDirection(
	chapters: CourseChapterDTO[],
	currentChapterId: string | null,
	targetChapterId: string,
	currentSeconds: number,
	targetSeconds: number,
) {
	const currentIndex = currentChapterId
		? chapters.findIndex((chapter) => chapter.id === currentChapterId)
		: -1;
	const targetIndex = chapters.findIndex(
		(chapter) => chapter.id === targetChapterId,
	);

	if (currentIndex !== -1 && targetIndex !== -1) {
		if (targetIndex > currentIndex) {
			return "forward";
		}
		if (targetIndex < currentIndex) {
			return "backward";
		}
	}

	if (targetSeconds > currentSeconds) {
		return "forward";
	}
	if (targetSeconds < currentSeconds) {
		return "backward";
	}

	return "exact";
}

function hasReachedPendingSeek(
	timeSeconds: number,
	pendingSeek: {
		direction: "backward" | "exact" | "forward";
		targetSeconds: number;
	},
) {
	if (pendingSeek.direction === "forward") {
		return timeSeconds >= pendingSeek.targetSeconds;
	}

	if (pendingSeek.direction === "backward") {
		return timeSeconds <= pendingSeek.targetSeconds;
	}

	return Math.abs(timeSeconds - pendingSeek.targetSeconds) <= 1;
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

function mergeCourseProgress(
	current: CoursePlayerDataDTO["progress"],
	next: NonNullable<CoursePlayerDataDTO["progress"]>,
) {
	if (!current) {
		return next;
	}

	const currentUpdatedAt = Date.parse(current.updatedAt);
	const nextUpdatedAt = Date.parse(next.updatedAt);
	const useNextResume =
		(Number.isFinite(nextUpdatedAt) ? nextUpdatedAt : 0) >=
		(Number.isFinite(currentUpdatedAt) ? currentUpdatedAt : 0);

	return {
		...(useNextResume ? next : current),
		completionPercent: Math.max(
			current.completionPercent,
			next.completionPercent,
		),
	};
}

function mergeChapterProgressList(
	current: ChapterProgressDTO[],
	nextItems: ChapterProgressDTO[],
) {
	return nextItems.reduce(
		(items, next) => mergeChapterProgress(items, next),
		current,
	);
}

function mergeChapterProgressPayload(
	current: ChapterProgressDTO[],
	nextItems: UpsertPlaybackProgressRequestV1["chapters"],
	updatedAt: string,
) {
	return current.map((item) => {
		const next = nextItems.find(
			(candidate) => candidate.chapterId === item.chapterId,
		);

		if (!next) {
			return item;
		}

		return {
			...item,
			watchedSeconds: Math.max(item.watchedSeconds, next.watchedSeconds),
			completed: item.completed || next.completed,
			updatedAt,
		};
	});
}

function mergeBookmark(current: BookmarkDTO[], next: BookmarkDTO) {
	const existingIndex = current.findIndex((item) => item.id === next.id);
	const nextItems =
		existingIndex === -1
			? [...current, next]
			: current.map((item, index) => (index === existingIndex ? next : item));

	return [...nextItems].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
}

function chooseNewestPlayerData(
	initialData: CoursePlayerDataDTO,
	cachedData: CoursePlayerDataDTO | undefined,
) {
	if (!cachedData) {
		return initialData;
	}

	const initialProgressTime = Date.parse(initialData.progress?.updatedAt ?? "");
	const cachedProgressTime = Date.parse(cachedData.progress?.updatedAt ?? "");

	return (Number.isFinite(cachedProgressTime) ? cachedProgressTime : 0) >
		(Number.isFinite(initialProgressTime) ? initialProgressTime : 0)
		? cachedData
		: initialData;
}

function sendProgressBeacon(payload: UpsertPlaybackProgressRequestV1) {
	const body = JSON.stringify(payload);

	if (navigator.sendBeacon) {
		const sent = navigator.sendBeacon(
			"/api/v1/progress/playback",
			new Blob([body], { type: "application/json" }),
		);

		if (sent) {
			return;
		}
	}

	void fetch("/api/v1/progress/playback", {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body,
		keepalive: true,
	});
}

export { CoursePlayerScreen };
