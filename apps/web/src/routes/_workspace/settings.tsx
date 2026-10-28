import { createFileRoute } from "@tanstack/react-router";
import {
	courseLibraryQueryOptions,
	currentUserQueryOptions,
	learningPreferencesQueryOptions,
} from "#/features/workspace/workspace.queries";

type SettingsSearch = { tab?: "account" | "learning" | "data" };

export const Route = createFileRoute("/_workspace/settings")({
	validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
		tab:
			search.tab === "account" || search.tab === "data"
				? search.tab
				: search.tab === "learning"
					? "learning"
					: undefined,
	}),
	loader: async ({ context: { queryClient } }) => {
		const [currentUser, library, preferences] = await Promise.all([
			queryClient.query(currentUserQueryOptions()),
			queryClient.query(courseLibraryQueryOptions()),
			queryClient.query(learningPreferencesQueryOptions()),
		]);

		return { currentUser, library, preferences };
	},
});
