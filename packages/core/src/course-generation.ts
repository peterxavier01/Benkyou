import type {
	CourseGenerationJobDTO,
	GenerationJobDetailV1,
	GenerationTimelineStepStatusV1,
	GenerationTimelineStepV1,
	ProcessGenerationJobRequestV1,
	RetryGenerationJobRequestV1,
} from "@benkyou/types";
import { z } from "zod";

export const DEFAULT_OPENAI_GENERATION_MODEL = "gpt-5-mini";

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

export function buildGenerationTimeline(
	job: CourseGenerationJobDTO,
	chapterCount: number,
): GenerationTimelineStepV1[] {
	const transcriptReady = Boolean(job.transcriptSource);
	const completed = job.status === "completed";
	const failed = job.status === "failed";
	const processing = job.status === "processing";

	return [
		{
			key: "metadata",
			label: "Video metadata",
			status: getStepStatus({
				completed: processing || completed || failed || transcriptReady,
				failed: false,
				processing: job.status === "queued",
			}),
			description:
				"Read the source details and prepare a private course shell.",
		},
		{
			key: "transcript",
			label: "Captions",
			status: getStepStatus({
				completed: transcriptReady || completed,
				failed: failed && !transcriptReady,
				processing,
			}),
			description: "Extract YouTube captions for chapter generation.",
		},
		{
			key: "chapters",
			label: "Chapter outline",
			status: getStepStatus({
				completed: completed && chapterCount > 0,
				failed: failed && transcriptReady && chapterCount === 0,
				processing,
			}),
			description: "Generate and validate the structured course outline.",
		},
		{
			key: "player",
			label: "Player prep",
			status: getStepStatus({
				completed,
				failed,
				processing: false,
			}),
			description: "Save chapters so the course can open in the player.",
		},
	];
}

export function toGenerationJobDetail(
	input: Omit<GenerationJobDetailV1, "timeline" | "canRetry" | "canOpenCourse">,
): GenerationJobDetailV1 {
	return {
		...input,
		timeline: buildGenerationTimeline(input.job, input.chapterCount),
		canRetry: input.job.status === "failed" && input.job.retryable,
		canOpenCourse: input.job.status === "completed" && input.chapterCount > 0,
	};
}

function getStepStatus({
	completed,
	failed,
	processing,
}: {
	completed: boolean;
	failed: boolean;
	processing: boolean;
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

	return "pending";
}
