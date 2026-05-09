import assert from "node:assert/strict";
import test from "node:test";

import { parseVideoUrl } from "./video-url";

test("parseVideoUrl supports YouTube watch URLs", () => {
	const result = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

	assert.equal(result.ok, true);
	assert.deepEqual(result.ok ? result.value : null, {
		provider: "youtube",
		providerVideoId: "dQw4w9WgXcQ",
		canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
	});
});

test("parseVideoUrl supports youtu.be URLs", () => {
	const result = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ?t=42");

	assert.equal(result.ok, true);
	assert.equal(result.ok ? result.value.providerVideoId : null, "dQw4w9WgXcQ");
});

test("parseVideoUrl supports embed and shorts URLs", () => {
	const embed = parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
	const shorts = parseVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");

	assert.equal(embed.ok, true);
	assert.equal(shorts.ok, true);
});

test("parseVideoUrl rejects empty, malformed, unsupported, and missing ids", () => {
	assert.deepEqual(parseVideoUrl(""), { ok: false, error: "empty" });
	assert.deepEqual(parseVideoUrl("not a url"), {
		ok: false,
		error: "invalid_url",
	});
	assert.deepEqual(parseVideoUrl("https://vimeo.com/123"), {
		ok: false,
		error: "unsupported_provider",
	});
	assert.deepEqual(parseVideoUrl("https://www.youtube.com/watch"), {
		ok: false,
		error: "missing_video_id",
	});
});
