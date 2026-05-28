import type { CourseChapterDTO, GenerationJobStatus } from "@benkyou/types";

export const GENERATION_JOB_STATUSES = [
	"queued",
	"processing",
	"completed",
	"failed",
	"cancelled",
] as const satisfies readonly GenerationJobStatus[];

export function isTerminalGenerationStatus(status: GenerationJobStatus) {
	return (
		status === "completed" || status === "failed" || status === "cancelled"
	);
}

export function sortChaptersByOrder<
	T extends Pick<CourseChapterDTO, "orderIndex">,
>(chapters: T[]) {
	return [...chapters].sort(
		(first, second) => first.orderIndex - second.orderIndex,
	);
}

export function isValidChapterTimeRange(
	startSeconds: number,
	endSeconds: number | null,
) {
	if (!Number.isFinite(startSeconds) || startSeconds < 0) {
		return false;
	}

	return (
		endSeconds === null ||
		(Number.isFinite(endSeconds) && endSeconds > startSeconds)
	);
}
