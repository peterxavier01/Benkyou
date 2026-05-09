import { fetchTranscript } from "youtube-transcript";

export interface TranscriptSegment {
	text: string;
	startSeconds: number;
	durationSeconds: number;
}

export async function fetchYouTubeTranscript(
	providerVideoId: string,
): Promise<TranscriptSegment[]> {
	const transcript = await fetchTranscript(providerVideoId);

	return transcript
		.map((segment) => ({
			text: segment.text.trim(),
			startSeconds: normalizeTranscriptSeconds(segment.offset),
			durationSeconds: normalizeTranscriptSeconds(segment.duration),
		}))
		.filter((segment) => segment.text.length > 0);
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
		channelName: typeof data.author_name === "string" ? data.author_name : null,
		channelUrl: typeof data.author_url === "string" ? data.author_url : null,
		thumbnailUrl:
			typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
	};
}

export function transcriptSegmentsToText(segments: TranscriptSegment[]) {
	return segments
		.map((segment) => `[${segment.startSeconds}s] ${segment.text}`)
		.join("\n");
}

function normalizeTranscriptSeconds(value: number) {
	const seconds = value > 1000 ? value / 1000 : value;

	return Math.max(0, Math.round(seconds));
}
