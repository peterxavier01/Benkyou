import { DEFAULT_CHAPTER_COMPLETION_THRESHOLD } from "./constants";

export function clampProgressPercent(value: number) {
	if (!Number.isFinite(value)) {
		return 0;
	}

	return Math.min(100, Math.max(0, value));
}

export function calculateProgressPercent(watchedSeconds: number, durationSeconds: number) {
	if (!Number.isFinite(watchedSeconds) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
		return 0;
	}

	return clampProgressPercent((watchedSeconds / durationSeconds) * 100);
}

export function isChapterCompleteByWatchTime(
	watchedSeconds: number,
	durationSeconds: number,
	threshold = DEFAULT_CHAPTER_COMPLETION_THRESHOLD,
) {
	if (!Number.isFinite(threshold) || threshold <= 0) {
		return false;
	}

	return calculateProgressPercent(watchedSeconds, durationSeconds) >= threshold * 100;
}
