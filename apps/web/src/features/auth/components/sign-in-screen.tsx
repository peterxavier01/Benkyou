import { BrandLogo } from "#components/brand-logo";
import { AuthForm } from "./auth-form";
import { AuthIntroPanel } from "./auth-intro-panel";

type SignInScreenProps = {
	redirectTo: string;
	initialMode?: "sign-in" | "sign-up";
};

function SignInScreen({
	redirectTo,
	initialMode = "sign-in",
}: SignInScreenProps) {
	return (
		<main className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
			<div className="flex flex-col px-5 py-5 sm:px-10 sm:py-8">
				<BrandLogo to="/" subtitle={null} />
				<div className="mx-auto flex w-full max-w-[400px] flex-1 items-center py-10 sm:py-16">
					<AuthForm redirectTo={redirectTo} initialMode={initialMode} />
				</div>
			</div>
			<AuthIntroPanel />
		</main>
	);
}

export { SignInScreen };
