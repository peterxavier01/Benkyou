import {
	analyzeYouTubeDescriptionChapters,
	cancelGenerationJobRequestV1Schema,
	createCourseFromUrlRequestV1Schema,
	EDUCATIONAL_SUITABILITY_REJECTION_MESSAGE,
	GENERATION_JOB_TIMEOUT_MS,
	getChapterGenerationPolicy,
	getParseVideoUrlErrorMessage,
	isEducationalSuitabilityAllowed,
	isSampledTranscriptCacheIncomplete,
	parseVideoUrl,
	processGenerationJobRequestV1Schema,
	resolveTranscriptBackedDurationSeconds,
	retryGenerationJobRequestV1Schema,
	toGenerationJobDetail,
} from "@benkyou/core";
import type {
	CancelGenerationJobResponseV1,
	CreateCourseFromUrlResponseV1,
	GenerationJobDetailV1,
	OpenSampleCourseResponseV1,
	ProcessGenerationJobResponseV1,
	RetryGenerationJobResponseV1,
	TranscriptSource,
} from "@benkyou/types";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import {
	trackGenerationJobCompleted,
	trackGenerationJobFailed,
} from "#/integrations/posthog/analytics-server";

type CourseGenerationServer = typeof import("./course-generation.server");
type YouTubeMetadata = Awaited<
	ReturnType<CourseGenerationServer["fetchYouTubeDataApiMetadata"]>
>;
type YouTubeDataApiMetadataDiagnostics = Awaited<
	ReturnType<
		CourseGenerationServer["fetchYouTubeDataApiMetadataWithDiagnostics"]
	>
>["diagnostics"];
type ClaimedGenerationJob = NonNullable<
	Awaited<ReturnType<CourseGenerationServer["claimGenerationJob"]>>
>;
type GenerationVideoInput = ClaimedGenerationJob["video"];

let courseGenerationServerPromise: Promise<CourseGenerationServer> | null =
	null;

function getCourseGenerationServer() {
	courseGenerationServerPromise ??= import("./course-generation.server");
	return courseGenerationServerPromise;
}

