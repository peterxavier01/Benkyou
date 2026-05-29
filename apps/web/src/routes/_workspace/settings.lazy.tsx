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
			description="Account state, learning preferences, and data ownership."
			maxWidth="narrow"
		>
			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="mt-3 h-7 w-44 max-w-full" />
						<Skeleton className="mt-2 h-4 w-80 max-w-full" />
					</div>
					<Skeleton className="h-9 w-32 shrink-0" />
				</div>
			</ContentPanel>

			<ContentPanel className="p-4 sm:p-5">
				<Skeleton className="h-5 w-40" />
				<Skeleton className="mt-2 h-4 w-80 max-w-full" />
				<div className="mt-4 grid gap-4">
					<div className="grid gap-2">
						<Skeleton className="h-4 w-36" />
						<Skeleton className="h-10 w-full sm:w-52" />
					</div>
					<div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
						<div className="min-w-0 flex-1">
							<Skeleton className="h-4 w-40 max-w-full" />
							<Skeleton className="mt-2 h-3 w-72 max-w-full" />
						</div>
						<Skeleton className="h-5 w-9 shrink-0 rounded-full" />
					</div>
					<div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
						<div className="min-w-0 flex-1">
							<Skeleton className="h-4 w-40 max-w-full" />
							<Skeleton className="mt-2 h-3 w-72 max-w-full" />
						</div>
						<Skeleton className="h-5 w-9 shrink-0 rounded-full" />
					</div>
					<div className="flex justify-end">
						<Skeleton className="h-10 w-36" />
					</div>
				</div>
			</ContentPanel>

			<ContentPanel className="overflow-hidden p-4 sm:p-5">
				<div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] lg:items-end">
					<div className="min-w-0">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="mt-2 h-4 w-96 max-w-full" />
					</div>
					<div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full sm:w-24" />
					</div>
				</div>
			</ContentPanel>

			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="mt-2 h-4 w-96 max-w-full" />
					</div>
					<Skeleton className="h-10 w-36 shrink-0" />
				</div>
			</ContentPanel>

			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<Skeleton className="h-5 w-28" />
						<Skeleton className="mt-2 h-4 w-80 max-w-full" />
					</div>
					<Skeleton className="h-10 w-28 shrink-0" />
				</div>
			</ContentPanel>
		</WorkspacePage>
	);
}
