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
  Input,
  Progress,
  StatusBadge,
} from "@benkyou/ui";
import { createFileRoute, Link } from "@tanstack/react-router";

import BetterAuthHeader from "../integrations/better-auth/header-user";

export const Route = createFileRoute("/")({ component: Home });

const learningLoopSteps = [
  "Generate a course outline from one YouTube video.",
  "Jump through chapters with a dense course sidebar.",
  "Write Markdown notes per chapter.",
  "Save bookmarks and resume where you left off.",
];

function Home() {
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
          <AppSidebarNavItem href="/" active>
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
          <AppSidebarNavItem href="/settings">
            <HugeIcon name="settings" />
            Settings
          </AppSidebarNavItem>
        </AppSidebarNav>
      </AppSidebar>

      <AppMain>
        <AppTopBar>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground md:hidden">
              <HugeIcon name="bookOpenCheck" className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-sm">{PRODUCT_NAME}</p>
              <p className="hidden text-muted-foreground text-xs sm:block">
                Local-first study from one video.
              </p>
            </div>
          </div>
          <BetterAuthHeader />
        </AppTopBar>

        <section className="mx-auto grid w-full max-w-7xl gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ContentPanel className="flex min-h-[500px] flex-col justify-center p-4 sm:p-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="success">Local-first MVP</StatusBadge>
                <span className="text-muted-foreground text-xs">
                  YouTube supported for launch
                </span>
              </div>
              <h1 className="mt-4 max-w-2xl font-semibold text-3xl leading-tight tracking-normal sm:text-4xl">
                {CORE_PROMISE}
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground text-base leading-7">
                Paste a YouTube URL, then study with chapters, notes, bookmarks,
                and progress in one recoverable workspace.
              </p>

              <form className="mt-8 max-w-2xl">
                <label
                  htmlFor="course-url"
                  className="mb-2 block font-medium text-sm"
                >
                  Video URL
                </label>
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2 sm:flex-row">
                  <Input
                    id="course-url"
                    name="url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-11 flex-1 bg-card"
                  />
                  <Button type="submit" className="h-11 px-4">
                    Generate course
                    <HugeIcon name="arrowRight" className="size-4" />
                  </Button>
                </div>
              </form>

              <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-3">
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start px-0 text-primary hover:bg-transparent hover:text-primary/80"
                >
                  <Link to="/">
                    <HugeIcon name="playCircle" className="size-4" />
                    Try sample course
                  </Link>
                </Button>
                <span className="text-muted-foreground">
                  Vimeo and Loom are planned, but disabled for the MVP.
                </span>
              </div>
            </div>
          </ContentPanel>

          <ContentPanel className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <HugeIcon name="list" className="size-5 text-primary" />
                <h2 className="font-semibold text-base">MVP learning loop</h2>
              </div>
              <span className="text-muted-foreground text-xs">4 steps</span>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Sample course readiness</span>
                  <span className="text-muted-foreground">64%</span>
                </div>
                <Progress value={64} />
              </div>
              <ul className="space-y-2.5 text-sm">
                {learningLoopSteps.map((step, index) => (
                  <li
                    key={step}
                    className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-2"
                  >
                    <span className="flex size-6 items-center justify-center rounded-md border border-primary/20 bg-primary/10 font-semibold text-primary text-xs">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Next milestone</span>
                  <StatusBadge tone="neutral">Queued</StatusBadge>
                </div>
                <p className="mt-2 text-muted-foreground text-sm leading-6">
                  Wire the URL submission into a generation job, then open the
                  course player when chapters are ready.
                </p>
              </div>
            </div>
          </ContentPanel>
        </section>
      </AppMain>
    </AppShell>
  );
}
