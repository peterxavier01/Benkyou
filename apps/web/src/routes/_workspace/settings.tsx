import { createFileRoute } from "@tanstack/react-router";
import {
	courseLibraryQueryOptions,
	currentUserQueryOptions,
	learningPreferencesQueryOptions,
} from "#/features/workspace/workspace.queries";

export const Route = createFileRoute("/_workspace/settings")({
	loader: async ({ context: { queryClient } }) => {
		const [currentUser, library, preferences] = await Promise.all([
			queryClient.ensureQueryData(currentUserQueryOptions()),
			queryClient.ensureQueryData(courseLibraryQueryOptions()),
			queryClient.ensureQueryData(learningPreferencesQueryOptions()),
		]);

		return { currentUser, library, preferences };
	},
});
