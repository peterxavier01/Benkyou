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
	const { tab } = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<SettingsScreen
			currentUser={currentUser}
			initialLibrary={library}
			initialPreferences={preferences}
			tab={tab ?? "account"}
			onTabChange={(next) =>
				void navigate({ search: { tab: next }, replace: true })
			}
		/>
	);
}

function SettingsPendingRoute() {
	return (
		<WorkspacePage
			title="Settings"
			description="Your account, how the player behaves, and your data."
			maxWidth="narrow"
		>
			<div className="grid gap-6">
				<div className="flex gap-6 border-border border-b pb-3">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-20" />
				</div>
				{[0, 1].map((group) => (
					<div key={group} className="grid gap-3">
						<Skeleton className="h-6 w-32" />
						<ContentPanel className="grid gap-4 p-5">
							<Skeleton className="h-4 w-48 max-w-full" />
							<Skeleton className="h-4 w-72 max-w-full" />
						</ContentPanel>
					</div>
				))}
				<output className="sr-only">Loading settings</output>
			</div>
		</WorkspacePage>
	);
}
