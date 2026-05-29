import { ContentPanel, Skeleton } from "@benkyou/ui";
import { createLazyFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "#/components/workspace-layout";
import { SettingsScreen } from "#/features/courses/components/settings-screen";

export const Route = createLazyFileRoute("/_workspace/settings")({
	component: SettingsPage,
	pendingComponent: SettingsPendingRoute,
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

function SettingsPendingRoute() {
	return (
		<WorkspacePage
			title="Settings"
			description="Tune playback, exports, and account preferences."
			maxWidth="wide"
		>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
				<ContentPanel className="p-5">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="mt-2 h-4 w-72 max-w-full" />
					<div className="mt-5 space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</ContentPanel>
				<ContentPanel className="p-5">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="mt-4 h-24 w-full" />
				</ContentPanel>
			</div>
			<ContentPanel className="p-5">
				<Skeleton className="h-6 w-36" />
				<Skeleton className="mt-4 h-32 w-full" />
			</ContentPanel>
		</WorkspacePage>
	);
}
