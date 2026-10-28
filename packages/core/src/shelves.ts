import type {
	AddNotebookToShelfRequestV1,
	CourseLibraryItemDTO,
	CreateShelfRequestV1,
	DeleteShelfRequestV1,
	RemoveNotebookFromShelfRequestV1,
	RenameShelfRequestV1,
	ReorderShelfRequestV1,
} from "@benkyou/types";
import { z } from "zod";
import { MAX_NOTEBOOKS_PER_SHELF, MAX_SHELF_NAME_LENGTH } from "./constants";

const shelfNameSchema = z
	.string()
	.trim()
	.min(1, "Give the shelf a name.")
	.max(MAX_SHELF_NAME_LENGTH, "That name is too long.");

const shelfIdSchema = z.uuid("Shelf id is invalid.");
const courseIdSchema = z.uuid("Notebook id is invalid.");

export const createShelfRequestV1Schema = z.object({
	name: shelfNameSchema,
}) satisfies z.ZodType<CreateShelfRequestV1>;

export const renameShelfRequestV1Schema = z.object({
	shelfId: shelfIdSchema,
	name: shelfNameSchema,
}) satisfies z.ZodType<RenameShelfRequestV1>;

export const deleteShelfRequestV1Schema = z.object({
	shelfId: shelfIdSchema,
}) satisfies z.ZodType<DeleteShelfRequestV1>;

export const addNotebookToShelfRequestV1Schema = z.object({
	shelfId: shelfIdSchema,
	courseId: courseIdSchema,
}) satisfies z.ZodType<AddNotebookToShelfRequestV1>;

export const removeNotebookFromShelfRequestV1Schema =
	addNotebookToShelfRequestV1Schema satisfies z.ZodType<RemoveNotebookFromShelfRequestV1>;

export const reorderShelfRequestV1Schema = z.object({
	shelfId: shelfIdSchema,
	courseIds: z.array(courseIdSchema).max(MAX_NOTEBOOKS_PER_SHELF),
}) satisfies z.ZodType<ReorderShelfRequestV1>;

/** Move one id up (-1) or down (+1); returns the same order at the edges. */
export function moveInOrder(
	ids: string[],
	id: string,
	direction: -1 | 1,
): string[] {
	const from = ids.indexOf(id);
	const to = from + direction;

	if (from === -1 || to < 0 || to >= ids.length) {
		return ids;
	}

	const next = [...ids];
	[next[from], next[to]] = [next[to], next[from]];
	return next;
}

export interface ShelfSummary {
	notebookCount: number;
	doneCount: number;
	/** Watched share of the shelf, weighted by video length, 0–100. */
	percent: number;
	totalSeconds: number;
	remainingSeconds: number;
	/** First unfinished notebook, in shelf order. */
	next: CourseLibraryItemDTO | null;
}

function completionOf(item: CourseLibraryItemDTO) {
	return Math.min(100, Math.max(0, item.progress?.completionPercent ?? 0));
}

export function summarizeShelf(notebooks: CourseLibraryItemDTO[]): ShelfSummary {
	let totalSeconds = 0;
	let watchedSeconds = 0;
	let percentSum = 0;
	let doneCount = 0;
	let next: CourseLibraryItemDTO | null = null;

	for (const item of notebooks) {
		const completion = completionOf(item);
		const duration = item.video.durationSeconds ?? 0;

		totalSeconds += duration;
		watchedSeconds += (duration * completion) / 100;
		percentSum += completion;

		if (completion >= 100) {
			doneCount += 1;
		} else if (!next) {
			next = item;
		}
	}

	const percent =
		notebooks.length === 0
			? 0
			: totalSeconds > 0
				? (watchedSeconds / totalSeconds) * 100
				: percentSum / notebooks.length;

	return {
		notebookCount: notebooks.length,
		doneCount,
		percent: Math.round(percent),
		totalSeconds,
		remainingSeconds: Math.max(0, Math.round(totalSeconds - watchedSeconds)),
		next,
	};
}
