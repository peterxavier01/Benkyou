import { authClient } from "@benkyou/auth/client";
import { Button } from "@benkyou/ui";
import { Link, useRouter } from "@tanstack/react-router";

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return <div className="size-8 animate-pulse rounded-md bg-muted" />;
  }

  if (session?.user) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="size-8 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted">
            <span className="font-medium text-muted-foreground text-xs">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        )}
        <div className="hidden min-w-0 sm:block">
          <p className="truncate font-medium text-xs">{session.user.name}</p>
          <p className="truncate text-muted-foreground text-xs">
            {session.user.email}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void authClient.signOut().then(() => {
              void router.navigate({ to: "/" });
            });
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/sign-in" search={{ redirect: "/" }}>
        Sign in
      </Link>
    </Button>
  );
}
