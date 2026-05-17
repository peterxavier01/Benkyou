import type { ChapterGenerationPolicy } from "@benkyou/core";
import {
	fetchTranscript,
	YoutubeTranscriptDisabledError,
	YoutubeTranscriptNotAvailableError,
	YoutubeTranscriptNotAvailableLanguageError,
	YoutubeTranscriptTooManyRequestError,
	YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript";

export interface TranscriptSegment {
	text: string;
	startSeconds: number;
	durationSeconds: number;
}

export type YouTubeTranscriptFailureCode =
	| "disabled"
	| "empty"
	| "language_unavailable"
	| "not_available"
	| "too_many_requests"
	| "unavailable"
	| "unknown";

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
): Promise<TranscriptSegment[]> {
	let transcript: Awaited<ReturnType<typeof fetchTranscript>>;

	try {
		transcript = await fetchTranscript(providerVideoId);
	} catch (error) {
		throw new YouTubeTranscriptFetchError(
			providerVideoId,
			getYouTubeTranscriptFailureCode(error),
			error,
		);
	}

	const segments = transcript
		.map((segment) => ({
			text: segment.text.trim(),
			startSeconds: normalizeTranscriptSeconds(segment.offset),
			durationSeconds: normalizeTranscriptSeconds(segment.duration),
		}))
		.filter((segment) => segment.text.length > 0);

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

function normalizeTranscriptSeconds(value: number) {
	const seconds = value > 1000 ? value / 1000 : value;

	return Math.max(0, Math.round(seconds));
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
		case "too_many_requests":
			return `YouTube transcript request was throttled for ${providerVideoId}.`;
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
