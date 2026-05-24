import type {
	CancelGenerationJobRequestV1,
	CourseGenerationJobDTO,
	EducationalSuitabilityResultV1,
	GenerationJobDetailV1,
	GenerationTimelineStepStatusV1,
	GenerationTimelineStepV1,
	ProcessGenerationJobRequestV1,
	RetryGenerationJobRequestV1,
} from "@benkyou/types";
import { z } from "zod";

export const DEFAULT_OPENAI_GENERATION_MODEL = "gpt-5-mini";
export const GENERATION_JOB_TIMEOUT_MS = 10 * 60 * 1000;

export const createCourseFromUrlRequestV1Schema = z.object({
	url: z.string().trim().min(1, "Enter a YouTube URL."),
});

export const generationJobIdRequestV1Schema = z.object({
	generationJobId: z.uuid("Generation job id is invalid."),
});

export const processGenerationJobRequestV1Schema =
	generationJobIdRequestV1Schema satisfies z.ZodType<ProcessGenerationJobRequestV1>;

export const retryGenerationJobRequestV1Schema =
	generationJobIdRequestV1Schema satisfies z.ZodType<RetryGenerationJobRequestV1>;

export const cancelGenerationJobRequestV1Schema =
	generationJobIdRequestV1Schema satisfies z.ZodType<CancelGenerationJobRequestV1>;

export const aiGeneratedChapterV1Schema = z.object({
	title: z.string().trim().min(1, "Chapter title is required."),
	summary: z.string().trim().min(1, "Chapter summary is required."),
	startSeconds: z.number().int().nonnegative(),
	endSeconds: z.number().int().positive().nullable(),
});

export const aiGeneratedCourseV1Schema = z
	.object({
		title: z.string().trim().min(1).max(160),
		description: z.string().trim().max(500),
		chapters: z.array(aiGeneratedChapterV1Schema).min(1),
	})
	.superRefine((value, context) => {
		for (const [index, chapter] of value.chapters.entries()) {
			if (
				chapter.endSeconds !== null &&
				chapter.endSeconds <= chapter.startSeconds
			) {
				context.addIssue({
					code: "custom",
					path: ["chapters", index, "endSeconds"],
					message: "Chapter end time must be after the start time.",
				});
			}

			const previousChapter = value.chapters[index - 1];
			if (
				previousChapter?.endSeconds !== null &&
				previousChapter?.endSeconds !== undefined &&
				chapter.startSeconds < previousChapter.endSeconds
			) {
				context.addIssue({
					code: "custom",
					path: ["chapters", index, "startSeconds"],
					message: "Chapters must be ordered and non-overlapping.",
				});
			}
		}
	});

export type AiGeneratedCourseV1 = z.infer<typeof aiGeneratedCourseV1Schema>;
export type AiGeneratedChapterV1 = z.infer<typeof aiGeneratedChapterV1Schema>;

export const EDUCATIONAL_SUITABILITY_REJECTION_MESSAGE =
	"This video does not look like educational content, so Benkyou cannot turn it into a course.";

export const educationalSuitabilityResultV1Schema = z.object({
	verdict: z.enum(["educational", "non_educational", "ambiguous"]),
	confidence: z.number().min(0).max(1),
	reason: z.string().trim().min(1).max(500),
	contentType: z.string().trim().min(1).max(120),
	evidence: z.array(z.string().trim().min(1).max(160)).max(8),
}) satisfies z.ZodType<EducationalSuitabilityResultV1>;

export function isEducationalSuitabilityAllowed(
	result: EducationalSuitabilityResultV1,
) {
	return result.verdict === "educational";
}

export interface ParsedCreatorChapter {
	title: string;
	startSeconds: number;
	endSeconds: number | null;
}

export interface ChapterGenerationPolicy {
	minChapters: number;
	maxChapters: number;
	targetChaptersLabel: string;
	isCoarseFallback: boolean;
	transcriptMode: "full_window" | "sampled_windows";
	transcriptCharacterLimit: number;
}

const NORMAL_TRANSCRIPT_CHARACTER_LIMIT = 120_000;
const LONG_VIDEO_TRANSCRIPT_CHARACTER_LIMIT = 120_000;
const ELEVEN_HOURS_SECONDS = 11 * 60 * 60;

