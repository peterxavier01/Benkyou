import type { CourseLibraryItemDTO } from "./index";

export interface ShelfDTO {
	id: string;
	ownerId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

/** A shelf with its notebooks, in shelf order. */
export interface ShelfWithNotebooksDTO {
	shelf: ShelfDTO;
	notebooks: CourseLibraryItemDTO[];
}

export interface GetShelvesResponseV1 {
	/** False when nobody is signed in: shelves need an account. */
	available: boolean;
	shelves: ShelfWithNotebooksDTO[];
	/** The learner's notebooks that aren't on any shelf. */
	unshelved: CourseLibraryItemDTO[];
}

export interface CreateShelfRequestV1 {
	name: string;
}

export interface CreateShelfResponseV1 {
	shelf: ShelfDTO;
}

export interface RenameShelfRequestV1 {
	shelfId: string;
	name: string;
}

export interface RenameShelfResponseV1 {
	shelf: ShelfDTO;
}

export interface DeleteShelfRequestV1 {
	shelfId: string;
}

export interface DeleteShelfResponseV1 {
	deleted: boolean;
}

export interface AddNotebookToShelfRequestV1 {
	shelfId: string;
	courseId: string;
}

export interface RemoveNotebookFromShelfRequestV1 {
	shelfId: string;
	courseId: string;
}

/** The shelf's notebooks in their new order. Must list every notebook once. */
export interface ReorderShelfRequestV1 {
	shelfId: string;
	courseIds: string[];
}

export interface UpdateShelfNotebooksResponseV1 {
	shelf: ShelfWithNotebooksDTO;
}
