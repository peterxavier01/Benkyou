import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";

/**
 * Drops data cached for the previous session after signing in, signing up or
 * signing out. Workspace query keys aren't scoped to a user, so without this
 * the old session's notebooks, bookmarks and shelves stay "fresh" until their
 * stale time runs out. Router loader data is cleared too, because screens seed
 * their queries from it and would otherwise bring the old session's data back.
 */
export function useResetSessionData() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useCallback(async () => {
		router.clearCache();
		await queryClient.resetQueries();
		await router.invalidate();
	}, [queryClient, router]);
}
