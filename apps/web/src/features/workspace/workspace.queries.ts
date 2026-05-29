import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser } from "#/features/auth/auth.functions";
import { getGenerationJob } from "#/features/course-generation/course-generation.functions";
import {
	getBookmarks,
	getCourseLibrary,
	getCourseManagementData,
	getCoursePlayerData,
	getLearningPreferences,
} from "#/features/courses/course-workspace.functions";

const WORKSPACE_STALE_TIME_MS = 60 * 1000;
const PREFERENCES_STALE_TIME_MS = 5 * 60 * 1000;
const GENERATION_JOB_STALE_TIME_MS = 2 * 1000;

export const workspaceQueryKeys = {
	bookmarks: ["bookmarks"] as const,
	courseLibrary: ["course-library"] as const,
	courseManagement: (courseId: string) =>
		["course-management", courseId] as const,
	coursePlayer: (courseId: string) => ["course-player", courseId] as const,
	currentUser: ["current-user"] as const,
	generationJob: (jobId: string) => ["generation-job", jobId] as const,
	learningPreferences: ["learning-preferences"] as const,
};

export function bookmarksQueryOptions() {
	return queryOptions({
		queryKey: workspaceQueryKeys.bookmarks,
		queryFn: () => getBookmarks(),
		staleTime: WORKSPACE_STALE_TIME_MS,
	});
}

export function courseLibraryQueryOptions() {
	return queryOptions({
		queryKey: workspaceQueryKeys.courseLibrary,
		queryFn: () => getCourseLibrary(),
		staleTime: WORKSPACE_STALE_TIME_MS,
	});
}

export function courseManagementQueryOptions(courseId: string) {
	return queryOptions({
		queryKey: workspaceQueryKeys.courseManagement(courseId),
		queryFn: () => getCourseManagementData({ data: { courseId } }),
		staleTime: WORKSPACE_STALE_TIME_MS,
	});
}

export function coursePlayerQueryOptions(courseId: string) {
	return queryOptions({
		queryKey: workspaceQueryKeys.coursePlayer(courseId),
		queryFn: async () => {
			const response = await getCoursePlayerData({ data: { courseId } });
			return response.data;
		},
		staleTime: WORKSPACE_STALE_TIME_MS,
	});
}

export function currentUserQueryOptions() {
	return queryOptions({
		queryKey: workspaceQueryKeys.currentUser,
		queryFn: () => getCurrentUser(),
		staleTime: WORKSPACE_STALE_TIME_MS,
	});
}

export function generationJobQueryOptions(jobId: string) {
	return queryOptions({
		queryKey: workspaceQueryKeys.generationJob(jobId),
		queryFn: () => getGenerationJob({ data: { generationJobId: jobId } }),
		staleTime: GENERATION_JOB_STALE_TIME_MS,
	});
}

export function learningPreferencesQueryOptions() {
	return queryOptions({
		queryKey: workspaceQueryKeys.learningPreferences,
		queryFn: () => getLearningPreferences(),
		staleTime: PREFERENCES_STALE_TIME_MS,
	});
}
