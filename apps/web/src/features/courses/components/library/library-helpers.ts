import type {
	CourseLibraryFilterV1,
	CourseLibraryItemDTO,
} from "@benkyou/types";

const filterLabels: Record<CourseLibraryFilterV1, string> = {
	all: "All",
	"in-progress": "In progress",
	completed: "Done",
	processing: "Being prepared",
	failed: "Failed",
};

function isPreparing(item: CourseLibraryItemDTO) {
	const status = item.latestGenerationJob?.status;
	return status === "queued" || status === "processing";
}

function hasFailed(item: CourseLibraryItemDTO) {
	const status = item.latestGenerationJob?.status;
	return status === "failed" || status === "cancelled";
}

function isReady(item: CourseLibraryItemDTO) {
	return !isPreparing(item) && !hasFailed(item);
}

function matchesFilter(
	item: CourseLibraryItemDTO,
	filter: CourseLibraryFilterV1,
) {
	const progress = item.progress?.completionPercent ?? 0;

	switch (filter) {
		case "all":
			return true;
		case "processing":
			return isPreparing(item);
		case "failed":
			return hasFailed(item);
		case "completed":
			return isReady(item) && progress >= 100;
		case "in-progress":
			return isReady(item) && progress > 0 && progress < 100;
	}
}

function filterNotebooks(
	items: CourseLibraryItemDTO[],
	filter: CourseLibraryFilterV1,
	query: string,
) {
	const normalizedQuery = query.trim().toLowerCase();

	return items.filter((item) => {
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
			matchesFilter(item, filter) &&
			(!normalizedQuery || haystack.includes(normalizedQuery))
		);
	});
}

function countByFilter(items: CourseLibraryItemDTO[]) {
	return Object.fromEntries(
		(Object.keys(filterLabels) as CourseLibraryFilterV1[]).map((filter) => [
			filter,
			items.filter((item) => matchesFilter(item, filter)).length,
		]),
	) as Record<CourseLibraryFilterV1, number>;
}

/** The ready notebook studied most recently that still has something left. */
function findResumeCandidate(items: CourseLibraryItemDTO[]) {
	return items
		.filter((item) => {
			const progress = item.progress;
			return (
				isReady(item) &&
				progress !== null &&
				progress.resumeSeconds > 0 &&
				progress.completionPercent < 100
			);
		})
		.sort((a, b) =>
			(b.progress?.updatedAt ?? "").localeCompare(a.progress?.updatedAt ?? ""),
		)[0];
}

function formatLength(durationSeconds: number | null) {
	if (!durationSeconds || durationSeconds <= 0) {
		return null;
	}

	const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0) {
		return `${minutes}m`;
	}

	return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatTimeLeft(percent: number, durationSeconds: number | null) {
	const safePercent = Math.max(0, Math.min(100, percent));

	if (safePercent >= 100) {
		return "Done";
	}

	if (safePercent === 0) {
		return "Not started";
	}

	const remaining = durationSeconds
		? Math.round((durationSeconds * (100 - safePercent)) / 100)
		: null;
	const label = formatLength(remaining);

	return label ? `${label} left` : `${safePercent}%`;
}

function formatRelativeDay(value: string, now = new Date()) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Recently";
	}

	const startOfDay = (d: Date) =>
		new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

	if (days <= 0) {
		return "Today";
	}

	if (days === 1) {
		return "Yesterday";
	}

	if (days < 7) {
		return `${days} days ago`;
	}

	return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export {
	countByFilter,
	filterLabels,
	filterNotebooks,
	findResumeCandidate,
	formatLength,
	formatRelativeDay,
	formatTimeLeft,
	hasFailed,
	isPreparing,
};