export function parseYouTubeDescriptionChapters(
	description: string | null | undefined,
	durationSeconds?: number | null,
): ParsedCreatorChapter[] {
	if (!description) {
		return [];
	}

	const chapters: Array<Omit<ParsedCreatorChapter, "endSeconds">> = [];

	for (const line of description.split(/\r?\n/)) {
		const parsed = parseDescriptionChapterLine(line);

		if (!parsed) {
			continue;
		}

		if (
			durationSeconds !== null &&
			durationSeconds !== undefined &&
			parsed.startSeconds >= durationSeconds
		) {
			continue;
		}

		const previous = chapters.at(-1);
		if (previous && parsed.startSeconds <= previous.startSeconds) {
			continue;
		}

		chapters.push(parsed);
	}

	if (chapters.length < 2) {
		return [];
	}

	return chapters.map((chapter, index) => ({
		...chapter,
		endSeconds:
			chapters[index + 1]?.startSeconds ??
			(durationSeconds !== undefined ? durationSeconds : null),
	}));
}

export function getChapterGenerationPolicy(
	durationSeconds: number | null | undefined,
	transcriptSegmentCount: number,
): ChapterGenerationPolicy {
	const duration = durationSeconds ?? 0;
	const isCoarseFallback = duration >= ELEVEN_HOURS_SECONDS;
	const transcriptCharacterLimit =
		isCoarseFallback && transcriptSegmentCount > 0
			? LONG_VIDEO_TRANSCRIPT_CHARACTER_LIMIT
			: NORMAL_TRANSCRIPT_CHARACTER_LIMIT;

	if (duration > 0 && duration < 10 * 60) {
		return {
			minChapters: 3,
			maxChapters: 5,
			targetChaptersLabel: "3-5",
			isCoarseFallback,
			transcriptMode: "full_window",
			transcriptCharacterLimit,
		};
	}

	if (duration < 30 * 60) {
		return {
			minChapters: 5,
			maxChapters: 8,
			targetChaptersLabel: "5-8",
			isCoarseFallback,
			transcriptMode: "full_window",
			transcriptCharacterLimit,
		};
	}

	if (duration < 60 * 60) {
		return {
			minChapters: 8,
			maxChapters: 12,
			targetChaptersLabel: "8-12",
			isCoarseFallback,
			transcriptMode: "full_window",
			transcriptCharacterLimit,
		};
	}

	if (duration < 2 * 60 * 60) {
		return {
			minChapters: 12,
			maxChapters: 18,
			targetChaptersLabel: "12-18",
			isCoarseFallback,
			transcriptMode: "full_window",
			transcriptCharacterLimit,
		};
	}

	if (duration < ELEVEN_HOURS_SECONDS) {
		return {
			minChapters: 18,
			maxChapters: 35,
			targetChaptersLabel: "18-35",
			isCoarseFallback,
			transcriptMode: "full_window",
			transcriptCharacterLimit,
		};
	}

	return {
		minChapters: 12,
		maxChapters: 25,
		targetChaptersLabel: "12-25",
		isCoarseFallback: true,
		transcriptMode: "sampled_windows",
		transcriptCharacterLimit,
	};
}

export function validateGeneratedChapterRanges(
	chapters: Array<{
		startSeconds: number;
		endSeconds?: number | null;
	}>,
	durationSeconds?: number | null,
): boolean {
	if (chapters.length === 0) {
		return false;
	}

	for (const [index, chapter] of chapters.entries()) {
		if (!Number.isInteger(chapter.startSeconds) || chapter.startSeconds < 0) {
			return false;
		}

		if (
			durationSeconds !== null &&
			durationSeconds !== undefined &&
			chapter.startSeconds >= durationSeconds
		) {
			return false;
		}

		if (chapter.endSeconds !== null && chapter.endSeconds !== undefined) {
			if (
				!Number.isInteger(chapter.endSeconds) ||
				chapter.endSeconds <= chapter.startSeconds
			) {
				return false;
			}

			if (
				durationSeconds !== null &&
				durationSeconds !== undefined &&
				chapter.endSeconds > durationSeconds
			) {
				return false;
			}
		}

		const previous = chapters[index - 1];
		if (!previous) {
			continue;
		}

		if (chapter.startSeconds < previous.startSeconds) {
			return false;
		}

		if (
			previous.endSeconds !== null &&
			previous.endSeconds !== undefined &&
			chapter.startSeconds < previous.endSeconds
		) {
			return false;
		}
	}

	return true;
}

function parseDescriptionChapterLine(
	line: string,
): Omit<ParsedCreatorChapter, "endSeconds"> | null {
	const match = line.match(
		/^\s*(?:[-*]\s*)?(?:\d+[.)]\s*)?(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:[-|:]\s*)?(.+?)\s*$/,
	);

	if (!match) {
		return null;
	}

	const startSeconds = parseTimestamp(match[1]);
	const title = match[2]?.trim();

	if (startSeconds === null || !title) {
		return null;
	}

	return { title, startSeconds };
}

