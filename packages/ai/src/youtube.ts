import type { ChapterGenerationPolicy } from "@benkyou/core";
import {
	fetchTranscript,
	YoutubeTranscriptDisabledError,
	YoutubeTranscriptNotAvailableError,
	YoutubeTranscriptNotAvailableLanguageError,
	YoutubeTranscriptTooManyRequestError,
	YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript";

const TRANSCRIPTAPI_BASE_URL = "https://transcriptapi.com/api/v2";
const TRANSCRIPTAPI_MAX_RETRIES = 2;
const TRANSCRIPTAPI_RETRY_AFTER_CAP_MS = 5_000;

export interface TranscriptSegment {
	text: string;
	startSeconds: number;
	durationSeconds: number;
}

export type YouTubeTranscriptProvider = "auto" | "local" | "transcriptapi";

export type YouTubeTranscriptFailureCode =
	| "configuration"
	| "disabled"
	| "empty"
	| "language_unavailable"
	| "not_available"
	| "payment_required"
	| "provider_unavailable"
	| "too_many_requests"
	| "unavailable"
	| "unknown";

export interface FetchYouTubeTranscriptOptions {
	env?: NodeJS.ProcessEnv;
	fetchImpl?: typeof fetch;
	localTranscriptFetcher?: typeof fetchTranscript;
	sleep?: (milliseconds: number) => Promise<void>;
}

export class YouTubeTranscriptFetchError extends Error {
	readonly code: YouTubeTranscriptFailureCode;
	readonly providerVideoId: string;

	constructor(
		providerVideoId: string,
		code: YouTubeTranscriptFailureCode,
		cause?: unknown,
	) {
		super(getYouTubeTranscriptFailureMessage(providerVideoId, code), { cause });
		this.name = "YouTubeTranscriptFetchError";
		this.code = code;
		this.providerVideoId = providerVideoId;
	}
}

export interface YouTubeMetadata {
	title: string | null;
	description: string | null;
	channelName: string | null;
	channelUrl: string | null;
	thumbnailUrl: string | null;
	durationSeconds: number | null;
	categoryId: string | null;
	tags: string[];
	topicCategories: string[];
	rawMetadata: Record<string, unknown>;
}

export async function fetchYouTubeTranscript(
	providerVideoId: string,
	options: FetchYouTubeTranscriptOptions = {},
): Promise<TranscriptSegment[]> {
	const env = options.env ?? process.env;
	const provider = resolveYouTubeTranscriptProvider(env);

	if (provider === "transcriptapi") {
		return fetchTranscriptFromTranscriptApi(providerVideoId, {
			apiKey: env.TRANSCRIPTAPI_API_KEY,
			fetchImpl: options.fetchImpl ?? fetch,
			sleep: options.sleep ?? sleep,
		});
	}

	return fetchTranscriptFromLocalPackage(
		providerVideoId,
		options.localTranscriptFetcher ?? fetchTranscript,
	);
}

export function resolveYouTubeTranscriptProvider(
	env: NodeJS.ProcessEnv = process.env,
): Exclude<YouTubeTranscriptProvider, "auto"> {
	const configuredProvider = normalizeYouTubeTranscriptProvider(
		env.YOUTUBE_TRANSCRIPT_PROVIDER,
	);

	if (configuredProvider === "local") {
		return "local";
	}

	if (configuredProvider === "transcriptapi") {
		return "transcriptapi";
	}

	return env.TRANSCRIPTAPI_API_KEY ? "transcriptapi" : "local";
}

async function fetchTranscriptFromLocalPackage(
	providerVideoId: string,
	localTranscriptFetcher: typeof fetchTranscript,
) {
	let transcript: Awaited<ReturnType<typeof fetchTranscript>>;

	try {
		transcript = await localTranscriptFetcher(providerVideoId);
	} catch (error) {
		throw new YouTubeTranscriptFetchError(
			providerVideoId,
			getYouTubeTranscriptFailureCode(error),
			error,
		);
	}

	const timeUnit = inferLocalTranscriptTimeUnit(transcript);
	const segments = transcript
		.map((segment) => ({
			text: segment.text.trim(),
			startSeconds: normalizeTranscriptTime(segment.offset, timeUnit),
			durationSeconds: normalizeTranscriptTime(segment.duration, timeUnit),
		}))
		.filter((segment) => segment.text.length > 0);

	if (segments.length === 0) {
		throw new YouTubeTranscriptFetchError(providerVideoId, "empty");
	}

	return segments;
}

async function fetchTranscriptFromTranscriptApi(
	providerVideoId: string,
	options: {
		apiKey?: string;
		fetchImpl: typeof fetch;
		sleep: (milliseconds: number) => Promise<void>;
	},
) {
	if (!options.apiKey) {
		throw new YouTubeTranscriptFetchError(providerVideoId, "configuration");
	}

	let response: Response | null = null;

	for (let attempt = 0; attempt <= TRANSCRIPTAPI_MAX_RETRIES; attempt += 1) {
		try {
			response = await options.fetchImpl(
				getTranscriptApiUrl(providerVideoId),
				{
					headers: {
						Authorization: `Bearer ${options.apiKey}`,
					},
				},
			);
		} catch (error) {
			if (attempt >= TRANSCRIPTAPI_MAX_RETRIES) {
				throw new YouTubeTranscriptFetchError(
					providerVideoId,
					"provider_unavailable",
					error,
				);
			}

			await options.sleep(getTranscriptApiBackoffMs(attempt));
			continue;
		}

		if (response.ok) {
			return parseTranscriptApiResponse(providerVideoId, response);
		}

		if (
			isTranscriptApiRetryableStatus(response.status) &&
			attempt < TRANSCRIPTAPI_MAX_RETRIES
		) {
			await options.sleep(getTranscriptApiRetryDelayMs(response, attempt));
			continue;
		}

		throw new YouTubeTranscriptFetchError(
			providerVideoId,
			getTranscriptApiFailureCode(response.status),
		);
	}

	throw new YouTubeTranscriptFetchError(
		providerVideoId,
		getTranscriptApiFailureCode(response?.status ?? 503),
	);
}

async function parseTranscriptApiResponse(
	providerVideoId: string,
	response: Response,
) {
	let data: unknown;

	try {
		data = await response.json();
	} catch (error) {
		throw new YouTubeTranscriptFetchError(
			providerVideoId,
			"provider_unavailable",
			error,
		);
	}

	const record = getRecord(data);
	const transcript = record?.transcript;

	if (!Array.isArray(transcript)) {
		throw new YouTubeTranscriptFetchError(
			providerVideoId,
			"provider_unavailable",
		);
	}

	const segments: TranscriptSegment[] = [];

	for (const rawSegment of transcript) {
		const segment = getRecord(rawSegment);
		const text = typeof segment?.text === "string" ? segment.text.trim() : "";

		if (!text) {
			continue;
		}

		const start = segment?.start;
		const duration = segment?.duration;

		if (typeof start !== "number" || typeof duration !== "number") {
			throw new YouTubeTranscriptFetchError(
				providerVideoId,
				"provider_unavailable",
			);
		}

		segments.push({
			text,
			startSeconds: normalizeTranscriptTime(start, "seconds"),
			durationSeconds: normalizeTranscriptTime(duration, "seconds"),
		});
	}

	if (segments.length === 0) {
		throw new YouTubeTranscriptFetchError(providerVideoId, "empty");
	}

	return segments;
}

export async function fetchYouTubeDataApiMetadata(
	providerVideoId: string,
): Promise<YouTubeMetadata | null> {
	const apiKey = process.env.YOUTUBE_API_KEY;

	if (!apiKey) {
		return null;
	}

	const response = await fetch(
		`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,topicDetails&id=${encodeURIComponent(
			providerVideoId,
		)}&key=${encodeURIComponent(apiKey)}`,
	);

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as {
		items?: Array<{
			snippet?: {
				title?: unknown;
				description?: unknown;
				channelTitle?: unknown;
				channelId?: unknown;
				categoryId?: unknown;
				tags?: unknown;
				thumbnails?: Record<string, { url?: unknown } | undefined>;
			};
			contentDetails?: {
				duration?: unknown;
			};
			topicDetails?: {
				topicCategories?: unknown;
			};
		}>;
	};

	return parseYouTubeDataApiVideoMetadata(data);
}

export function parseYouTubeDataApiVideoMetadata(data: {
	items?: Array<{
		snippet?: {
			title?: unknown;
			description?: unknown;
			channelTitle?: unknown;
			channelId?: unknown;
			categoryId?: unknown;
			tags?: unknown;
			thumbnails?: Record<string, { url?: unknown } | undefined>;
		};
		contentDetails?: {
			duration?: unknown;
		};
		topicDetails?: {
			topicCategories?: unknown;
		};
	}>;
}): YouTubeMetadata | null {
	const item = data.items?.[0];

	if (!item) {
		return null;
	}

	const snippet = item.snippet;
	const channelId =
		typeof snippet?.channelId === "string" ? snippet.channelId : null;

	return {
		title: typeof snippet?.title === "string" ? snippet.title : null,
		description:
			typeof snippet?.description === "string" ? snippet.description : null,
		channelName:
			typeof snippet?.channelTitle === "string" ? snippet.channelTitle : null,
		channelUrl: channelId
			? `https://www.youtube.com/channel/${channelId}`
			: null,
		thumbnailUrl: getBestThumbnailUrl(snippet?.thumbnails),
		durationSeconds:
			typeof item.contentDetails?.duration === "string"
				? parseYouTubeDuration(item.contentDetails.duration)
				: null,
		categoryId:
			typeof snippet?.categoryId === "string" ? snippet.categoryId : null,
		tags: Array.isArray(snippet?.tags)
			? snippet.tags.filter((tag): tag is string => typeof tag === "string")
			: [],
		topicCategories: Array.isArray(item.topicDetails?.topicCategories)
			? item.topicDetails.topicCategories.filter(
					(topic): topic is string => typeof topic === "string",
				)
			: [],
		rawMetadata: {
			source: "youtube_data_api",
			snippet: item.snippet ?? null,
			contentDetails: item.contentDetails ?? null,
			topicDetails: item.topicDetails ?? null,
		},
	};
}

export async function fetchYouTubeOEmbedMetadata(canonicalUrl: string) {
	const response = await fetch(
		`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
			canonicalUrl,
		)}`,
	);

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as {
		title?: unknown;
		author_name?: unknown;
		author_url?: unknown;
		thumbnail_url?: unknown;
	};

	return {
		title: typeof data.title === "string" ? data.title : null,
		description: null,
		channelName: typeof data.author_name === "string" ? data.author_name : null,
		channelUrl: typeof data.author_url === "string" ? data.author_url : null,
		thumbnailUrl:
			typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
		durationSeconds: null,
		categoryId: null,
		tags: [],
		topicCategories: [],
		rawMetadata: {
			source: "youtube_oembed",
			...data,
		},
	};
}

export function transcriptSegmentsToText(
	segments: TranscriptSegment[],
	options?: {
		policy?: ChapterGenerationPolicy;
		durationSeconds?: number | null;
	},
) {
	const selectedSegments =
		options?.policy?.transcriptMode === "sampled_windows"
			? sampleTranscriptSegmentsAcrossDuration(
					segments,
					options.durationSeconds,
				)
			: segments;
	const text = selectedSegments
		.map((segment) => `[${segment.startSeconds}s] ${segment.text}`)
		.join("\n");

	return text.slice(0, options?.policy?.transcriptCharacterLimit ?? 120_000);
}

export function sampleTranscriptSegmentsAcrossDuration(
	segments: TranscriptSegment[],
	durationSeconds?: number | null,
	maxSegments = 360,
) {
	if (segments.length <= maxSegments) {
		return segments;
	}

	const duration =
		durationSeconds && durationSeconds > 0
			? durationSeconds
			: (segments.at(-1)?.startSeconds ?? 0);
	const windowCount = 5;
	const segmentsPerWindow = Math.max(1, Math.floor(maxSegments / windowCount));
	const sampled = new Map<number, TranscriptSegment>();

	for (let index = 0; index < windowCount; index += 1) {
		const center =
			index === 0
				? 0
				: index === windowCount - 1
					? duration
					: (duration * index) / (windowCount - 1);
		const nearestIndex = findNearestSegmentIndex(segments, center);
		const startIndex =
			index === 0
				? 0
				: index === windowCount - 1
					? Math.max(0, segments.length - segmentsPerWindow)
					: Math.max(0, nearestIndex - Math.floor(segmentsPerWindow / 2));

		for (
			let segmentIndex = startIndex;
			segmentIndex < Math.min(segments.length, startIndex + segmentsPerWindow);
			segmentIndex += 1
		) {
			sampled.set(segmentIndex, segments[segmentIndex]);
		}
	}

	return [...sampled.entries()]
		.sort(([left], [right]) => left - right)
		.map(([, segment]) => segment);
}

export function parseYouTubeDuration(duration: string): number | null {
	const match = duration.match(
		/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/,
	);

	if (!match) {
		return null;
	}

	const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match;

	return (
		Number.parseInt(days, 10) * 86_400 +
		Number.parseInt(hours, 10) * 3_600 +
		Number.parseInt(minutes, 10) * 60 +
		Number.parseInt(seconds, 10)
	);
}

type TranscriptTimeUnit = "seconds" | "milliseconds";

function inferLocalTranscriptTimeUnit(
	transcript: Awaited<ReturnType<typeof fetchTranscript>>,
): TranscriptTimeUnit {
	return transcript.some((segment) => segment.duration > 100)
		? "milliseconds"
		: "seconds";
}

function normalizeTranscriptTime(value: number, unit: TranscriptTimeUnit) {
	const seconds = unit === "milliseconds" ? value / 1000 : value;
	return Math.max(0, Math.round(seconds));
}

function normalizeYouTubeTranscriptProvider(
	value: string | undefined,
): YouTubeTranscriptProvider {
	const normalized = value?.trim().toLowerCase();

	if (normalized === "local" || normalized === "transcriptapi") {
		return normalized;
	}

	return "auto";
}

function getTranscriptApiUrl(providerVideoId: string) {
	const url = new URL(`${TRANSCRIPTAPI_BASE_URL}/youtube/transcript`);

	url.searchParams.set("video_url", providerVideoId);
	url.searchParams.set("format", "json");
	url.searchParams.set("include_timestamp", "true");

	return url;
}

function isTranscriptApiRetryableStatus(status: number) {
	return status === 408 || status === 429 || status === 503;
}

function getTranscriptApiFailureCode(
	status: number,
): YouTubeTranscriptFailureCode {
	switch (status) {
		case 401:
			return "configuration";
		case 402:
			return "payment_required";
		case 404:
			return "not_available";
		case 429:
			return "too_many_requests";
		case 408:
		case 503:
			return "provider_unavailable";
		default:
			return "unknown";
	}
}

function getTranscriptApiRetryDelayMs(response: Response, attempt: number) {
	if (response.status === 429) {
		return Math.min(
			parseRetryAfterMs(response.headers.get("Retry-After")) ??
				getTranscriptApiBackoffMs(attempt),
			TRANSCRIPTAPI_RETRY_AFTER_CAP_MS,
		);
	}

	return getTranscriptApiBackoffMs(attempt);
}

function getTranscriptApiBackoffMs(attempt: number) {
	return (attempt + 1) * 1_000;
}

function parseRetryAfterMs(value: string | null) {
	if (!value) {
		return null;
	}

	const retryAfterSeconds = Number.parseFloat(value);

	if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
		return retryAfterSeconds * 1_000;
	}

	const retryAfterDate = Date.parse(value);

	if (Number.isFinite(retryAfterDate)) {
		return Math.max(0, retryAfterDate - Date.now());
	}

	return null;
}

