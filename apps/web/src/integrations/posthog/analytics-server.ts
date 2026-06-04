import { PostHog } from "posthog-node";
import type { AnalyticsEventName, AnalyticsProperties } from "./analytics";
import { getServerAnalyticsConfig } from "./analytics-config";

type ServerAnalyticsClient = Pick<PostHog, "captureImmediate">;

interface GenerationMetricContext {
	chapterCount?: number;
	course: {
		id: string;
		ownerId: string | null;
	};
	failureCategory?: string | null;
	job: {
		completedAt: string | null;
		createdAt: string;
		id: string;
		startedAt: string | null;
	};
	retryable?: boolean;
	video: {
		provider: string;
		providerVideoId: string;
	};
}

let posthogClient: ServerAnalyticsClient | null | undefined;
let clientForTests: ServerAnalyticsClient | null | undefined;

export async function trackServerAnalyticsEvent(
	event: AnalyticsEventName,
	distinctId: string,
	properties: AnalyticsProperties = {},
) {
	try {
		const client = getServerPostHogClient();
		if (!client) {
			return;
		}

		await client.captureImmediate({
			distinctId,
			event,
			properties: compactProperties(properties),
		});
	} catch {
		return;
	}
}

export async function trackGenerationJobCompleted(
	input: GenerationMetricContext,
) {
	await trackServerAnalyticsEvent(
		"generation_job_completed",
		getGenerationDistinctId(input),
		buildGenerationMetricProperties(input),
	);
}

export async function trackGenerationJobFailed(input: GenerationMetricContext) {
	await trackServerAnalyticsEvent(
		"generation_job_failed",
		getGenerationDistinctId(input),
		buildGenerationMetricProperties({
			...input,
			failureCategory: input.failureCategory ?? "unknown",
		}),
	);
}

export function buildGenerationMetricProperties(
	input: GenerationMetricContext,
): AnalyticsProperties {
	return {
		chapter_count: input.chapterCount,
		course_id: input.course.id,
		duration_ms: getDurationMs(input.job.createdAt, input.job.completedAt),
		failure_category: input.failureCategory ?? undefined,
		job_id: input.job.id,
		provider_video_id: input.video.providerVideoId,
		retryable: input.retryable,
		started_duration_ms: getDurationMs(
			input.job.startedAt,
			input.job.completedAt,
		),
		video_provider: input.video.provider,
	};
}

export function getGenerationDistinctId(input: GenerationMetricContext) {
	return input.course.ownerId ?? `course:${input.course.id}`;
}

export function setServerAnalyticsClientForTests(
	client: ServerAnalyticsClient | null | undefined,
) {
	clientForTests = client;
	posthogClient = undefined;
}

function getServerPostHogClient() {
	if (clientForTests !== undefined) {
		return clientForTests;
	}

	if (posthogClient !== undefined) {
		return posthogClient;
	}

	const config = getServerAnalyticsConfig();
	const key = config.key;
	if (!config.enabled || !key) {
		posthogClient = null;
		return posthogClient;
	}

	posthogClient = new PostHog(key, { host: config.host });
	return posthogClient;
}

function getDurationMs(
	startIso: string | null | undefined,
	endIso: string | null | undefined,
) {
	if (!startIso || !endIso) {
		return undefined;
	}

	const start = Date.parse(startIso);
	const end = Date.parse(endIso);
	const durationMs = end - start;

	return Number.isFinite(durationMs) && durationMs >= 0
		? durationMs
		: undefined;
}

function compactProperties(properties: AnalyticsProperties) {
	return Object.fromEntries(
		Object.entries(properties).filter(([, value]) => value !== undefined),
	);
}
