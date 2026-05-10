import { CORE_PROMISE } from "@benkyou/core";
import { Button, ContentPanel, StatusBadge } from "@benkyou/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { requireSignedIn } from "#/features/auth/guards";
import BetterAuthHeader from "#/integrations/better-auth/header-user";
import { WorkspacePage } from "#components/workspace-layout";

export const Route = createFileRoute("/_workspace/settings")({
	beforeLoad: async ({ location }) => {
		const currentUser = await requireSignedIn(location.href);

		return { currentUser };
	},
	component: SettingsPage,
});

function SettingsPage() {
	const { currentUser } = Route.useRouteContext();

	return (
		<WorkspacePage
			title="Settings"
			description="Account state and sync readiness."
			maxWidth="narrow"
			action={<BetterAuthHeader />}
		>
			<ContentPanel className="p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<StatusBadge tone="success">Signed in</StatusBadge>
						<h1 className="mt-3 font-semibold text-2xl tracking-normal">
							{currentUser.name}
						</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							{currentUser.email}
						</p>
					</div>
					<Button asChild variant="outline" size="sm">
						<Link to="/">{CORE_PROMISE}</Link>
					</Button>
				</div>
			</ContentPanel>

			<ContentPanel className="p-5">
				<h2 className="font-semibold text-base">Phase 2 account state</h2>
				<div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
					<div className="rounded-md border border-border p-3">
						<p className="font-medium">Session</p>
						<p className="mt-1 text-muted-foreground">Active</p>
					</div>
					<div className="rounded-md border border-border p-3">
						<p className="font-medium">Persistence</p>
						<p className="mt-1 text-muted-foreground">Database backed</p>
					</div>
					<div className="rounded-md border border-border p-3">
						<p className="font-medium">Local use</p>
						<p className="mt-1 text-muted-foreground">Still available</p>
					</div>
				</div>
			</ContentPanel>
		</WorkspacePage>
	);
}
