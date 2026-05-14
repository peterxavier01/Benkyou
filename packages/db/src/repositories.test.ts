import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";

config({
	path: [
		"../../apps/web/.env.local",
		"../../apps/web/.env",
		"../../.env.local",
		"../../.env",
		".env.local",
		".env",
	],
});

test("repository helpers upsert learning data into DTO-compatible course data", {
	skip: !process.env.DATABASE_URL,
}, async (t) => {
	const modules = await import("./repositories");
	const schema = await import("./schema");
	const database = (await import("./drizzle")).db;
	let courseId: string | null = null;
	const extraCourseIds: string[] = [];

	try {
		await database.execute(sql`select 1`);
	} catch {
		t.skip("DATABASE_URL is configured, but Postgres is not reachable.");
		return;
	}

	const providerVideoId = `repository-test-${randomUUID()}`;
	const userId = `repository-user-${randomUUID()}`;
	await database.insert(schema.authUser).values({
		id: userId,
		name: "Repository User",
		email: `${userId}@example.com`,
	});
	const preferences = await modules.upsertLearningPreferences(userId, {
		playbackSpeed: 1.5,
		manualCompletionOnly: true,
		autoplayNextChapter: true,
	});
	assert.deepEqual(await modules.getLearningPreferences(userId), preferences);

	const video = await modules.upsertVideoByProvider(
		"youtube",
		providerVideoId,
		{
			sourceUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
			canonicalUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
			title: "Repository Test Video",
			channelName: "Benkyou Tests",
			transcriptSource: "sample",
		},
	);

	const updatedVideo = await modules.upsertVideoByProvider(
		"youtube",
		providerVideoId,
		{
			sourceUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
			canonicalUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
			title: "Repository Test Video Updated",
			channelName: "Benkyou Tests",
			transcriptSource: "sample",
		},
	);

	assert.equal(updatedVideo.id, video.id);
	assert.equal(updatedVideo.title, "Repository Test Video Updated");

	try {
		const cancellable = await modules.createCourseFromUrlRecord({
			ownerId: userId,
			provider: "youtube",
			providerVideoId: `repository-cancel-${randomUUID()}`,
			sourceUrl: "https://www.youtube.com/watch?v=repository-cancel",
			canonicalUrl: "https://www.youtube.com/watch?v=repository-cancel",
			title: "Repository Cancel Course",
		});
		extraCourseIds.push(cancellable.course.id);

		assert.equal(
			await modules.cancelGenerationJob(cancellable.job.id, "other-user"),
			null,
		);
		const cancelled = await modules.cancelGenerationJob(
			cancellable.job.id,
			userId,
		);
		assert.equal(cancelled?.job.status, "cancelled");
		assert.equal(cancelled?.job.retryable, true);

		const retry = await modules.createRetryGenerationJob(
			cancellable.job.id,
			userId,
		);
		assert.equal(retry?.course.id, cancellable.course.id);

		const timeoutCandidate = await modules.createCourseFromUrlRecord({
			ownerId: userId,
			provider: "youtube",
			providerVideoId: `repository-timeout-${randomUUID()}`,
			sourceUrl: "https://www.youtube.com/watch?v=repository-timeout",
			canonicalUrl: "https://www.youtube.com/watch?v=repository-timeout",
			title: "Repository Timeout Course",
		});
		extraCourseIds.push(timeoutCandidate.course.id);

		assert.ok(await modules.claimGenerationJob(timeoutCandidate.job.id));
		const timedOut = await modules.timeoutGenerationJob(
			timeoutCandidate.job.id,
			10 * 60 * 1000,
			new Date(Date.now() + 11 * 60 * 1000),
		);
		assert.equal(timedOut?.job.status, "failed");
		assert.equal(timedOut?.job.retryable, true);
		assert.equal(
			await modules.completeGenerationJob({
				jobId: timeoutCandidate.job.id,
				transcriptSource: "youtube_captions",
				chapters: [
					{
						title: "Too late",
						orderIndex: 0,
						startSeconds: 0,
						endSeconds: null,
					},
				],
			}),
			null,
		);

		const regenerating = await modules.createCourseFromUrlRecord({
			ownerId: userId,
			provider: "youtube",
			providerVideoId: `repository-regenerate-${randomUUID()}`,
			sourceUrl: "https://www.youtube.com/watch?v=repository-regenerate",
			canonicalUrl: "https://www.youtube.com/watch?v=repository-regenerate",
			title: "Repository Regenerate Course",
		});
		extraCourseIds.push(regenerating.course.id);
		assert.ok(await modules.claimGenerationJob(regenerating.job.id));
		await modules.completeGenerationJob({
			jobId: regenerating.job.id,
			transcriptSource: "sample",
			chapters: [
				{
					title: "Old first",
					orderIndex: 0,
					startSeconds: 0,
					endSeconds: 60,
				},
				{
					title: "Old second",
					orderIndex: 1,
					startSeconds: 60,
					endSeconds: null,
				},
			],
		});
		const beforeRegeneration = await modules.getCoursePlayerData(
			regenerating.course.id,
			userId,
		);
		const oldFirstChapter = beforeRegeneration?.chapters[0];
		assert.ok(oldFirstChapter);
		await modules.upsertChapterNote(userId, oldFirstChapter.id, "Keep me.");
		await modules.upsertChapterProgress(userId, oldFirstChapter.id, {
			watchedSeconds: 30,
			completed: true,
		});
		await modules.createBookmark({
			userId,
			courseId: regenerating.course.id,
			chapterId: oldFirstChapter.id,
			timestampSeconds: 35,
			title: "Preserved bookmark",
		});
		const regenerationJob = await modules.createRegenerationJob(
			regenerating.course.id,
			userId,
		);
		assert.equal(regenerationJob?.course.id, regenerating.course.id);
		const activeRegenerationJob = await modules.createRegenerationJob(
			regenerating.course.id,
			userId,
		);
		assert.equal(activeRegenerationJob?.job.id, regenerationJob?.job.id);
		assert.ok(await modules.claimGenerationJob(regenerationJob?.job.id ?? ""));
		await modules.completeGenerationJob({
			jobId: regenerationJob?.job.id ?? "",
			transcriptSource: "sample",
			chapters: [
				{
					title: "New first",
					orderIndex: 0,
					startSeconds: 0,
					endSeconds: 90,
				},
				{
					title: "New second",
					orderIndex: 1,
					startSeconds: 90,
					endSeconds: null,
				},
			],
		});
		const afterRegeneration = await modules.getCoursePlayerData(
			regenerating.course.id,
			userId,
		);
		assert.equal(afterRegeneration?.notes[0]?.markdown, "Keep me.");
		assert.equal(
			afterRegeneration?.bookmarks[0]?.chapterId,
			afterRegeneration?.chapters[0]?.id,
		);
		assert.equal(afterRegeneration?.chapterProgress[0]?.completed, true);

		const [course] = await database
			.insert(schema.courses)
			.values({
				videoId: video.id,
				ownerId: null,
				title: "Repository Test Course",
				visibility: "private",
			})
			.returning();
		courseId = course.id;

		const [secondChapter] = await database
			.insert(schema.courseChapters)
			.values({
				courseId: course.id,
				title: "Second chapter",
				orderIndex: 1,
				startSeconds: 60,
				endSeconds: 120,
			})
			.returning();

		const [firstChapter] = await database
			.insert(schema.courseChapters)
			.values({
				courseId: course.id,
				title: "First chapter",
				orderIndex: 0,
				startSeconds: 0,
				endSeconds: 60,
			})
			.returning();

		await modules.upsertCourseProgress(null, course.id, {
			resumeSeconds: 45,
			completionPercent: 50,
		});
		await modules.upsertChapterProgress(null, firstChapter.id, {
			watchedSeconds: 55,
			completed: true,
		});
		const initialNote = await modules.upsertChapterNote(
			null,
			firstChapter.id,
			"A durable note.",
		);
		assert.equal(
			await modules.upsertChapterNoteIfCurrent({
				userId: null,
				chapterId: firstChapter.id,
				markdown: "A stale write.",
				expectedUpdatedAt: null,
			}),
			null,
		);
		const currentNote = await modules.upsertChapterNoteIfCurrent({
			userId: null,
			chapterId: firstChapter.id,
			markdown: "A durable note.",
			expectedUpdatedAt: initialNote.updatedAt,
		});
		assert.equal(currentNote?.markdown, "A durable note.");

		const bookmark = await modules.createBookmark({
			userId: null,
			courseId: course.id,
			chapterId: firstChapter.id,
			timestampSeconds: 32,
			title: "Important timestamp",
		});

		const updatedBookmark = await modules.updateBookmark(bookmark.id, null, {
			title: "Updated timestamp",
			note: "Worth revisiting.",
		});

		assert.equal(updatedBookmark?.title, "Updated timestamp");

		const data = await modules.getCoursePlayerData(course.id, null);

		assert.equal(data?.video.id, video.id);
		assert.deepEqual(
			data?.chapters.map((chapter) => chapter.id),
			[firstChapter.id, secondChapter.id],
		);
		assert.equal(data?.progress?.resumeSeconds, 45);
		assert.equal(data?.chapterProgress[0]?.completed, true);
		assert.equal(data?.notes[0]?.markdown, "A durable note.");
		assert.equal(data?.bookmarks[0]?.title, "Updated timestamp");

		const bookmarks = await modules.getBookmarks(null);
		const listedBookmark = bookmarks.find(
			(item) => item.bookmark.id === bookmark.id,
		);
		assert.equal(listedBookmark?.course.id, course.id);
		assert.equal(listedBookmark?.video.id, video.id);
		assert.equal(listedBookmark?.chapter?.id, firstChapter.id);

		assert.equal(
			(await modules.getBookmarks("other-user")).some(
				(item) => item.bookmark.id === bookmark.id,
			),
			false,
		);

		const signedInSampleBookmark = await modules.createBookmark({
			userId,
			courseId: course.id,
			chapterId: secondChapter.id,
			timestampSeconds: 70,
			title: "Signed in sample timestamp",
		});
		assert.equal(
			(await modules.getBookmarks(userId)).some(
				(item) => item.bookmark.id === signedInSampleBookmark.id,
			),
			true,
		);
		assert.equal(
			await modules.deleteBookmark(signedInSampleBookmark.id, userId),
			true,
		);

		assert.equal(await modules.deleteBookmark(bookmark.id, null), true);

		const dataAfterDelete = await modules.getCoursePlayerData(course.id, null);
		assert.equal(dataAfterDelete?.bookmarks.length, 0);
		assert.equal(
			(await modules.getBookmarks(null)).some(
				(item) => item.bookmark.id === bookmark.id,
			),
			false,
		);

		const library = await modules.getCourseLibrary(null);
		assert.equal(
			library.some((item) => item.course.id === course.id),
			true,
		);

		assert.equal(
			await modules.softDeleteCourse(course.id, "other-user"),
			false,
		);
		assert.equal(
			await modules.updateCourseMetadata(course.id, "other-user", {
				title: "Blocked",
			}),
			null,
		);
		const updatedCourse = await modules.updateCourseMetadata(course.id, null, {
			title: "Managed title",
			description: "Managed description",
		});
		assert.equal(updatedCourse?.title, "Managed title");
		const updatedChapter = await modules.updateChapter(firstChapter.id, null, {
			title: "Managed chapter",
			summary: "Managed summary",
			startSeconds: 0,
			endSeconds: 55,
		});
		assert.equal(updatedChapter?.title, "Managed chapter");
		const managementData = await modules.getCourseManagementData(
			course.id,
			null,
		);
		assert.equal(managementData?.chapters[0]?.title, "Managed chapter");
		assert.equal(await modules.softDeleteCourse(course.id, null), true);

		const libraryAfterDelete = await modules.getCourseLibrary(null);
		assert.equal(
			libraryAfterDelete.some((item) => item.course.id === course.id),
			false,
		);
	} finally {
		if (courseId) {
			await database
				.update(schema.courses)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(eq(schema.courses.id, courseId));
		}
		for (const id of extraCourseIds) {
			await database
				.update(schema.courses)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(eq(schema.courses.id, id));
		}
		await database
			.delete(schema.authUser)
			.where(eq(schema.authUser.id, userId));
	}
});
