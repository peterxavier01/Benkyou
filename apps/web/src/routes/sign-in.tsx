import { createFileRoute } from "@tanstack/react-router";

import { SignInScreen } from "#/features/auth/components/sign-in-screen";
import { buildNoIndexHead } from "#lib/seo";

export const Route = createFileRoute("/sign-in")({
	validateSearch: (
		search: Record<string, unknown>,
	): { redirect: string; mode?: "sign-in" | "sign-up" } => ({
		redirect: typeof search.redirect === "string" ? search.redirect : "/",
		mode: search.mode === "sign-up" ? "sign-up" : undefined,
	}),
	head: () =>
		buildNoIndexHead(
			"Sign in | Benkyou",
			"Sign in to keep your notebooks, notes, bookmarks and progress with you on any device.",
		),
	component: SignInPage,
});

function SignInPage() {
	const search = Route.useSearch();

	return (
		<SignInScreen
			redirectTo={search.redirect}
			initialMode={search.mode ?? "sign-in"}
		/>
	);
}
