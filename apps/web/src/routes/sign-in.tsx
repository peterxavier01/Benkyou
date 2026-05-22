import { createFileRoute } from "@tanstack/react-router";

import { SignInScreen } from "#/features/auth/components/sign-in-screen";
import { buildNoIndexHead } from "#lib/seo";

export const Route = createFileRoute("/sign-in")({
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: typeof search.redirect === "string" ? search.redirect : "/",
	}),
	head: () =>
		buildNoIndexHead(
			"Sign in | Benkyou",
			"Sign in to resume saved courses, notes, bookmarks, and learning preferences.",
		),
	component: SignInPage,
});

function SignInPage() {
	const search = Route.useSearch();

	return <SignInScreen redirectTo={search.redirect} />;
}
