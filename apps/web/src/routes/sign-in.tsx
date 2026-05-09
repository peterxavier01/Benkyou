import { createFileRoute } from "@tanstack/react-router";

import { SignInScreen } from "#/features/auth/components/sign-in-screen";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  component: SignInPage,
});

function SignInPage() {
  const search = Route.useSearch();

  return <SignInScreen redirectTo={search.redirect} />;
}
