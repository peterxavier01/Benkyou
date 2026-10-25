import type { CourseLibraryItemDTO } from "@benkyou/types";
import { describe, expect, it } from "vitest";
import {
	countByFilter,
	filterNotebooks,
	findResumeCandidate,
	formatRelativeDay,
	formatTimeLeft,
} from "./library-helpers";

function item(
	id: string,
	options: {
		status?: "queued" | "processing" | "completed" | "failed" | "cancelled";
		percent?: number;
		resume?: number;
		updatedAt?: string;
		title?: string;
	} = {},
): CourseLibraryItemDTO {
	return {
		course: { id, title: options.title ?? id, description: null },
		video: { title: id, channelTitle: "Channel", durationSeconds: 3600 },
		chapterCount: 4,
		progress:
			options.percent === undefined
				? null
				: {
						id: `p-${id}`,
						userId: null,
						courseId: id,
						resumeSeconds: options.resume ?? 0,
						completionPercent: options.percent,
						updatedAt: options.updatedAt ?? "2026-10-01T00:00:00.000Z",
					},
		latestGenerationJob: options.status
			? ({ id: `job-${id}`, status: options.status } as never)
			: null,
	} as unknown as CourseLibraryItemDTO;
}

describe("filterNotebooks", () => {
	const items = [
		item("ready", { percent: 40, title: "Postgres internals" }),
		item("done", { percent: 100 }),
		item("new", { percent: 0 }),
		item("prep", { status: "processing" }),
		item("fail", { status: "failed" }),
	];

	it("keeps jobs out of the progress filters", () => {
		expect(
			filterNotebooks(items, "in-progress", "").map((i) => i.course.id),
		).toEqual(["ready"]);
		expect(
			filterNotebooks(items, "completed", "").map((i) => i.course.id),
		).toEqual(["done"]);
		expect(
			filterNotebooks(items, "processing", "").map((i) => i.course.id),
		).toEqual(["prep"]);
	});

	it("searches title and channel", () => {
		expect(
			filterNotebooks(items, "all", "postgres").map((i) => i.course.id),
		).toEqual(["ready"]);
	});

	it("counts every filter", () => {
		expect(countByFilter(items)).toEqual({
			all: 5,
			"in-progress": 1,
			completed: 1,
			processing: 1,
			failed: 1,
		});
	});
});

describe("findResumeCandidate", () => {
	it("picks the most recently studied unfinished notebook", () => {
		const result = findResumeCandidate([
			item("old", {
				percent: 20,
				resume: 30,
				updatedAt: "2026-09-01T00:00:00Z",
			}),
			item("recent", {
				percent: 50,
				resume: 90,
				updatedAt: "2026-10-01T00:00:00Z",
			}),
			item("finished", {
				percent: 100,
				resume: 10,
				updatedAt: "2026-10-02T00:00:00Z",
			}),
			item("unstarted", {
				percent: 0,
				resume: 0,
				updatedAt: "2026-10-03T00:00:00Z",
			}),
		]);
		expect(result?.course.id).toBe("recent");
	});
});

describe("formatters", () => {
	it("describes time left", () => {
		expect(formatTimeLeft(0, 3600)).toBe("Not started");
		expect(formatTimeLeft(50, 3600)).toBe("30m left");
		expect(formatTimeLeft(100, 3600)).toBe("Done");
	});

	it("uses relative days", () => {
		const now = new Date(2026, 9, 25, 12);
		expect(formatRelativeDay(new Date(2026, 9, 25, 8).toISOString(), now)).toBe(
			"Today",
		);
		expect(formatRelativeDay(new Date(2026, 9, 24, 8).toISOString(), now)).toBe(
			"Yesterday",
		);
		expect(formatRelativeDay(new Date(2026, 9, 21, 8).toISOString(), now)).toBe(
			"4 days ago",
		);
	});
});
