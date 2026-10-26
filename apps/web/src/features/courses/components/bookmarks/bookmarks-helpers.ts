import type { BookmarkListItemDTO } from "@benkyou/types";

function groupByNotebook(items: BookmarkListItemDTO[]) {
	const groups = new Map<
		string,
		{ course: BookmarkListItemDTO["course"]; items: BookmarkListItemDTO[] }
	>();

	for (const item of items) {
		const group = groups.get(item.course.id) ?? {
			course: item.course,
			items: [],
		};
		group.items.push(item);
		groups.set(item.course.id, group);
	}

	for (const group of groups.values()) {
		group.items.sort(
			(a, b) => a.bookmark.timestampSeconds - b.bookmark.timestampSeconds,
		);
	}

	return Array.from(groups.values());
}

function formatDay(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? null
		: date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getCourseFilterOptions(items: BookmarkListItemDTO[]) {
	const options = new Map<string, { id: string; title: string }>();

	for (const item of items) {
		options.set(item.course.id, {
			id: item.course.id,
			title: item.course.title,
		});
	}

	return Array.from(options.values()).sort((a, b) =>
		a.title.localeCompare(b.title),
	);
}

function filterBookmarks(
	items: BookmarkListItemDTO[],
	search: { notebook: string; q: string },
) {
	const query = search.q.trim().toLowerCase();

	return items.filter((item) => {
		if (search.notebook !== "all" && item.course.id !== search.notebook) {
			return false;
		}

		if (!query) {
			return true;
		}

		return [
			item.bookmark.title,
			item.bookmark.note,
			item.course.title,
			item.video.title,
			item.video.channelTitle,
			item.chapter?.title,
		]
			.filter(Boolean)
			.some((value) => value?.toLowerCase().includes(query));
	});
}

export { filterBookmarks, formatDay, getCourseFilterOptions, groupByNotebook };
