import { authClient } from "@benkyou/auth/client";
import { Button } from "@benkyou/ui";
import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";
import { SettingsGroup, SettingsRow } from "./settings-parts";
import type { SettingsUser } from "./settings-types";

function AccountSection({ currentUser }: { currentUser: SettingsUser }) {
	const router = useRouter();
	const [signingOut, setSigningOut] = useState(false);

	if (!currentUser) {
		return (
			<SettingsGroup
				title="You’re not signed in"
				description="Sign in to keep your notebooks private and pick them up on any device."
			>
				<SettingsRow
					label="Account"
					description="Notebooks made without an account aren’t tied to you."
					control={
						<div className="flex flex-wrap gap-2">
							<Button asChild>
								<Link to="/sign-in" search={{ redirect: "/settings" }}>
									Sign in
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link
									to="/sign-in"
									search={{ redirect: "/settings", mode: "sign-up" }}
								>
									Create an account
								</Link>
							</Button>
						</div>
					}
				/>
			</SettingsGroup>
		);
	}

	return (
		<>
			<SettingsGroup title="Profile">
				<SettingsRow label="Name" control={<Value>{currentUser.name}</Value>} />
				<SettingsRow
					label="Email"
					description="Used to sign in."
					control={<Value>{currentUser.email}</Value>}
				/>
			</SettingsGroup>
			<SettingsGroup title="Session">
				<SettingsRow
					label="Sign out"
					description="Your notebooks stay in your account."
					control={
						<Button
							type="button"
							variant="outline"
							disabled={signingOut}
							onClick={async () => {
								setSigningOut(true);
								await authClient.signOut();
								trackAnalyticsEvent("sign_out_succeeded");
								await router.navigate({ to: "/" });
							}}
						>
							{signingOut ? "Signing out…" : "Sign out"}
						</Button>
					}
				/>
			</SettingsGroup>
		</>
	);
}

function Value({ children }: { children: string }) {
	return (
		<span className="block max-w-full truncate text-muted-foreground text-sm sm:max-w-72">
			{children}
		</span>
	);
}

export { AccountSection };
