import { CORE_PROMISE, PRODUCT_NAME } from "@benkyou/core";
import {
  AppMain,
  AppShell,
  AppSidebar,
  AppSidebarHeader,
  AppSidebarNav,
  AppSidebarNavItem,
  AppTopBar,
  Button,
  ContentPanel,
  HugeIcon,
  StatusBadge,
} from "@benkyou/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { requireSignedIn } from "../features/auth/guards";
import BetterAuthHeader from "../integrations/better-auth/header-user";

export const Route = createFileRoute("/settings")({
  beforeLoad: async ({ location }) => {
    const currentUser = await requireSignedIn(location.href);

    return { currentUser };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { currentUser } = Route.useRouteContext();

  return (
    <AppShell>
      <AppSidebar>
        <AppSidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HugeIcon name="bookOpenCheck" className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">{PRODUCT_NAME}</p>
              <p className="text-muted-foreground text-xs">
                Learning workspace
              </p>
            </div>
          </div>
        </AppSidebarHeader>
        <AppSidebarNav aria-label="Primary navigation">
          <AppSidebarNavItem href="/">
            <HugeIcon name="home" />
            Home
          </AppSidebarNavItem>
          <AppSidebarNavItem href="/courses">
            <HugeIcon name="library" />
            Courses
          </AppSidebarNavItem>
          <AppSidebarNavItem href="/bookmarks">
            <HugeIcon name="bookmark" />
            Bookmarks
          </AppSidebarNavItem>
          <AppSidebarNavItem href="/settings" active>
            <HugeIcon name="settings" />
            Settings
          </AppSidebarNavItem>
        </AppSidebarNav>
      </AppSidebar>

      <AppMain>
        <AppTopBar>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">Settings</p>
            <p className="hidden text-muted-foreground text-xs sm:block">
              Account state and sync readiness.
            </p>
          </div>
          <BetterAuthHeader />
        </AppTopBar>

        <section className="mx-auto grid w-full max-w-5xl gap-4 p-3 sm:p-6">
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
        </section>
      </AppMain>
    </AppShell>
  );
}
