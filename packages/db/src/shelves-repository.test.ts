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

test("shelves keep notebooks in order and stay private to their owner", {
	skip: !process.env.DATABASE_URL,
}, async (t) => {
	const repositories = await import("./repositories");
	const shelvesRepo = await import("./shelves-repository");
	const schema = await import("./schema");
	const database = (await import("./drizzle")).db;

	try {
		await database.execute(sql`select 1`);
	} catch {
		t.skip("DATABASE_URL is configured, but Postgres is not reachable.");
		return;
	}

	const owner = `shelf-owner-${randomUUID()}`;
	const stranger = `shelf-stranger-${randomUUID()}`;
	const userIds = [owner, stranger];
	const courseIds: string[] = [];

	try {
		for (const id of userIds) {
			await database
				.insert(schema.authUser)
				.values({ id, name: id, email: `${id}@example.com` });
		}

		const providerVideoId = `shelf-test-${randomUUID()}`;
		const video = await repositories.upsertVideoByProvider(
			"youtube",
			providerVideoId,
			{
				sourceUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
				canonicalUrl: `https://www.youtube.com/watch?v=${providerVideoId}`,
				title: "Shelf Test Video",
			},
		);
		const newCourse = async (ownerId: string, title: string) => {
			const [row] = await database
				.insert(schema.courses)
				.values({ videoId: video.id, ownerId, title })
				.returning();
			courseIds.push(row.id);
			return row.id;
		};
		const first = await newCourse(owner, "First");
		const second = await newCourse(owner, "Second");
		const strangersCourse = await newCourse(stranger, "Not yours");

		const shelf = await shelvesRepo.createShelf(owner, "Backend", 10);
		assert.equal(shelf.name, "Backend");

		assert.equal(
			await shelvesRepo.addNotebookToShelf(shelf.id, first, owner, 10),
			true,
		);
		assert.equal(
			await shelvesRepo.addNotebookToShelf(shelf.id, second, owner, 10),
			true,
		);
		// Adding twice is harmless.
		assert.equal(
			await shelvesRepo.addNotebookToShelf(shelf.id, first, owner, 10),
			true,
		);
		// Someone else's notebook, or someone else's shelf, is refused.
		assert.equal(
			await shelvesRepo.addNotebookToShelf(shelf.id, strangersCourse, owner, 10),
			false,
		);
		assert.equal(
			await shelvesRepo.addNotebookToShelf(shelf.id, strangersCourse, stranger, 10),
			false,
		);
		await assert.rejects(
			shelvesRepo.addNotebookToShelf(
				shelf.id,
				await newCourse(owner, "Third"),
				owner,
				2,
			),
			shelvesRepo.ShelfLimitError,
		);

		let listed = await shelvesRepo.listShelves(owner);
		assert.deepEqual(
			listed.shelves[0]?.notebooks.map((item) => item.course.id),
			[first, second],
		);
		assert.equal(
			listed.unshelved.some((item) => item.course.id === first),
			false,
		);

		assert.equal(
			await shelvesRepo.reorderShelf(shelf.id, [second, first], owner),
			true,
		);
		assert.equal(
			await shelvesRepo.reorderShelf(shelf.id, [second], owner),
			false,
		);
		assert.equal(
			await shelvesRepo.reorderShelf(shelf.id, [first, second], stranger),
			false,
		);
		listed = await shelvesRepo.listShelves(owner);
		assert.deepEqual(
			listed.shelves[0]?.notebooks.map((item) => item.course.id),
			[second, first],
		);

		assert.equal((await shelvesRepo.listShelves(stranger)).shelves.length, 0);
		assert.equal(
			await shelvesRepo.renameShelf(shelf.id, stranger, "Mine now"),
			null,
		);
		assert.equal(
			(await shelvesRepo.renameShelf(shelf.id, owner, "APIs"))?.name,
			"APIs",
		);

		assert.equal(
			await shelvesRepo.removeNotebookFromShelf(shelf.id, first, owner),
			true,
		);
		assert.equal(await shelvesRepo.deleteShelf(shelf.id, stranger), false);
		assert.equal(await shelvesRepo.deleteShelf(shelf.id, owner), true);
		assert.equal((await shelvesRepo.listShelves(owner)).shelves.length, 0);
	} finally {
		await database
			.delete(schema.shelves)
			.where(inArray(schema.shelves.ownerId, userIds));
		if (courseIds.length > 0) {
			await database
				.delete(schema.courses)
				.where(inArray(schema.courses.id, courseIds));
		}
		for (const id of userIds) {
			await database.delete(schema.authUser).where(eq(schema.authUser.id, id));
		}
	}
});
