import { Button, HugeIcon } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";

import { AppHeader } from "#components/app-header";
import { PublicFooter } from "#components/public-trust-links";

import { AuthForm } from "./auth-form";
import { AuthIntroPanel } from "./auth-intro-panel";

type SignInScreenProps = {
	redirectTo: string;
};

function SignInScreen({ redirectTo }: SignInScreenProps) {
	return (
		<main className="flex min-h-dvh flex-col bg-background text-foreground">
			<AppHeader
				subtitle="Learning workspace"
				action={
					<Button asChild variant="outline" size="sm">
						<Link to="/" className="gap-2">
							<HugeIcon name="playCircle" className="size-4" />
							Continue locally
						</Link>
					</Button>
				}
			/>

			<div className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-4 px-4 py-6 md:grid-cols-[minmax(0,1fr)_420px] md:px-6 lg:py-10">
				<section className="order-2 md:order-1">
					<AuthIntroPanel />
				</section>

				<section className="order-1 flex items-center md:order-2">
					<AuthForm redirectTo={redirectTo} />
				</section>
			</div>
			<PublicFooter />
		</main>
	);
}

export { SignInScreen };