function parseTimestamp(timestamp: string): number | null {
	const parts = timestamp.split(":").map((part) => Number.parseInt(part, 10));

	if (
		parts.some((part) => Number.isNaN(part)) ||
		parts.length < 2 ||
		parts.length > 3
	) {
		return null;
	}

	const [hours, minutes, seconds] =
		parts.length === 3 ? parts : [0, parts[0], parts[1]];

	if (minutes >= 60 || seconds >= 60) {
		return null;
	}

	return hours * 3600 + minutes * 60 + seconds;
}

export function buildGenerationTimeline(
	job: CourseGenerationJobDTO,
	chapterCount: number,
): GenerationTimelineStepV1[] {
	const metadataReady = Boolean(job.metadataCompletedAt);
	const transcriptReady = Boolean(
		job.transcriptCompletedAt || job.transcriptSource,
	);
	const chaptersReady = Boolean(
		job.chaptersCompletedAt || (job.status === "completed" && chapterCount > 0),
	);
	const playerReady = Boolean(
		job.playerCompletedAt || job.status === "completed",
	);
	const transcriptSkipped = chaptersReady && !transcriptReady;
	const completed = job.status === "completed";
	const failed = job.status === "failed" || job.status === "cancelled";
	const processing = job.status === "processing";
	const failedStep = failed
		? getFailedTimelineStep({
				metadataReady,
				transcriptReady,
				transcriptSkipped,
				chaptersReady,
				playerReady,
			})
		: null;

	return [
		{
			key: "metadata",
			label: "Video metadata",
			status: getStepStatus({
				completed: metadataReady || processing || completed || failed,
				failed: failedStep === "metadata",
				processing: job.status === "queued" && !metadataReady,
			}),
			description:
				"Read the source details and prepare a private study workspace shell.",
		},
		{
			key: "transcript",
			label: "Captions",
			status: getStepStatus({
				completed: transcriptReady,
				failed: failedStep === "transcript",
				processing:
					processing && metadataReady && !transcriptReady && !chaptersReady,
				skipped: transcriptSkipped,
			}),
			description: "Extract YouTube captions for chapter generation.",
		},
		{
			key: "chapters",
			label: "Chapter outline",
			status: getStepStatus({
				completed: chaptersReady,
				failed: failedStep === "chapters",
				processing:
					processing &&
					(transcriptReady || transcriptSkipped) &&
					!chaptersReady,
			}),
			description: "Generate and validate the chapter outline.",
		},
		{
			key: "player",
			label: "Player prep",
			status: getStepStatus({
				completed: playerReady,
				failed: failedStep === "player",
				processing: processing && chaptersReady && !playerReady,
			}),
			description: "Save chapters so the study workspace can open.",
		},
	];
}

export function toGenerationJobDetail(
	input: Omit<
		GenerationJobDetailV1,
		"timeline" | "canRetry" | "canOpenCourse" | "canCancel"
	>,
): GenerationJobDetailV1 {
	const active =
		input.job.status === "queued" || input.job.status === "processing";

	return {
		...input,
		timeline: buildGenerationTimeline(input.job, input.chapterCount),
		canRetry:
			(input.job.status === "failed" || input.job.status === "cancelled") &&
			input.job.retryable,
		canOpenCourse: input.job.status === "completed" && input.chapterCount > 0,
		canCancel: active,
	};
}

function getStepStatus({
	completed,
	failed,
	processing,
	skipped,
}: {
	completed: boolean;
	failed: boolean;
	processing: boolean;
	skipped?: boolean;
}): GenerationTimelineStepStatusV1 {
	if (failed) {
		return "failed";
	}

	if (completed) {
		return "completed";
	}

	if (processing) {
		return "processing";
	}

	if (skipped) {
		return "skipped";
	}

	return "pending";
}

function getFailedTimelineStep({
	metadataReady,
	transcriptReady,
	transcriptSkipped,
	chaptersReady,
	playerReady,
}: {
	metadataReady: boolean;
	transcriptReady: boolean;
	transcriptSkipped: boolean;
	chaptersReady: boolean;
	playerReady: boolean;
}) {
	if (!metadataReady) {
		return "metadata";
	}

	if (!transcriptReady && !transcriptSkipped) {
		return "transcript";
	}

	if (!chaptersReady) {
		return "chapters";
	}

	if (!playerReady) {
		return "player";
	}

	return null;
}