function sleep(milliseconds: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}

function getYouTubeTranscriptFailureCode(
	error: unknown,
): YouTubeTranscriptFailureCode {
	if (error instanceof YoutubeTranscriptTooManyRequestError) {
		return "too_many_requests";
	}

	if (error instanceof YoutubeTranscriptVideoUnavailableError) {
		return "unavailable";
	}

	if (error instanceof YoutubeTranscriptDisabledError) {
		return "disabled";
	}

	if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
		return "language_unavailable";
	}

	if (error instanceof YoutubeTranscriptNotAvailableError) {
		return "not_available";
	}

	return "unknown";
}

function getYouTubeTranscriptFailureMessage(
	providerVideoId: string,
	code: YouTubeTranscriptFailureCode,
) {
	switch (code) {
		case "configuration":
			return `YouTube transcript provider is not configured for ${providerVideoId}.`;
		case "too_many_requests":
			return `YouTube transcript request was throttled for ${providerVideoId}.`;
		case "payment_required":
			return `YouTube transcript provider requires payment for ${providerVideoId}.`;
		case "provider_unavailable":
			return `YouTube transcript provider is unavailable for ${providerVideoId}.`;
		case "unavailable":
			return `YouTube video is unavailable for transcript fetch ${providerVideoId}.`;
		case "disabled":
			return `YouTube transcripts are disabled for ${providerVideoId}.`;
		case "language_unavailable":
			return `Requested YouTube transcript language is unavailable for ${providerVideoId}.`;
		case "not_available":
			return `YouTube transcript is not available for ${providerVideoId}.`;
		case "empty":
			return `YouTube transcript response was empty for ${providerVideoId}.`;
		case "unknown":
			return `YouTube transcript fetch failed for ${providerVideoId}.`;
	}
}

function getRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function findNearestSegmentIndex(
	segments: TranscriptSegment[],
	targetSeconds: number,
) {
	let nearestIndex = 0;
	let nearestDistance = Number.POSITIVE_INFINITY;

	for (const [index, segment] of segments.entries()) {
		const distance = Math.abs(segment.startSeconds - targetSeconds);

		if (distance < nearestDistance) {
			nearestIndex = index;
			nearestDistance = distance;
		}
	}

	return nearestIndex;
}

function getBestThumbnailUrl(
	thumbnails: Record<string, { url?: unknown } | undefined> | undefined,
) {
	const thumbnail =
		thumbnails?.maxres ??
		thumbnails?.standard ??
		thumbnails?.high ??
		thumbnails?.medium ??
		thumbnails?.default;

	return typeof thumbnail?.url === "string" ? thumbnail.url : null;
}
