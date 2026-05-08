import type { ParsedVideoUrl } from "@benkyou/types";

export type ParseVideoUrlError =
	| "empty"
	| "invalid_url"
	| "unsupported_provider"
	| "missing_video_id";

export type ParseVideoUrlResult =
	| { ok: true; value: ParsedVideoUrl }
	| { ok: false; error: ParseVideoUrlError };

const YOUTUBE_HOSTS = new Set([
	"youtube.com",
	"www.youtube.com",
	"m.youtube.com",
	"music.youtube.com",
	"youtube-nocookie.com",
	"www.youtube-nocookie.com",
]);

const YOUTUBE_SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

export function parseVideoUrl(input: string): ParseVideoUrlResult {
	const trimmedInput = input.trim();

	if (!trimmedInput) {
		return { ok: false, error: "empty" };
	}

	let url: URL;

	try {
		url = new URL(trimmedInput);
	} catch {
		return { ok: false, error: "invalid_url" };
	}

	const hostname = url.hostname.toLowerCase();

	if (!YOUTUBE_HOSTS.has(hostname) && !YOUTUBE_SHORT_HOSTS.has(hostname)) {
		return { ok: false, error: "unsupported_provider" };
	}

	const providerVideoId = extractYouTubeVideoId(url);

	if (!providerVideoId) {
		return { ok: false, error: "missing_video_id" };
	}

	return {
		ok: true,
		value: {
			provider: "youtube",
			providerVideoId,
			canonicalUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
		},
	};
}

export function extractYouTubeVideoId(url: URL) {
	const hostname = url.hostname.toLowerCase();

	if (YOUTUBE_SHORT_HOSTS.has(hostname)) {
		return cleanVideoId(url.pathname.split("/").filter(Boolean)[0]);
	}

	if (url.pathname === "/watch") {
		return cleanVideoId(url.searchParams.get("v"));
	}

	const [route, videoId] = url.pathname.split("/").filter(Boolean);

	if (route === "embed" || route === "shorts") {
		return cleanVideoId(videoId);
	}

	return null;
}

function cleanVideoId(value: string | null | undefined) {
	if (!value) {
		return null;
	}

	const candidate = value.trim();

	if (!/^[a-zA-Z0-9_-]{6,}$/.test(candidate)) {
		return null;
	}

	return candidate;
}
