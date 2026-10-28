import type { GetShelvesResponseV1 } from "@benkyou/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { workspaceQueryKeys } from "#/features/workspace/workspace.queries";
import {
	addNotebookToShelf,
	createShelf,
	deleteShelf,
	removeNotebookFromShelf,
	renameShelf,
	reorderShelf,
} from "./shelves.functions";

/** Every shelf mutation, each refreshing the shelves query when it settles. */
function useShelfMutations() {
	const queryClient = useQueryClient();
	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.shelves });

	const create = useServerFn(createShelf);
	const rename = useServerFn(renameShelf);
	const remove = useServerFn(deleteShelf);
	const add = useServerFn(addNotebookToShelf);
	const takeOff = useServerFn(removeNotebookFromShelf);
	const reorder = useServerFn(reorderShelf);

	return {
		create: useMutation({
			mutationFn: (name: string) => create({ data: { name } }),
			onSettled: refresh,
		}),
		rename: useMutation({
			mutationFn: (input: { shelfId: string; name: string }) =>
				rename({ data: input }),
			onSettled: refresh,
		}),
		remove: useMutation({
			mutationFn: (shelfId: string) => remove({ data: { shelfId } }),
			onSettled: refresh,
		}),
		addNotebook: useMutation({
			mutationFn: (input: { shelfId: string; courseId: string }) =>
				add({ data: input }),
			onSettled: refresh,
		}),
		removeNotebook: useMutation({
			mutationFn: (input: { shelfId: string; courseId: string }) =>
				takeOff({ data: input }),
			onSettled: refresh,
		}),
		reorder: useMutation({
			mutationFn: (input: { shelfId: string; courseIds: string[] }) =>
				reorder({ data: input }),
			// Show the new order straight away; the refetch confirms it.
			onMutate: async ({ shelfId, courseIds }) => {
				await queryClient.cancelQueries({
					queryKey: workspaceQueryKeys.shelves,
				});
				queryClient.setQueryData<GetShelvesResponseV1>(
					workspaceQueryKeys.shelves,
					(current) =>
						current && {
							...current,
							shelves: current.shelves.map((entry) => {
								if (entry.shelf.id !== shelfId) {
									return entry;
								}
								const byId = new Map(
									entry.notebooks.map((item) => [item.course.id, item]),
								);
								return {
									...entry,
									notebooks: courseIds.flatMap((id) => {
										const item = byId.get(id);
										return item ? [item] : [];
									}),
								};
							}),
						},
				);
			},
			onSettled: refresh,
		}),
	};
}

export { useShelfMutations };
