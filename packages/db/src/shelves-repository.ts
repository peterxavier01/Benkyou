import type {
	CourseLibraryItemDTO,
	ShelfDTO,
	ShelfWithNotebooksDTO,
} from "@benkyou/types";
import { and, asc, count, eq, inArray, isNull, max } from "drizzle-orm";

import { db } from "./drizzle";
import { getCourseLibrary } from "./repositories";
import { courses, shelfCourses, shelves } from "./schema";

/*
 * Shelves always belong to a user, signed in or anonymous, so every function
 * here takes a non-null user id and checks that the shelf, and any notebook
 * added to it, belong to that user.
 */

export class ShelfLimitError extends Error {}

function mapShelf(row: typeof shelves.$inferSelect): ShelfDTO {
	return {
		id: row.id,
		ownerId: row.ownerId,
		name: row.name,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function ownedShelf(shelfId: string, userId: string) {
	return and(
		eq(shelves.id, shelfId),
		eq(shelves.ownerId, userId),
		isNull(shelves.deletedAt),
	);
}

export async function listShelves(userId: string): Promise<{
	shelves: ShelfWithNotebooksDTO[];
	unshelved: CourseLibraryItemDTO[];
}> {
	const [library, shelfRows] = await Promise.all([
		getCourseLibrary(userId),
		db
			.select()
			.from(shelves)
			.where(and(eq(shelves.ownerId, userId), isNull(shelves.deletedAt)))
			.orderBy(asc(shelves.createdAt)),
	]);

	const memberships =
		shelfRows.length === 0
			? []
			: await db
					.select()
					.from(shelfCourses)
					.where(
						inArray(
							shelfCourses.shelfId,
							shelfRows.map((row) => row.id),
						),
					)
					.orderBy(asc(shelfCourses.position));

	// The library only holds the user's live notebooks, so deleted notebooks
	// drop out of shelves here without extra filtering.
	const notebookById = new Map(library.map((item) => [item.course.id, item]));
	const shelved = new Set<string>();
	const notebooksByShelf = new Map<string, CourseLibraryItemDTO[]>();

	for (const membership of memberships) {
		const item = notebookById.get(membership.courseId);
		if (!item) {
			continue;
		}
		shelved.add(item.course.id);
		const list = notebooksByShelf.get(membership.shelfId) ?? [];
		list.push(item);
		notebooksByShelf.set(membership.shelfId, list);
	}

	return {
		shelves: shelfRows.map((row) => ({
			shelf: mapShelf(row),
			notebooks: notebooksByShelf.get(row.id) ?? [],
		})),
		unshelved: library.filter((item) => !shelved.has(item.course.id)),
	};
}

export async function getShelf(
	shelfId: string,
	userId: string,
): Promise<ShelfWithNotebooksDTO | null> {
	const { shelves: all } = await listShelves(userId);
	return all.find((entry) => entry.shelf.id === shelfId) ?? null;
}

export async function createShelf(
	userId: string,
	name: string,
	limit: number,
): Promise<ShelfDTO> {
	const [existing] = await db
		.select({ value: count() })
		.from(shelves)
		.where(and(eq(shelves.ownerId, userId), isNull(shelves.deletedAt)));

	if ((existing?.value ?? 0) >= limit) {
		throw new ShelfLimitError(`You can have up to ${limit} shelves.`);
	}

	const [row] = await db
		.insert(shelves)
		.values({ ownerId: userId, name })
		.returning();

	return mapShelf(row);
}

export async function renameShelf(
	shelfId: string,
	userId: string,
	name: string,
): Promise<ShelfDTO | null> {
	const [row] = await db
		.update(shelves)
		.set({ name, updatedAt: new Date() })
		.where(ownedShelf(shelfId, userId))
		.returning();

	return row ? mapShelf(row) : null;
}

export async function deleteShelf(
	shelfId: string,
	userId: string,
): Promise<boolean> {
	const deletedAt = new Date();
	const rows = await db
		.update(shelves)
		.set({ deletedAt, updatedAt: deletedAt })
		.where(ownedShelf(shelfId, userId))
		.returning({ id: shelves.id });

	return rows.length > 0;
}

/** Adds a notebook to the end of a shelf. Returns false if either isn't the user's. */
export async function addNotebookToShelf(
	shelfId: string,
	courseId: string,
	userId: string,
	limit: number,
): Promise<boolean> {
	return db.transaction(async (tx) => {
		const [shelf] = await tx
			.select({ id: shelves.id })
			.from(shelves)
			.where(ownedShelf(shelfId, userId))
			.for("update");
		const [course] = await tx
			.select({ id: courses.id })
			.from(courses)
			.where(
				and(
					eq(courses.id, courseId),
					eq(courses.ownerId, userId),
					isNull(courses.deletedAt),
				),
			);

		if (!shelf || !course) {
			return false;
		}

		const [stats] = await tx
			.select({ total: count(), last: max(shelfCourses.position) })
			.from(shelfCourses)
			.where(eq(shelfCourses.shelfId, shelfId));

		if ((stats?.total ?? 0) >= limit) {
			throw new ShelfLimitError(`A shelf can hold up to ${limit} notebooks.`);
		}

		await tx
			.insert(shelfCourses)
			.values({ shelfId, courseId, position: (stats?.last ?? -1) + 1 })
			.onConflictDoNothing();
		await tx
			.update(shelves)
			.set({ updatedAt: new Date() })
			.where(eq(shelves.id, shelfId));

		return true;
	});
}

export async function removeNotebookFromShelf(
	shelfId: string,
	courseId: string,
	userId: string,
): Promise<boolean> {
	return db.transaction(async (tx) => {
		const [shelf] = await tx
			.select({ id: shelves.id })
			.from(shelves)
			.where(ownedShelf(shelfId, userId));

		if (!shelf) {
			return false;
		}

		await tx
			.delete(shelfCourses)
			.where(
				and(
					eq(shelfCourses.shelfId, shelfId),
					eq(shelfCourses.courseId, courseId),
				),
			);
		await tx
			.update(shelves)
			.set({ updatedAt: new Date() })
			.where(eq(shelves.id, shelfId));

		return true;
	});
}

/**
 * Saves a new order. `courseIds` must list exactly the notebooks already on
 * the shelf; anything else is rejected so a stale client can't drop or add
 * notebooks by reordering.
 */
export async function reorderShelf(
	shelfId: string,
	courseIds: string[],
	userId: string,
): Promise<boolean> {
	return db.transaction(async (tx) => {
		const [shelf] = await tx
			.select({ id: shelves.id })
			.from(shelves)
			.where(ownedShelf(shelfId, userId))
			.for("update");

		if (!shelf) {
			return false;
		}

		const current = await tx
			.select({ courseId: shelfCourses.courseId })
			.from(shelfCourses)
			.where(eq(shelfCourses.shelfId, shelfId));
		const currentIds = new Set(current.map((row) => row.courseId));
		const isPermutation =
			courseIds.length === currentIds.size &&
			new Set(courseIds).size === courseIds.length &&
			courseIds.every((id) => currentIds.has(id));

		if (!isPermutation) {
			return false;
		}

		for (const [position, courseId] of courseIds.entries()) {
			await tx
				.update(shelfCourses)
				.set({ position })
				.where(
					and(
						eq(shelfCourses.shelfId, shelfId),
						eq(shelfCourses.courseId, courseId),
					),
				);
		}
		await tx
			.update(shelves)
			.set({ updatedAt: new Date() })
			.where(eq(shelves.id, shelfId));

		return true;
	});
}
