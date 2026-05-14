import {
	fetchYouTubeDataApiMetadata,
	fetchYouTubeOEmbedMetadata,
	fetchYouTubeTranscript,
	generateCourseChapters,
	transcriptSegmentsToText,
} from "@benkyou/ai";
import { getCurrentUserFromHeaders } from "@benkyou/auth/server";
import {
	cancelGenerationJobRequestV1Schema,
	createCourseFromUrlRequestV1Schema,
	GENERATION_JOB_TIMEOUT_MS,
	getChapterGenerationPolicy,
	getParseVideoUrlErrorMessage,
	parseVideoUrl,
	parseYouTubeDescriptionChapters,
	processGenerationJobRequestV1Schema,
	retryGenerationJobRequestV1Schema,
	toGenerationJobDetail,
} from "@benkyou/core";
import {
	cancelGenerationJob as cancelGenerationJobRecord,
	claimGenerationJob,
	completeGenerationJob,
	createCourseFromUrlRecord,
	createRetryGenerationJob,
	failGenerationJob,
	getGenerationJobDetailRecord,
	getSampleCourse,
	markGenerationJobTranscriptReady,
	timeoutGenerationJob,
} from "@benkyou/db";
import type {
	CancelGenerationJobResponseV1,
	CreateCourseFromUrlResponseV1,
	GenerationJobDetailV1,
	OpenSampleCourseResponseV1,
	ProcessGenerationJobResponseV1,
	RetryGenerationJobResponseV1,
} from "@benkyou/types";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const createCourseFromUrl = createServerFn({ method: "POST" })
	.inputValidator((input) => createCourseFromUrlRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<CreateCourseFromUrlResponseV1> => {
		const parsedUrl = parseVideoUrl(data.url);

		if (!parsedUrl.ok) {
			throw new Error(getParseVideoUrlErrorMessage(parsedUrl.error));
		}

		const metadata = await safeFetchMetadata(
			parsedUrl.value.providerVideoId,
			parsedUrl.value.canonicalUrl,
		);
		const ownerId = await getOptionalUserId();
		const result = await createCourseFromUrlRecord({
			ownerId,
			provider: parsedUrl.value.provider,
			providerVideoId: parsedUrl.value.providerVideoId,
			sourceUrl: data.url,
			canonicalUrl: parsedUrl.value.canonicalUrl,
			title:
				metadata?.title ?? `YouTube course ${parsedUrl.value.providerVideoId}`,
			channelName: metadata?.channelName,
			channelUrl: metadata?.channelUrl,
			thumbnailUrl:
				metadata?.thumbnailUrl ??
				`https://img.youtube.com/vi/${parsedUrl.value.providerVideoId}/hqdefault.jpg`,
			description: metadata?.description,
			durationSeconds: metadata?.durationSeconds,
			rawMetadata: metadata?.rawMetadata,
		});

		return {
			courseId: result.course.id,
			generationJobId: result.job.id,
			reusedExistingCourse: result.reusedExistingCourse,
		};
	});

export const getGenerationJob = createServerFn({ method: "POST" })
	.inputValidator((input) => processGenerationJobRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<GenerationJobDetailV1> => {
		await timeoutGenerationJob(data.generationJobId, GENERATION_JOB_TIMEOUT_MS);
		const detail = await getGenerationJobDetailRecord(data.generationJobId);

		if (!detail) {
			throw new Error("Generation job was not found.");
		}

		return toGenerationJobDetail(detail);
	});

