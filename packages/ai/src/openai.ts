import {
	type AiGeneratedCourseV1,
	aiGeneratedCourseV1Schema,
	DEFAULT_OPENAI_GENERATION_MODEL,
	getChapterGenerationPolicy,
	type ChapterGenerationPolicy,
	validateGeneratedChapterRanges,
} from "@benkyou/core";
import OpenAI from "openai";

const chapterSchema = {
	type: "object",
	additionalProperties: false,
	required: ["title", "summary", "startSeconds", "endSeconds"],
	properties: {
		title: { type: "string" },
		summary: { type: "string" },
		startSeconds: { type: "integer", minimum: 0 },
		endSeconds: {
			anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }],
		},
	},
} as const;

const courseSchema = {
	type: "object",
	additionalProperties: false,
	required: ["title", "description", "chapters"],
	properties: {
		title: { type: "string" },
		description: { type: "string" },
		chapters: {
			type: "array",
			minItems: 1,
			items: chapterSchema,
		},
	},
} as const;

export interface GenerateChaptersInput {
	videoTitle: string | null;
	canonicalUrl?: string;
	transcriptText: string;
	durationSeconds?: number | null;
	transcriptSegmentCount?: number;
	policy?: ChapterGenerationPolicy;
	model?: string;
}

export async function generateCourseChapters(
	input: GenerateChaptersInput,
): Promise<AiGeneratedCourseV1> {
	if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "openai") {
		throw new Error("Only AI_PROVIDER=openai is supported for Phase 3.");
	}

	const apiKey = process.env.AI_API_KEY;

	if (!apiKey) {
		throw new Error("AI_API_KEY is required for course generation.");
	}

	const client = new OpenAI({ apiKey });
	const policy =
		input.policy ??
		getChapterGenerationPolicy(
			input.durationSeconds,
			input.transcriptSegmentCount ?? 0,
		);
	const response = await client.responses.create({
		model:
			input.model ||
			process.env.OPENAI_MODEL ||
			DEFAULT_OPENAI_GENERATION_MODEL,
		input: [
			{
				role: "system",
				content:
					"You convert YouTube transcripts into concise course outlines for serious learners. Return only the requested structured data.",
			},
			{
				role: "user",
				content: [
					`Video title: ${input.videoTitle || "Untitled YouTube video"}`,
					input.canonicalUrl ? `Video URL: ${input.canonicalUrl}` : "",
					input.durationSeconds
						? `Video duration: ${input.durationSeconds} seconds`
						: "Video duration: unknown",
					"",
					`Create a duration-aware course outline with about ${policy.targetChaptersLabel} chapters.`,
					"Do not use a fixed chapter count.",
					"Choose chapter boundaries from real transcript timestamps.",
					"Prefer meaningful topic shifts over equal time slices.",
					policy.isCoarseFallback
						? "For this very long video, create a high-level course map, not dense subchapters."
						: "",
					"Never invent timestamps outside the transcript or duration range.",
					"Keep titles clear and summaries useful for study. Use transcript timestamps for startSeconds and endSeconds. The final chapter endSeconds may be null if the transcript does not provide a clean end.",
					"",
					"Transcript:",
					input.transcriptText.slice(0, policy.transcriptCharacterLimit),
				].join("\n"),
			},
		],
		text: {
			format: {
				type: "json_schema",
				name: "benkyou_course_generation_v1",
				strict: true,
				schema: courseSchema,
			},
		},
	});

	const generated = aiGeneratedCourseV1Schema.parse(
		JSON.parse(response.output_text),
	);

	if (
		!validateGeneratedChapterRanges(generated.chapters, input.durationSeconds)
	) {
		throw new Error("AI generated chapter ranges were invalid.");
	}

	return generated;
}
