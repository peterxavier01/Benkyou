import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { config } from "dotenv";
import { eq, inArray, sql } from "drizzle-orm";

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

test("an anonymous learner's data moves to their account", {
	skip: !process.env.DATABASE_URL,
}, async (t) => {
	const repositories = await import("./repositories");
	const shelvesRepo = await import("./shelves-repository");
	const transfer = await import("./learner-transfer");
	const schema = await import("./schema");
	const database = (await import("./drizzle")).db;

	try {
		await database.execute(sql`select 1`);
	} catch {
		t.skip("DATABASE_URL is configured, but Postgres is not reachable.");
		return;
	}

	const anonymous = `transfer-anonymous-${randomUUID()}`;
	const account = `transfer-account-${randomUUID()}`;
	const bystander = `transfer-bystander-${randomUUID()}`;
	const userIds = [anonymous, account, bystander];
	const courseIds: string[] = [];

	try {
		for (const id of userIds) {
			await database.insert(schema.authUser).values({
				id,
				name: id,
				email: `${id}@example.com`,
				isAnonymous: id === anonymous,
			});
		}

		const providerVideoId = `transfer-test-${randomUUID()}`;
		const video = await repositories.upsertVideoByProvider(
			"youtube",
			providerVideoId,
			{
				sourceUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
				canonicalUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
				title: "Transfer Test Video",
			},
		);
		const newCourse = async (ownerId: string, title: string) => {
			const [row] = await database
				.insert(schema.courses)
				.values({ videoId: video.id, ownerId, title })
				.returning();
			courseIds.push(row.id);
			const [chapter] = await database
				.insert(schema.courseChapters)
				.values({ courseId: row.id, title, orderIndex: 0, startSeconds: 0 })
				.returning();
			return { courseId: row.id, chapterId: chapter.id };
		};

		const notebook = await newCourse(anonymous, "Signed-out notebook");
		const bystanders = await newCourse(bystander, "Not moving");
		const shelf = await shelvesRepo.createShelf(anonymous, "Signed out", 10);
		await shelvesRepo.addNotebookToShelf(
			shelf.id,
			notebook.courseId,
			anonymous,
			10,
		);
		await repositories.upsertChapterNote(
			anonymous,
			notebook.chapterId,
			"Written while signed out.",
		);
		await repositories.upsertChapterProgress(anonymous, notebook.chapterId, {
			watchedSeconds: 30,
			completed: true,
		});
		await repositories.upsertCourseProgress(anonymous, notebook.courseId, {
			resumeSeconds: 30,
			completionPercent: 100,
		});
		await repositories.createBookmark({
			userId: anonymous,
			courseId: notebook.courseId,
			chapterId: notebook.chapterId,
			timestampSeconds: 12,
			title: "Signed-out bookmark",
		});
		await repositories.upsertChapterNote(
			bystander,
			bystanders.chapterId,
			"Someone else's note.",
		);

		const anonymousPreferences = {
			playbackSpeed: 1.5,
			manualCompletionOnly: true,
			autoplayNextChapter: true,
		};
		const accountPreferences = {
			playbackSpeed: 2,
			manualCompletionOnly: false,
			autoplayNextChapter: false,
		};
		await repositories.upsertLearningPreferences(
			anonymous,
			anonymousPreferences,
		);
		await repositories.upsertLearningPreferences(account, accountPreferences);

		await transfer.transferLearnerData(anonymous, account);

		const library = await repositories.getCourseLibrary(account);
		assert.deepEqual(
			library.map((item) => item.course.id),
			[notebook.courseId],
		);
		assert.equal((await repositories.getCourseLibrary(anonymous)).length, 0);

		const player = await repositories.getCoursePlayerData(
			notebook.courseId,
			account,
		);
		assert.equal(player?.notes[0]?.markdown, "Written while signed out.");
		assert.equal(player?.chapterProgress[0]?.completed, true);
		assert.equal(player?.progress?.completionPercent, 100);
		assert.equal(player?.bookmarks[0]?.title, "Signed-out bookmark");

		const shelves = await shelvesRepo.listShelves(account);
		assert.deepEqual(
			shelves.shelves.map((item) => item.shelf.name),
			["Signed out"],
		);
		assert.deepEqual(
			shelves.shelves[0]?.notebooks.map((item) => item.course.id),
			[notebook.courseId],
		);

		// The account keeps its own preferences.
		assert.deepEqual(
			await repositories.getLearningPreferences(account),
			accountPreferences,
		);
		assert.equal(await repositories.getLearningPreferences(anonymous), null);

		// Other learners' data is untouched.
		const bystanderPlayer = await repositories.getCoursePlayerData(
			bystanders.courseId,
			bystander,
		);
		assert.equal(bystanderPlayer?.notes[0]?.markdown, "Someone else's note.");
		assert.equal((await repositories.getCourseLibrary(bystander)).length, 1);

		// Unclaimed anonymous users are pruned with their data.
		await transfer.deleteLearnerData(bystander);
		assert.equal((await repositories.getCourseLibrary(bystander)).length, 0);
		const [removed] = await database
			.select()
			.from(schema.authUser)
			.where(eq(schema.authUser.id, bystander));
		assert.equal(removed, undefined);
	} finally {
		await database
			.delete(schema.shelves)
			.where(inArray(schema.shelves.ownerId, userIds));
		if (courseIds.length > 0) {
			await database
				.delete(schema.courses)
				.where(inArray(schema.courses.id, courseIds));
		}
		await database
			.delete(schema.authUser)
			.where(inArray(schema.authUser.id, userIds));
	}
});
