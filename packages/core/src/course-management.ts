import type {
	RegenerateChaptersRequestV1,
	UpdateChapterRequestV1,
	UpdateCourseMetadataRequestV1,
} from "@benkyou/types";
import { z } from "zod";
import {
	MAX_CHAPTER_SUMMARY_LENGTH,
	MAX_CHAPTER_TITLE_LENGTH,
	MAX_COURSE_DESCRIPTION_LENGTH,
	MAX_COURSE_TITLE_LENGTH,
} from "./constants";
import { courseIdRequestV1Schema } from "./course-workspace";

const trimmedRequiredString = (label: string, maxLength: number) =>
	z
		.string()
		.trim()
		.min(1, `${label} is required.`)
		.max(maxLength, `${label} is too long.`);

const trimmedOptionalString = (label: string, maxLength: number) =>
	z
		.string()
		.trim()
		.max(maxLength, `${label} is too long.`)
		.transform((value) => (value.length > 0 ? value : null))
		.nullish();

export const getCourseManagementDataRequestV1Schema = courseIdRequestV1Schema;

export const updateCourseMetadataRequestV1Schema = z.object({
	courseId: z.uuid("Course id is invalid."),
	title: trimmedRequiredString("Course title", MAX_COURSE_TITLE_LENGTH),
	description: trimmedOptionalString(
		"Course description",
		MAX_COURSE_DESCRIPTION_LENGTH,
	),
}) satisfies z.ZodType<UpdateCourseMetadataRequestV1>;

export const updateChapterRequestV1Schema = z
	.object({
		chapterId: z.uuid("Chapter id is invalid."),
		title: trimmedRequiredString("Chapter title", MAX_CHAPTER_TITLE_LENGTH),
		summary: trimmedOptionalString(
			"Chapter summary",
			MAX_CHAPTER_SUMMARY_LENGTH,
		),
		startSeconds: z.number().int().nonnegative(),
		endSeconds: z.number().int().positive().nullish(),
	})
	.refine(
		(value) =>
			value.endSeconds === null ||
			value.endSeconds === undefined ||
			value.endSeconds > value.startSeconds,
		{
			message: "End time must be after start time.",
			path: ["endSeconds"],
		},
	) satisfies z.ZodType<UpdateChapterRequestV1>;

export const regenerateChaptersRequestV1Schema =
	courseIdRequestV1Schema satisfies z.ZodType<RegenerateChaptersRequestV1>;

export interface ChapterTimeRangeInput {
	chapterId: string;
	startSeconds: number;
	endSeconds: number | null;
}

export interface ValidateChapterTimeRangeInput {
	chapterId: string;
	startSeconds: number;
	endSeconds: number | null;
	chapters: ChapterTimeRangeInput[];
	videoDurationSeconds?: number | null;
}

export function validateChapterTimeRange(input: ValidateChapterTimeRangeInput) {
	if (input.endSeconds !== null && input.endSeconds <= input.startSeconds) {
		return {
			ok: false as const,
			message: "End time must be after start time.",
		};
	}

	if (
		input.videoDurationSeconds !== null &&
		input.videoDurationSeconds !== undefined &&
		input.startSeconds >= input.videoDurationSeconds
	) {
		return {
			ok: false as const,
			message: "Start time must be before the video ends.",
		};
	}

	if (
		input.videoDurationSeconds !== null &&
		input.videoDurationSeconds !== undefined &&
		input.endSeconds !== null &&
		input.endSeconds > input.videoDurationSeconds
	) {
		return {
			ok: false as const,
			message: "End time cannot be after the video duration.",
		};
	}

	const nextRanges = input.chapters
		.map((chapter) =>
			chapter.chapterId === input.chapterId
				? {
						...chapter,
						startSeconds: input.startSeconds,
						endSeconds: input.endSeconds,
					}
				: chapter,
		)
		.sort((first, second) => first.startSeconds - second.startSeconds);

	for (const [index, chapter] of nextRanges.entries()) {
		const previous = nextRanges[index - 1];

		if (!previous) {
			continue;
		}

		const previousEnd = previous.endSeconds ?? chapter.startSeconds;

		if (chapter.startSeconds < previousEnd) {
			return {
				ok: false as const,
				message: "Chapter times cannot overlap.",
			};
		}
	}

	return { ok: true as const };
}
