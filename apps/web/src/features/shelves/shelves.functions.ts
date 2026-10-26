import {
	addNotebookToShelfRequestV1Schema,
	createShelfRequestV1Schema,
	deleteShelfRequestV1Schema,
	MAX_NOTEBOOKS_PER_SHELF,
	MAX_SHELVES_PER_USER,
	removeNotebookFromShelfRequestV1Schema,
	renameShelfRequestV1Schema,
	reorderShelfRequestV1Schema,
} from "@benkyou/core";
import type {
	CreateShelfResponseV1,
	DeleteShelfResponseV1,
	GetShelvesResponseV1,
	RenameShelfResponseV1,
	UpdateShelfNotebooksResponseV1,
} from "@benkyou/types";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

type ShelvesServer = typeof import("./shelves.server");

let shelvesServerPromise: Promise<ShelvesServer> | null = null;

const getShelvesServer = createServerOnlyFn(() => {
	shelvesServerPromise ??= import("./shelves.server");
	return shelvesServerPromise;
});

async function getUserId() {
	const { getCurrentUserFromHeaders } = await getShelvesServer();
	const user = await getCurrentUserFromHeaders(
		new Headers(getRequestHeaders()),
	);
	return user?.id ?? null;
}

/** Shelves need an account: notebooks without an owner aren't private. */
async function requireUserId() {
	const userId = await getUserId();
	if (!userId) {
		throw new Error("Sign in to use shelves.");
	}
	return userId;
}

async function loadShelf(shelfId: string, userId: string) {
	const { getShelfRecord } = await getShelvesServer();
	const shelf = await getShelfRecord(shelfId, userId);
	if (!shelf) {
		throw new Error("Shelf was not found.");
	}
	return shelf;
}

async function withLimitMessage<T>(run: () => Promise<T>): Promise<T> {
	const { ShelfLimitError } = await getShelvesServer();
	try {
		return await run();
	} catch (error) {
		if (error instanceof ShelfLimitError) {
			throw new Error(error.message);
		}
		throw error;
	}
}

export const getShelves = createServerFn({ method: "GET" }).handler(
	async (): Promise<GetShelvesResponseV1> => {
		const userId = await getUserId();
		if (!userId) {
			return { available: false, shelves: [], unshelved: [] };
		}
		const { listShelfRecords } = await getShelvesServer();
		const result = await listShelfRecords(userId);
		return { available: true, ...result };
	},
);

export const createShelf = createServerFn({ method: "POST" })
	.validator((input) => createShelfRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<CreateShelfResponseV1> => {
		const userId = await requireUserId();
		const { createShelfRecord } = await getShelvesServer();
		const shelf = await withLimitMessage(() =>
			createShelfRecord(userId, data.name, MAX_SHELVES_PER_USER),
		);
		return { shelf };
	});

export const renameShelf = createServerFn({ method: "POST" })
	.validator((input) => renameShelfRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<RenameShelfResponseV1> => {
		const userId = await requireUserId();
		const { renameShelfRecord } = await getShelvesServer();
		const shelf = await renameShelfRecord(data.shelfId, userId, data.name);
		if (!shelf) {
			throw new Error("Shelf was not found.");
		}
		return { shelf };
	});

export const deleteShelf = createServerFn({ method: "POST" })
	.validator((input) => deleteShelfRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<DeleteShelfResponseV1> => {
		const userId = await requireUserId();
		const { deleteShelfRecord } = await getShelvesServer();
		return { deleted: await deleteShelfRecord(data.shelfId, userId) };
	});

export const addNotebookToShelf = createServerFn({ method: "POST" })
	.validator((input) => addNotebookToShelfRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpdateShelfNotebooksResponseV1> => {
		const userId = await requireUserId();
		const { addNotebookToShelfRecord } = await getShelvesServer();
		const added = await withLimitMessage(() =>
			addNotebookToShelfRecord(
				data.shelfId,
				data.courseId,
				userId,
				MAX_NOTEBOOKS_PER_SHELF,
			),
		);
		if (!added) {
			throw new Error("That shelf or notebook was not found.");
		}
		return { shelf: await loadShelf(data.shelfId, userId) };
	});

export const removeNotebookFromShelf = createServerFn({ method: "POST" })
	.validator((input) =>
		removeNotebookFromShelfRequestV1Schema.parse(input),
	)
	.handler(async ({ data }): Promise<UpdateShelfNotebooksResponseV1> => {
		const userId = await requireUserId();
		const { removeNotebookFromShelfRecord } = await getShelvesServer();
		const removed = await removeNotebookFromShelfRecord(
			data.shelfId,
			data.courseId,
			userId,
		);
		if (!removed) {
			throw new Error("Shelf was not found.");
		}
		return { shelf: await loadShelf(data.shelfId, userId) };
	});

export const reorderShelf = createServerFn({ method: "POST" })
	.validator((input) => reorderShelfRequestV1Schema.parse(input))
	.handler(async ({ data }): Promise<UpdateShelfNotebooksResponseV1> => {
		const userId = await requireUserId();
		const { reorderShelfRecord } = await getShelvesServer();
		const saved = await reorderShelfRecord(
			data.shelfId,
			data.courseIds,
			userId,
		);
		if (!saved) {
			throw new Error(
				"The shelf changed since you opened it. Reload and try again.",
			);
		}
		return { shelf: await loadShelf(data.shelfId, userId) };
	});
