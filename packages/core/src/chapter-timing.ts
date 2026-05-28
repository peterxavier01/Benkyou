export interface ChapterTimingRange {
	id?: string;
	startSeconds: number;
	endSeconds?: number | null;
}

export function getChapterEndSeconds<TChapter extends ChapterTimingRange>(
	chapter: TChapter,
	chapters: TChapter[],
	videoDurationSeconds?: number | null,
) {
	const index = chapters.findIndex((candidate) =>
		chapter.id ? candidate.id === chapter.id : candidate === chapter,
	);
	const nextChapter = index >= 0 ? chapters[index + 1] : undefined;
	const endSeconds =
		chapter.endSeconds ??
		nextChapter?.startSeconds ??
		videoDurationSeconds ??
		null;

	if (
		endSeconds === null ||
		endSeconds === undefined ||
		!Number.isFinite(endSeconds) ||
		endSeconds <= chapter.startSeconds
	) {
		return null;
	}

	return Math.floor(endSeconds);
}

export function getChapterDurationSeconds<TChapter extends ChapterTimingRange>(
	chapter: TChapter,
	chapters: TChapter[],
	videoDurationSeconds?: number | null,
) {
	const endSeconds = getChapterEndSeconds(
		chapter,
		chapters,
		videoDurationSeconds,
	);

	return Math.max(
		1,
		(endSeconds ?? chapter.startSeconds + 1) - chapter.startSeconds,
	);
}

export function getRelativeChapterSeconds(
	absoluteSeconds: number,
	chapter: Pick<ChapterTimingRange, "startSeconds">,
) {
	if (!Number.isFinite(absoluteSeconds)) {
		return 0;
	}

	return Math.max(0, Math.floor(absoluteSeconds) - chapter.startSeconds);
}

export function formatCompactDuration(totalSeconds: number | null | undefined) {
	if (
		totalSeconds === null ||
		totalSeconds === undefined ||
		!Number.isFinite(totalSeconds) ||
		totalSeconds <= 0
	) {
		return null;
	}

	const safeSeconds = Math.max(1, Math.floor(totalSeconds));
	const hours = Math.floor(safeSeconds / 3600);
	const minutes = Math.max(1, Math.round((safeSeconds % 3600) / 60));

	if (hours > 0) {
		return minutes >= 60 ? `${hours + 1}h` : `${hours}h ${minutes}m`;
	}

	return `${minutes} min`;
}