export const processGenerationJob = createServerFn({ method: "POST" })
	.inputValidator((input) => processGenerationJobRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<ProcessGenerationJobResponseV1> => {
		const timedOut = await timeoutGenerationJob(
			data.generationJobId,
			GENERATION_JOB_TIMEOUT_MS,
		);

		if (timedOut) {
			return { detail: toGenerationJobDetail(timedOut) };
		}

		const claimed = await claimGenerationJob(data.generationJobId);

		if (!claimed) {
			return { detail: await getExistingDetail(data.generationJobId) };
		}

		try {
			const creatorChapters = parseYouTubeDescriptionChapters(
				claimed.video.description,
				claimed.video.durationSeconds,
			);

			if (creatorChapters.length > 0) {
				const completed = await completeGenerationJob({
					jobId: claimed.job.id,
					title: claimed.course.title,
					description: claimed.course.description,
					transcriptSource: null,
					durationSeconds: claimed.video.durationSeconds,
					rawOutput: {
						chapterSource: "creator_timestamps",
						chapterCount: creatorChapters.length,
					},
					chapters: creatorChapters.map((chapter, index) => ({
						title: chapter.title,
						summary: null,
						orderIndex: index,
						startSeconds: chapter.startSeconds,
						endSeconds: chapter.endSeconds,
					})),
				});

				if (!completed) {
					throw new Error("Generation job disappeared before completion.");
				}

				return { detail: toGenerationJobDetail(completed) };
			}

			const transcriptSegments = await fetchYouTubeTranscript(
				claimed.video.providerVideoId,
			);

			if (transcriptSegments.length === 0) {
				throw new RetryableGenerationError(
					"YouTube captions were not available for this video.",
				);
			}

			const lastTranscriptSegment = transcriptSegments.at(-1);
			const transcriptEndSeconds = lastTranscriptSegment
				? lastTranscriptSegment.startSeconds +
					lastTranscriptSegment.durationSeconds
				: null;
			const durationSeconds =
				claimed.video.durationSeconds ?? transcriptEndSeconds;
			const policy = getChapterGenerationPolicy(
				durationSeconds,
				transcriptSegments.length,
			);
			const transcriptText = transcriptSegmentsToText(transcriptSegments, {
				durationSeconds,
				policy,
			});
			await markGenerationJobTranscriptReady(claimed.job.id);

			const generated = await generateCourseChapters({
				videoTitle: claimed.video.title ?? claimed.course.title,
				canonicalUrl: claimed.video.canonicalUrl,
				transcriptText,
				durationSeconds,
				transcriptSegmentCount: transcriptSegments.length,
				policy,
			});
			const completed = await completeGenerationJob({
				jobId: claimed.job.id,
				title: generated.title,
				description: generated.description,
				transcriptSource: "youtube_captions",
				transcriptText,
				durationSeconds,
				rawOutput: {
					chapterSource: policy.isCoarseFallback
						? "ai_coarse_fallback"
						: "ai_generated",
					policy,
					generated,
				},
				chapters: generated.chapters.map((chapter, index) => ({
					title: chapter.title,
					summary: chapter.summary,
					orderIndex: index,
					startSeconds: chapter.startSeconds,
					endSeconds: chapter.endSeconds,
				})),
			});

			if (!completed) {
				throw new Error("Generation job disappeared before completion.");
			}

			return { detail: toGenerationJobDetail(completed) };
		} catch (error) {
			const failed = await failGenerationJob({
				jobId: claimed.job.id,
				failureReason: toUserSafeGenerationFailure(error),
				retryable: true,
				rawOutput: {
					message:
						error instanceof Error
							? error.message
							: "Unknown generation error.",
				},
			});

			if (!failed) {
				throw error;
			}

			return { detail: toGenerationJobDetail(failed) };
		}
	});

export const retryGenerationJob = createServerFn({ method: "POST" })
	.inputValidator((input) => retryGenerationJobRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<RetryGenerationJobResponseV1> => {
		const ownerId = await getOptionalUserId();
		const retry = await createRetryGenerationJob(data.generationJobId, ownerId);

		if (!retry) {
			throw new Error("This generation job cannot be retried.");
		}

		return {
			courseId: retry.course.id,
			generationJobId: retry.job.id,
		};
	});

export const cancelGenerationJob = createServerFn({ method: "POST" })
	.inputValidator((input) => cancelGenerationJobRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<CancelGenerationJobResponseV1> => {
		const ownerId = await getOptionalUserId();
		const cancelled = await cancelGenerationJobRecord(
			data.generationJobId,
			ownerId,
		);

		if (!cancelled) {
			throw new Error("This generation job cannot be cancelled.");
		}

		return { detail: toGenerationJobDetail(cancelled) };
	});

export const openSampleCourse = createServerFn({ method: "GET" }).handler(
	async (): Promise<OpenSampleCourseResponseV1> => {
		const sample = await getSampleCourse();

		if (!sample) {
			throw new Error("Sample course data has not been seeded yet.");
		}

		return { courseId: sample.id };
	},
);

async function getExistingDetail(
	jobId: string,
): Promise<GenerationJobDetailV1> {
	const detail = await getGenerationJobDetailRecord(jobId);

	if (!detail) {
		throw new Error("Generation job was not found.");
	}

	return toGenerationJobDetail(detail);
}

async function safeFetchMetadata(
	providerVideoId: string,
	canonicalUrl: string,
) {
	let dataApiMetadata: Awaited<ReturnType<typeof fetchYouTubeDataApiMetadata>> =
		null;

	try {
		dataApiMetadata = await fetchYouTubeDataApiMetadata(providerVideoId);
	} catch {
		dataApiMetadata = null;
	}

	if (dataApiMetadata) {
		return dataApiMetadata;
	}

	try {
		return await fetchYouTubeOEmbedMetadata(canonicalUrl);
	} catch {
		return null;
	}
}

async function getOptionalUserId() {
	const user = await getCurrentUserFromHeaders(
		new Headers(getRequestHeaders()),
	);

	return user?.id ?? null;
}

class RetryableGenerationError extends Error {}

function toUserSafeGenerationFailure(error: unknown) {
	if (error instanceof RetryableGenerationError) {
		return error.message;
	}

	if (error instanceof Error && error.message.includes("AI_API_KEY")) {
		return "Course generation is not configured yet.";
	}

	if (error instanceof Error && error.message.includes("Transcript")) {
		return "YouTube captions were not available for this video.";
	}

	return "Benkyou could not generate chapters for this video.";
}
