import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "#/features/auth/auth.functions";
import { SettingsScreen } from "#/features/courses/components/settings-screen";
import {
	getCourseLibrary,
	getLearningPreferences,
} from "#/features/courses/course-workspace.functions";

export const Route = createFileRoute("/_workspace/settings")({
	loader: async () => {
		const [currentUser, library, preferences] = await Promise.all([
			getCurrentUser(),
			getCourseLibrary(),
			getLearningPreferences(),
		]);

		return { currentUser, library, preferences };
	},
	component: SettingsPage,
});

function SettingsPage() {
	const { currentUser, library, preferences } = Route.useLoaderData();

	return (
		<SettingsScreen
			currentUser={currentUser}
			initialLibrary={library}
			initialPreferences={preferences}
		/>
	);
}