export const createCourseFromUrl = createServerFn({ method: "POST" })
	.inputValidator((input) => createCourseFromUrlRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<CreateCourseFromUrlResponseV1> => {
		const parsedUrl = parseVideoUrl(data.url);

		if (!parsedUrl.ok) {
			throw new Error(getParseVideoUrlErrorMessage(parsedUrl.error));
		}

		const headers = getHeaders();
		const ownerId = await getOptionalUserId(headers);
		const existingCourse = await getExistingCourseByProviderVideo(
			parsedUrl.value.provider,
			parsedUrl.value.providerVideoId,
			ownerId,
		);

		if (existingCourse) {
			return {
				courseId: existingCourse.id,
				generationJobId: null,
				reusedExistingCourse: true,
			};
		}

		await assertGenerationRateLimit(headers, ownerId);
		const metadata = await safeFetchMetadata(
			parsedUrl.value.providerVideoId,
			parsedUrl.value.canonicalUrl,
		);
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

		let generationDiagnostics: Record<string, unknown> = {};

		try {
			const generationVideo = await getVideoInputForGeneration(claimed.video);
			generationDiagnostics = getGenerationDiagnostics(generationVideo);
			const educationalSuitability =
				await classifyEducationalSuitabilityForVideo(generationVideo);

			if (!isEducationalSuitabilityAllowed(educationalSuitability.result)) {
				const failed = await failGenerationJob({
					jobId: claimed.job.id,
					failureReason: EDUCATIONAL_SUITABILITY_REJECTION_MESSAGE,
					retryable: false,
					rawOutput: {
						educationalSuitability,
					},
				});

				if (!failed) {
					throw new Error(
						"Generation job disappeared before suitability check.",
					);
				}

				await trackGenerationJobFailed({
					...failed,
					failureCategory: "educational_suitability",
					retryable: false,
				});

				return { detail: toGenerationJobDetail(failed) };
			}

			const creatorTimestampDiagnostics = analyzeYouTubeDescriptionChapters(
				generationVideo.description,
				generationVideo.durationSeconds,
			);
			const creatorChapters = creatorTimestampDiagnostics.chapters;
			generationDiagnostics = {
				...generationDiagnostics,
				creatorTimestamps: summarizeCreatorTimestampDiagnostics(
					creatorTimestampDiagnostics,
				),
			};

			if (creatorChapters.length > 0) {
				const completed = await completeGenerationJob({
					jobId: claimed.job.id,
					title: claimed.course.title,
					description: claimed.course.description,
					transcriptSource: null,
					durationSeconds: generationVideo.durationSeconds,
					rawOutput: {
						chapterSource: "creator_timestamps",
						chapterCount: creatorChapters.length,
						...generationDiagnostics,
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

				await trackGenerationJobCompleted(completed);

				return { detail: toGenerationJobDetail(completed) };
			}

			const transcriptInput = await getTranscriptInputForGeneration({
				providerVideoId: generationVideo.providerVideoId,
				durationSeconds: generationVideo.durationSeconds,
				transcriptSource: generationVideo.transcriptSource,
				transcriptText: generationVideo.transcriptText,
			});
			const { durationSeconds, policy, transcriptSource, transcriptText } =
				transcriptInput;
			await markGenerationJobTranscriptReady(claimed.job.id);

			const { generateCourseChapters } = await getCourseGenerationServer();
			const generated = await generateCourseChapters({
				videoTitle: generationVideo.title ?? claimed.course.title,
				canonicalUrl: generationVideo.canonicalUrl,
				transcriptText,
				durationSeconds,
				transcriptSegmentCount: transcriptInput.transcriptSegmentCount,
				policy,
			});
			const completed = await completeGenerationJob({
				jobId: claimed.job.id,
				title: generated.title,
				description: generated.description,
				transcriptSource,
				transcriptText,
				durationSeconds,
				rawOutput: {
					chapterSource: policy.isCoarseFallback
						? "ai_coarse_fallback"
						: "ai_generated",
					transcriptCacheHit: transcriptInput.cacheHit,
					...generationDiagnostics,
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

			await trackGenerationJobCompleted(completed);

			return { detail: toGenerationJobDetail(completed) };
		} catch (error) {
			const serializedError = serializeGenerationError(error);
			logGenerationFailure({
				error,
				jobId: claimed.job.id,
				providerVideoId: claimed.video.providerVideoId,
			});

			const failed = await failGenerationJob({
				jobId: claimed.job.id,
				failureReason: toUserSafeGenerationFailure(error),
				retryable: true,
				rawOutput: {
					...generationDiagnostics,
					...serializedError,
				},
			});

			if (!failed) {
				throw error;
			}

			await trackGenerationJobFailed({
				...failed,
				failureCategory: getGenerationFailureCategory(serializedError),
				retryable: true,
			});

			return { detail: toGenerationJobDetail(failed) };
		}
	});

async function getTranscriptInputForGeneration(input: {
	providerVideoId: string;
	durationSeconds: number | null;
	transcriptSource: TranscriptSource | null;
	transcriptText: string | null;
}) {
	const cachedTranscriptText = input.transcriptText?.trim();

	if (
		input.transcriptSource &&
		cachedTranscriptText &&
		!shouldRefetchCachedTranscript({
			durationSeconds: input.durationSeconds,
			transcriptSource: input.transcriptSource,
			transcriptText: cachedTranscriptText,
		})
	) {
		const transcriptSegmentCount =
			estimateCachedTranscriptSegmentCount(cachedTranscriptText);
		const policy = getChapterGenerationPolicy(
			input.durationSeconds,
			transcriptSegmentCount,
		);

		return {
			cacheHit: true,
			durationSeconds: input.durationSeconds,
			policy,
			transcriptSegmentCount,
			transcriptSource: input.transcriptSource,
			transcriptText: cachedTranscriptText,
		};
	}

	const { fetchYouTubeTranscript, transcriptSegmentsToText } =
		await getCourseGenerationServer();
	const transcriptSegments = await fetchYouTubeTranscript(
		input.providerVideoId,
	);
	const lastTranscriptSegment = transcriptSegments.at(-1);
	const transcriptEndSeconds = lastTranscriptSegment
		? lastTranscriptSegment.startSeconds + lastTranscriptSegment.durationSeconds
		: null;
	const durationSeconds = resolveTranscriptBackedDurationSeconds(
		input.durationSeconds,
		transcriptEndSeconds,
	);
	const policy = getChapterGenerationPolicy(
		durationSeconds,
		transcriptSegments.length,
	);
	const transcriptText = transcriptSegmentsToText(transcriptSegments, {
		durationSeconds,
		policy,
	});

	return {
		cacheHit: false,
		durationSeconds,
		policy,
		transcriptSegmentCount: transcriptSegments.length,
		transcriptSource: "youtube_captions" as const,
		transcriptText,
	};
}

async function getVideoInputForGeneration(video: GenerationVideoInput) {
	if (!shouldRefreshVideoMetadata(video)) {
		return video;
	}

	const metadata = await safeFetchMetadata(
		video.providerVideoId,
		video.canonicalUrl,
	);

	if (!metadata) {
		return video;
	}

	return {
		...video,
		title: metadata.title ?? video.title,
		description: metadata.description ?? video.description,
		channelTitle: metadata.channelName ?? video.channelTitle,
		thumbnailUrl: metadata.thumbnailUrl ?? video.thumbnailUrl,
		durationSeconds: metadata.durationSeconds ?? video.durationSeconds,
		rawMetadata: metadata.rawMetadata ?? video.rawMetadata,
	};
}

function estimateCachedTranscriptSegmentCount(transcriptText: string) {
	return transcriptText.split(/\r?\n/).filter((line) => line.trim().length > 0)
		.length;
}

const SUSPICIOUS_SHORT_DURATION_SECONDS = 2 * 60;
const SUSPICIOUS_DENSE_TRANSCRIPT_DURATION_SECONDS = 10 * 60;
const SUSPICIOUS_CACHED_TRANSCRIPT_SEGMENT_COUNT = 100;

function shouldRefreshVideoMetadata(input: {
	durationSeconds: number | null;
	transcriptText: string | null;
}) {
	return (
		input.durationSeconds === null ||
		isSuspiciouslyShortTranscriptDuration(
			input.durationSeconds,
			input.transcriptText,
		)
	);
}

function shouldRefetchCachedTranscript(input: {
	durationSeconds: number | null;
	transcriptSource: TranscriptSource;
	transcriptText: string;
}) {
	if (input.transcriptSource !== "youtube_captions") {
		return false;
	}

	if (input.durationSeconds === null) {
		return true;
	}

	const segmentCount = estimateCachedTranscriptSegmentCount(
		input.transcriptText,
	);

	if (
		isDenseShortTranscript(input.durationSeconds, segmentCount) ||
		isSampledTranscriptCacheIncomplete({
			durationSeconds: input.durationSeconds,
			transcriptSegmentCount: segmentCount,
			transcriptText: input.transcriptText,
		})
	) {
		return true;
	}

	return false;
}

function isSuspiciouslyShortTranscriptDuration(
	durationSeconds: number,
	transcriptText: string | null,
) {
	if (
		durationSeconds > 0 &&
		durationSeconds < SUSPICIOUS_SHORT_DURATION_SECONDS
	) {
		return true;
	}

	if (!transcriptText) {
		return false;
	}

	return isDenseShortTranscript(
		durationSeconds,
		estimateCachedTranscriptSegmentCount(transcriptText),
	);
}

function isDenseShortTranscript(durationSeconds: number, segmentCount: number) {
	return (
		durationSeconds > 0 &&
		durationSeconds < SUSPICIOUS_DENSE_TRANSCRIPT_DURATION_SECONDS &&
		segmentCount >= SUSPICIOUS_CACHED_TRANSCRIPT_SEGMENT_COUNT
	);
}

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

async function cancelGenerationJobRecord(
	...args: Parameters<CourseGenerationServer["cancelGenerationJobRecord"]>
) {
	return (await getCourseGenerationServer()).cancelGenerationJobRecord(...args);
}

async function claimGenerationJob(
	...args: Parameters<CourseGenerationServer["claimGenerationJob"]>
) {
	return (await getCourseGenerationServer()).claimGenerationJob(...args);
}

async function completeGenerationJob(
	...args: Parameters<CourseGenerationServer["completeGenerationJob"]>
) {
	return (await getCourseGenerationServer()).completeGenerationJob(...args);
}

async function consumeCourseGenerationRateLimit(
	...args: Parameters<
		CourseGenerationServer["consumeCourseGenerationRateLimit"]
	>
) {
	return (await getCourseGenerationServer()).consumeCourseGenerationRateLimit(
		...args,
	);
}

async function createCourseFromUrlRecord(
	...args: Parameters<CourseGenerationServer["createCourseFromUrlRecord"]>
) {
	return (await getCourseGenerationServer()).createCourseFromUrlRecord(...args);
}

async function createRetryGenerationJob(
	...args: Parameters<CourseGenerationServer["createRetryGenerationJob"]>
) {
	return (await getCourseGenerationServer()).createRetryGenerationJob(...args);
}

async function failGenerationJob(
	...args: Parameters<CourseGenerationServer["failGenerationJob"]>
) {
	return (await getCourseGenerationServer()).failGenerationJob(...args);
}

async function getExistingCourseByProviderVideo(
	...args: Parameters<
		CourseGenerationServer["getExistingCourseByProviderVideo"]
	>
) {
	return (await getCourseGenerationServer()).getExistingCourseByProviderVideo(
		...args,
	);
}

async function getGenerationJobDetailRecord(
	...args: Parameters<CourseGenerationServer["getGenerationJobDetailRecord"]>
) {
	return (await getCourseGenerationServer()).getGenerationJobDetailRecord(
		...args,
	);
}

async function getSampleCourse(
	...args: Parameters<CourseGenerationServer["getSampleCourse"]>
) {
	return (await getCourseGenerationServer()).getSampleCourse(...args);
}

async function markGenerationJobTranscriptReady(
	...args: Parameters<
		CourseGenerationServer["markGenerationJobTranscriptReady"]
	>
) {
	return (await getCourseGenerationServer()).markGenerationJobTranscriptReady(
		...args,
	);
}

async function timeoutGenerationJob(
	...args: Parameters<CourseGenerationServer["timeoutGenerationJob"]>
) {
	return (await getCourseGenerationServer()).timeoutGenerationJob(...args);
}

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
	const {
		fetchYouTubeDataApiMetadataWithDiagnostics,
		fetchYouTubeOEmbedMetadata,
	} = await getCourseGenerationServer();
	let dataApiMetadata: YouTubeMetadata = null;
	let dataApiDiagnostics: YouTubeDataApiMetadataDiagnostics | null = null;

	try {
		const dataApiResult =
			await fetchYouTubeDataApiMetadataWithDiagnostics(providerVideoId);
		dataApiMetadata = dataApiResult.metadata;
		dataApiDiagnostics = dataApiResult.diagnostics;
	} catch {
		dataApiMetadata = null;
		dataApiDiagnostics = createDataApiExceptionDiagnostics();
	}

	if (dataApiMetadata) {
		return withMetadataAttempts(dataApiMetadata, {
			youtubeDataApi: dataApiDiagnostics,
			selected: "youtube_data_api",
		});
	}

	try {
		const oembedMetadata = await fetchYouTubeOEmbedMetadata(canonicalUrl);

		if (!oembedMetadata) {
			return null;
		}

		return withMetadataAttempts(oembedMetadata, {
			youtubeDataApi: dataApiDiagnostics,
			youtubeOembed: {
				provider: "youtube_oembed",
				result: "success",
			},
			selected: "youtube_oembed",
		});
	} catch {
		return null;
	}
}

function withMetadataAttempts(
	metadata: NonNullable<YouTubeMetadata>,
	metadataAttempts: Record<string, unknown>,
): NonNullable<YouTubeMetadata> {
	return {
		...metadata,
		rawMetadata: {
			...metadata.rawMetadata,
			metadataAttempts: {
				...getRecord(metadata.rawMetadata.metadataAttempts),
				...metadataAttempts,
			},
		},
	};
}

function createDataApiExceptionDiagnostics(): YouTubeDataApiMetadataDiagnostics {
	return {
		provider: "youtube_data_api",
		result: "exception",
		configured: Boolean(process.env.YOUTUBE_API_KEY),
		status: null,
		statusText: null,
		itemCount: null,
		descriptionPresent: null,
		durationPresent: null,
		errorStatus: null,
		errorReason: null,
	};
}

async function getOptionalUserId(headers = getHeaders()) {
	const { getCurrentUserFromHeaders } = await getCourseGenerationServer();
	const user = await getCurrentUserFromHeaders(headers);

	return user?.id ?? null;
}

function getHeaders() {
	return new Headers(getRequestHeaders());
}

async function assertGenerationRateLimit(
	headers: Headers,
	userId: string | null,
) {
	const { limit, windowMs } = getGenerationRateLimitOptions();
	const identity = getGenerationRateLimitIdentity(headers, userId);
	const result = await consumeCourseGenerationRateLimit({
		key: identity.key,
		keyType: identity.keyType,
		limit,
		windowMs,
	});

	if (!result.allowed) {
		throw new Error(
			`Course generation is limited to ${result.limit} attempts per ${Math.round(
				windowMs / 60 / 60 / 1000,
			)} hours. Try again later.`,
		);
	}
}

function getGenerationRateLimitOptions() {
	const limit = parsePositiveInteger(process.env.GENERATION_RATE_LIMIT_MAX, 5);
	const windowHours = parsePositiveInteger(
		process.env.GENERATION_RATE_LIMIT_WINDOW_HOURS,
		24,
	);

	return {
		limit,
		windowMs: windowHours * 60 * 60 * 1000,
	};
}

function getGenerationRateLimitIdentity(
	headers: Headers,
	userId: string | null,
): { key: string; keyType: "user" | "ip" | "anonymous" } {
	if (userId) {
		return { key: `user:${userId}`, keyType: "user" };
	}

	const ip = getRequestIp(headers);

	if (ip) {
		return { key: `ip:${ip}`, keyType: "ip" };
	}

	return { key: "anonymous:global", keyType: "anonymous" };
}

function getRequestIp(headers: Headers) {
	const forwardedFor = headers.get("x-forwarded-for");
	const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

	return (
		firstForwardedIp ||
		headers.get("x-real-ip")?.trim() ||
		headers.get("cf-connecting-ip")?.trim() ||
		null
	);
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);

	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function logGenerationFailure(input: {
	error: unknown;
	jobId: string;
	providerVideoId: string;
}) {
	console.error("Course generation failed", {
		jobId: input.jobId,
		providerVideoId: input.providerVideoId,
		...serializeGenerationError(input.error),
	});
}

function serializeGenerationError(error: unknown) {
	const cause =
		error instanceof Error && error.cause instanceof Error
			? {
					causeName: error.cause.name,
					causeMessage: error.cause.message,
				}
			: {};

	if (isYouTubeTranscriptFetchError(error)) {
		return {
			message: error.message,
			name: error.name,
			transcriptFailureCode: error.code,
			...cause,
		};
	}

	if (error instanceof Error) {
		return {
			message: error.message,
			name: error.name,
			...cause,
		};
	}

	return {
		message: "Unknown generation error.",
		name: "UnknownError",
	};
}

function getGenerationFailureCategory(error: Record<string, unknown>) {
	for (const key of ["transcriptFailureCode", "name", "causeName"]) {
		const value = error[key];
		if (typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}

	return "unknown";
}

function getGenerationDiagnostics(video: {
	description: string | null;
	durationSeconds: number | null;
	rawMetadata: Record<string, unknown> | null;
}) {
	const rawMetadata = video.rawMetadata;
	const snippet = getRecord(rawMetadata?.snippet);
	const snippetDescription = snippet?.description;
	const metadataAttempts = getRecord(rawMetadata?.metadataAttempts);

	return {
		metadata: {
			source:
				typeof rawMetadata?.source === "string"
					? rawMetadata.source
					: "unknown",
			selectedSource:
				typeof metadataAttempts?.selected === "string"
					? metadataAttempts.selected
					: typeof rawMetadata?.source === "string"
						? rawMetadata.source
						: "unknown",
			attempts: metadataAttempts,
			descriptionPresent: Boolean(video.description?.trim()),
			descriptionLength: video.description?.length ?? 0,
			durationSeconds: video.durationSeconds,
			rawMetadataSnippetDescriptionPresent:
				typeof snippetDescription === "string" &&
				snippetDescription.trim().length > 0,
			rawMetadataSnippetDescriptionLength:
				typeof snippetDescription === "string" ? snippetDescription.length : 0,
		},
	};
}

function summarizeCreatorTimestampDiagnostics(
	diagnostics: ReturnType<typeof analyzeYouTubeDescriptionChapters>,
) {
	return {
		descriptionPresent: diagnostics.descriptionPresent,
		descriptionLength: diagnostics.descriptionLength,
		timestampCandidateCount: diagnostics.timestampCandidateCount,
		parseableChapterCount: diagnostics.parseableChapterCount,
		inDurationChapterCount: diagnostics.inDurationChapterCount,
		orderedChapterCount: diagnostics.orderedChapterCount,
		parsedChapterCount: diagnostics.parsedChapterCount,
		skipReason: diagnostics.skipReason,
	};
}

async function classifyEducationalSuitabilityForVideo(video: {
	title: string | null;
	description: string | null;
	channelTitle: string | null;
	rawMetadata: Record<string, unknown> | null;
}) {
	const metadata = getSuitabilityMetadata(video.rawMetadata);
	const { classifyEducationalSuitability } = await getCourseGenerationServer();
	const result = await classifyEducationalSuitability({
		videoTitle: video.title,
		description: video.description,
		channelName: video.channelTitle,
		categoryId: metadata.categoryId,
		tags: metadata.tags,
		topicCategories: metadata.topicCategories,
	});

	return {
		result,
		metadata,
	};
}

function getSuitabilityMetadata(rawMetadata: Record<string, unknown> | null) {
	const snippet = getRecord(rawMetadata?.snippet);
	const topicDetails = getRecord(rawMetadata?.topicDetails);

	return {
		categoryId:
			typeof snippet?.categoryId === "string" ? snippet.categoryId : null,
		tags: Array.isArray(snippet?.tags)
			? snippet.tags.filter((tag): tag is string => typeof tag === "string")
			: [],
		topicCategories: Array.isArray(topicDetails?.topicCategories)
			? topicDetails.topicCategories.filter(
					(topic): topic is string => typeof topic === "string",
				)
			: [],
		source:
			typeof rawMetadata?.source === "string" ? rawMetadata.source : "unknown",
	};
}

function getRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function toUserSafeGenerationFailure(error: unknown) {
	if (error instanceof Error && error.message.includes("AI_API_KEY")) {
		return "Course generation is not configured yet.";
	}

	if (isYouTubeTranscriptFetchError(error)) {
		return "YouTube captions were not available for this video.";
	}

	if (error instanceof Error && error.message.includes("Transcript")) {
		return "YouTube captions were not available for this video.";
	}

	return "Benkyou could not generate chapters for this video.";
}

function isYouTubeTranscriptFetchError(
	error: unknown,
): error is Error & { code: string } {
	return (
		error instanceof Error &&
		error.name === "YouTubeTranscriptFetchError" &&
		"code" in error &&
		typeof error.code === "string"
	);
}
