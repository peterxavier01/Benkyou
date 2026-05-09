import { Button, HugeIcon } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";

import { AppHeader } from "#components/app-header";

import { AuthForm } from "./auth-form";
import { AuthIntroPanel } from "./auth-intro-panel";

type SignInScreenProps = {
  redirectTo: string;
};

function SignInScreen({ redirectTo }: SignInScreenProps) {
  return (
    <main className="min-h-dvh bg-background text-foreground">
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

      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 md:grid-cols-[minmax(0,1fr)_420px] md:px-6 lg:py-10">
        <AuthIntroPanel />

        <section className="flex items-center">
          <AuthForm redirectTo={redirectTo} />
        </section>
      </div>
    </main>
  );
}

export { SignInScreen };
