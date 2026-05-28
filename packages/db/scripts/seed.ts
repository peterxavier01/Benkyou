import { and, eq, isNull } from "drizzle-orm";

import { db } from "../src/drizzle";
import {
	upsertChapterNote,
	upsertChapterProgress,
	upsertCourseProgress,
	upsertVideoByProvider,
} from "../src/repositories";
import {
	bookmarks,
	courseChapters,
	courseGenerationJobs,
	courses,
} from "../src/schema";

const SAMPLE_PROVIDER_VIDEO_ID = "M7lc1UVf-VE";

const sampleChapters = [
	{
		title: "Set the embed context",
		summary: "Introduce the video and the iframe player customization goals.",
		orderIndex: 0,
		startSeconds: 0,
		endSeconds: 150,
	},
	{
		title: "Choose the iframe embed",
		summary: "Explain the recommended embedded player shape for web pages.",
		orderIndex: 1,
		startSeconds: 150,
		endSeconds: 420,
	},
	{
		title: "Tune player parameters",
		summary: "Walk through player parameters such as autoplay and controls.",
		orderIndex: 2,
		startSeconds: 420,
		endSeconds: 690,
	},
	{
		title: "Connect JavaScript control",
		summary: "Show how the embedded player can be controlled from the page.",
		orderIndex: 3,
		startSeconds: 690,
		endSeconds: 1020,
	},
	{
		title: "Review the integration choices",
		summary: "Summarize how embed options shape the playback experience.",
		orderIndex: 4,
		startSeconds: 1020,
		endSeconds: 1341,
	},
];

async function seed() {
	const video = await upsertVideoByProvider(
		"youtube",
		SAMPLE_PROVIDER_VIDEO_ID,
		{
			sourceUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
			canonicalUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
			title: "YouTube Developers Live: Embedded Web Player Customization",
			description:
				"A public YouTube Developers video used to exercise the Benkyou learning loop with real playback.",
			thumbnailUrl: "https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg",
			channelName: "YouTube Developers",
			channelUrl: "https://www.youtube.com/@YouTubeDevelopers",
			durationSeconds: 1341,
			transcriptSource: "sample",
			transcriptText:
				"This seeded transcript summary stands in for generated course content while the sample uses a real YouTube source.",
			rawMetadata: { seeded: true },
		},
	);

	const [existingCourse] = await db
		.select()
		.from(courses)
		.where(
			and(
				eq(courses.videoId, video.id),
				isNull(courses.ownerId),
				isNull(courses.deletedAt),
			),
		)
		.limit(1);

	const [course] = existingCourse
		? await db
				.update(courses)
				.set({
					title: "Sample: YouTube Embed Customization",
					description:
						"A seeded course for validating real playback, chapters, notes, bookmarks, and progress.",
					visibility: "private",
					updatedAt: new Date(),
				})
				.where(eq(courses.id, existingCourse.id))
				.returning()
		: await db
				.insert(courses)
				.values({
					videoId: video.id,
					ownerId: null,
					title: "Sample: YouTube Embed Customization",
					description:
						"A seeded course for validating real playback, chapters, notes, bookmarks, and progress.",
					visibility: "private",
				})
				.returning();

	const seededChapters = [];

	for (const chapter of sampleChapters) {
		const [seededChapter] = await db
			.insert(courseChapters)
			.values({
				courseId: course.id,
				...chapter,
			})
			.onConflictDoUpdate({
				target: [courseChapters.courseId, courseChapters.orderIndex],
				set: {
					title: chapter.title,
					summary: chapter.summary,
					startSeconds: chapter.startSeconds,
					endSeconds: chapter.endSeconds,
					updatedAt: new Date(),
				},
			})
			.returning();

		seededChapters.push(seededChapter);
	}

	const [existingJob] = await db
		.select()
		.from(courseGenerationJobs)
		.where(eq(courseGenerationJobs.courseId, course.id))
		.limit(1);

	if (existingJob) {
		await db
			.update(courseGenerationJobs)
			.set({
				status: "completed",
				transcriptSource: "sample",
				failureReason: null,
				retryable: false,
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(courseGenerationJobs.id, existingJob.id));
	} else {
		await db.insert(courseGenerationJobs).values({
			courseId: course.id,
			status: "completed",
			transcriptSource: "sample",
			retryable: false,
			completedAt: new Date(),
			rawOutput: { seeded: true, chapterCount: seededChapters.length },
		});
	}

	await upsertCourseProgress(null, course.id, {
		resumeSeconds: 690,
		completionPercent: 42,
	});

	for (const [index, chapter] of seededChapters.entries()) {
		const seedChapter = sampleChapters[index];

		await upsertChapterProgress(null, chapter.id, {
			watchedSeconds:
				index < 2 ? seedChapter.endSeconds - seedChapter.startSeconds : 60,
			completed: index < 2,
		});
	}

	await upsertChapterNote(
		null,
		seededChapters[1].id,
		"Iframe embeds are the recommended path when the app needs a real YouTube player inside the workspace.",
	);
	await upsertChapterNote(
		null,
		seededChapters[2].id,
		"Player parameters are useful study notes because small playback choices change the whole viewing flow.",
	);

	const sampleBookmarks = [
		{
			timestampSeconds: 312,
			chapterId: seededChapters[1].id,
			title: "Embed approach",
			note: "Good moment to revisit before wiring player behavior.",
		},
		{
			timestampSeconds: 742,
			chapterId: seededChapters[3].id,
			title: "Player control",
			note: "Connect external controls to the selected playback moment.",
		},
		{
			timestampSeconds: 1210,
			chapterId: seededChapters[4].id,
			title: "Integration recap",
			note: "Use the recap to compare Benkyou's player, chapters, and progress behavior.",
		},
	];

	for (const bookmark of sampleBookmarks) {
		const [existingBookmark] = await db
			.select()
			.from(bookmarks)
			.where(
				and(
					eq(bookmarks.courseId, course.id),
					eq(bookmarks.timestampSeconds, bookmark.timestampSeconds),
					isNull(bookmarks.userId),
					isNull(bookmarks.deletedAt),
				),
			)
			.limit(1);

		if (existingBookmark) {
			await db
				.update(bookmarks)
				.set({ ...bookmark, updatedAt: new Date() })
				.where(eq(bookmarks.id, existingBookmark.id));
		} else {
			await db.insert(bookmarks).values({
				userId: null,
				courseId: course.id,
				...bookmark,
			});
		}
	}

	console.log(`Seeded sample course: ${course.id}`);
}

seed().catch((error) => {
	console.error("Seed failed.");
	console.error(error);
	process.exitCode = 1;
});
