import { and, eq, lt, sql } from "drizzle-orm";

import { db } from "./drizzle";
import {
	authSession,
	authUser,
	bookmarks,
	chapterNotes,
	chapterProgress,
	courseProgress,
	courses,
	learningPreferences,
	shelves,
} from "./schema";

/*
 * Signed-out learners own their data through an anonymous Better Auth user.
 * When they sign up or sign in, everything moves to the account, and an
 * anonymous user that is never claimed is eventually pruned.
 */

/**
 * Moves every notebook, shelf, note, progress row, and bookmark from one user
 * to another. The account keeps its own learning preferences when it has them.
 */
export async function transferLearnerData(
	fromUserId: string,
	toUserId: string,
) {
	if (fromUserId === toUserId) {
		return;
	}

	await db.transaction(async (tx) => {
		await tx
			.update(courses)
			.set({ ownerId: toUserId })
			.where(eq(courses.ownerId, fromUserId));
		await tx
			.update(shelves)
			.set({ ownerId: toUserId })
			.where(eq(shelves.ownerId, fromUserId));

		// Rows are unique per user and chapter or notebook. The anonymous user
		// only reaches their own notebooks, so clashes shouldn't happen, but
		// the account's row wins if one does.
		await tx.execute(sql`
			delete from ${chapterNotes} as moving
			using ${chapterNotes} as kept
			where moving.user_id = ${fromUserId}
				and kept.user_id = ${toUserId}
				and kept.chapter_id = moving.chapter_id
		`);
		await tx.execute(sql`
			delete from ${chapterProgress} as moving
			using ${chapterProgress} as kept
			where moving.user_id = ${fromUserId}
				and kept.user_id = ${toUserId}
				and kept.chapter_id = moving.chapter_id
		`);
		await tx.execute(sql`
			delete from ${courseProgress} as moving
			using ${courseProgress} as kept
			where moving.user_id = ${fromUserId}
				and kept.user_id = ${toUserId}
				and kept.course_id = moving.course_id
		`);

		for (const table of [
			chapterNotes,
			chapterProgress,
			courseProgress,
			bookmarks,
		]) {
			await tx
				.update(table)
				.set({ userId: toUserId })
				.where(eq(table.userId, fromUserId));
		}

		const [kept] = await tx
			.select({ userId: learningPreferences.userId })
			.from(learningPreferences)
			.where(eq(learningPreferences.userId, toUserId));
		if (kept) {
			await tx
				.delete(learningPreferences)
				.where(eq(learningPreferences.userId, fromUserId));
		} else {
			await tx
				.update(learningPreferences)
				.set({ userId: toUserId })
				.where(eq(learningPreferences.userId, fromUserId));
		}
	});
}

/**
 * Deletes a user's notebooks, shelves, and per-user rows. Notebooks don't
 * reference users by foreign key, so deleting the user alone leaves them.
 */
export async function deleteLearnerData(userId: string) {
	await db.transaction(async (tx) => {
		await tx.delete(shelves).where(eq(shelves.ownerId, userId));
		await tx.delete(courses).where(eq(courses.ownerId, userId));
		for (const table of [
			chapterNotes,
			chapterProgress,
			courseProgress,
			bookmarks,
		]) {
			await tx.delete(table).where(eq(table.userId, userId));
		}
		await tx.delete(authUser).where(eq(authUser.id, userId));
	});
}

/**
 * Removes anonymous users with no session activity since `before`, along with
 * their data. Returns how many users were removed.
 */
export async function pruneAnonymousUsers(before: Date) {
	const active = db
		.selectDistinct({ userId: authSession.userId })
		.from(authSession)
		.where(sql`${authSession.updatedAt} >= ${before}`);
	const stale = await db
		.select({ id: authUser.id })
		.from(authUser)
		.where(
			and(
				eq(authUser.isAnonymous, true),
				lt(authUser.updatedAt, before),
				sql`${authUser.id} not in ${active}`,
			),
		);

	for (const user of stale) {
		await deleteLearnerData(user.id);
	}

	return stale.length;
}
