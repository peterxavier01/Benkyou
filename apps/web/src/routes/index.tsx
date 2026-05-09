import { CORE_PROMISE, PRODUCT_NAME } from "@benkyou/core";
import {
  AppMain,
  AppShell,
  AppSidebar,
  AppSidebarHeader,
  AppSidebarNav,
  AppSidebarNavItem,
  Button,
  ContentPanel,
  HugeIcon,
  Input,
  Progress,
  StatusBadge,
} from "@benkyou/ui";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppHeader } from "#components/app-header";
import BetterAuthHeader from "../integrations/better-auth/header-user";

export const Route = createFileRoute("/")({ component: Home });

const learningLoopSteps = ["Outline", "Chapters", "Notes", "Bookmarks"];

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
        <AppHeader action={<BetterAuthHeader />} />

        <section className="mx-auto grid w-full max-w-7xl gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ContentPanel className="flex min-h-[420px] flex-col justify-center p-4 sm:p-7">
            <div className="max-w-3xl">
              <StatusBadge className="px-4 py-0.5" tone="success">
                Local-first MVP
              </StatusBadge>
              <h1 className="mt-4 max-w-2xl font-semibold text-2xl leading-tight tracking-normal sm:text-4xl">
                {CORE_PROMISE}
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground text-base leading-7">
                Paste a YouTube URL, then study with chapters, notes, bookmarks,
                and progress in one recoverable workspace.
              </p>

              <form className="mt-7 max-w-2xl">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="course-url" className="font-medium text-sm">
                    Video URL
                  </label>
                  <span className="text-muted-foreground text-xs">
                    Paste a public YouTube link
                  </span>
                </div>
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/35 p-2 sm:flex-row">
                  <Input
                    id="course-url"
                    name="url"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-10 flex-1"
                  />
                  <Button type="submit" size="lg" className="sm:w-auto">
                    Generate course
                    <HugeIcon name="arrowRight" className="size-4" />
                  </Button>
                </div>
              </form>

              <div className="mt-4">
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 justify-start px-4 text-primary hover:bg-transparent hover:text-primary/80"
                >
                  <Link to="/" className="gap-2">
                    <HugeIcon name="playCircle" className="size-4" />
                    Try sample course
                  </Link>
                </Button>
              </div>
            </div>
          </ContentPanel>

          <ContentPanel className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <HugeIcon name="list" className="size-5 text-primary" />
                <h2 className="font-semibold text-base">Course workspace</h2>
              </div>
              <span className="text-muted-foreground text-xs">Preview</span>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Sample course</span>
                  <span className="text-muted-foreground">Ready</span>
                </div>
                <Progress value={100} />
              </div>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                {learningLoopSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2"
                  >
                    <span className="flex size-6 items-center justify-center rounded-md border border-primary/20 bg-primary/10 font-semibold text-primary text-xs">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{step}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-border bg-muted/35 p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">After generation</span>
                  <StatusBadge tone="info" className="px-2">
                    Auto-save
                  </StatusBadge>
                </div>
                <p className="mt-2 text-muted-foreground text-sm leading-6">
                  Benkyou opens a course player with chapter navigation,
                  Markdown notes, bookmarks, and resumable progress.
                </p>
              </div>
            </div>
          </ContentPanel>
        </section>
      </AppMain>
    </AppShell>
  );
}
