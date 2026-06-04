import { afterEach, describe, expect, test, vi } from "vitest";
import {
	buildGenerationMetricProperties,
	getGenerationDistinctId,
	setServerAnalyticsClientForTests,
	trackGenerationJobCompleted,
	trackServerAnalyticsEvent,
} from "./analytics-server";

const metricContext = {
	course: {
		id: "course-1",
		ownerId: "user-1",
	},
	job: {
		completedAt: "2026-01-01T00:02:30.000Z",
		createdAt: "2026-01-01T00:00:00.000Z",
		id: "job-1",
		startedAt: "2026-01-01T00:00:30.000Z",
	},
	video: {
		provider: "youtube",
		providerVideoId: "video-1",
	},
};

describe("server PostHog analytics", () => {
	afterEach(() => {
		setServerAnalyticsClientForTests(undefined);
		vi.restoreAllMocks();
	});

	test("builds completed generation metrics with duration values", () => {
		expect(
			buildGenerationMetricProperties({
				...metricContext,
				chapterCount: 8,
			}),
		).toEqual({
			chapter_count: 8,
			course_id: "course-1",
			duration_ms: 150_000,
			failure_category: undefined,
			job_id: "job-1",
			provider_video_id: "video-1",
			retryable: undefined,
			started_duration_ms: 120_000,
			video_provider: "youtube",
		});
	});

	test("builds failed generation metrics with retry and failure category", () => {
		expect(
			buildGenerationMetricProperties({
				...metricContext,
				failureCategory: "transcript_unavailable",
				retryable: true,
			}),
		).toMatchObject({
			duration_ms: 150_000,
			failure_category: "transcript_unavailable",
			retryable: true,
		});
	});

	test("omits invalid duration values", () => {
		expect(
			buildGenerationMetricProperties({
				...metricContext,
				job: {
					completedAt: null,
					createdAt: "bad-date",
					id: "job-1",
					startedAt: null,
				},
			}),
		).toMatchObject({
			duration_ms: undefined,
			started_duration_ms: undefined,
		});
	});

	test("uses course fallback distinct id for anonymous jobs", () => {
		expect(
			getGenerationDistinctId({
				...metricContext,
				course: {
					id: "course-1",
					ownerId: null,
				},
			}),
		).toBe("course:course-1");
	});

	test("captures server analytics with compacted properties", async () => {
		const captureImmediate = vi.fn().mockResolvedValue(undefined);
		setServerAnalyticsClientForTests({ captureImmediate });

		await trackGenerationJobCompleted({
			...metricContext,
			chapterCount: 8,
		});

		expect(captureImmediate).toHaveBeenCalledWith({
			distinctId: "user-1",
			event: "generation_job_completed",
			properties: {
				chapter_count: 8,
				course_id: "course-1",
				duration_ms: 150_000,
				job_id: "job-1",
				provider_video_id: "video-1",
				started_duration_ms: 120_000,
				video_provider: "youtube",
			},
		});
	});

	test("tracking disabled and capture failures do not throw", async () => {
		setServerAnalyticsClientForTests(null);
		await expect(
			trackServerAnalyticsEvent("generation_job_completed", "user-1"),
		).resolves.toBeUndefined();

		setServerAnalyticsClientForTests({
			captureImmediate: vi.fn().mockRejectedValue(new Error("network")),
		});
		await expect(
			trackServerAnalyticsEvent("generation_job_completed", "user-1"),
		).resolves.toBeUndefined();
	});
});
