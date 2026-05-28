import { CORE_PROMISE } from "@benkyou/core";
import { ContentPanel, HugeIcon, Progress, StatusBadge } from "@benkyou/ui";

import { AppHeader } from "#components/app-header";
import { PublicFooter } from "#components/public-trust-links";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import { NewCourseForm } from "./new-course-form";

const workspacePreview = {
	chapters: [
		{ time: "00:00", title: "Project setup and goals", active: true },
		{ time: "12:40", title: "Core concept walkthrough", active: false },
		{ time: "28:15", title: "Practice checkpoint", active: false },
	],
	note: "Compare the chapter summary with my own implementation before moving on.",
	bookmark: "18:32",
};

function HomeScreen() {
	return (
		<main className="flex min-h-dvh flex-col bg-background text-foreground">
			<AppHeader action={<BetterAuthHeader />} />

			<section className="mx-auto grid w-full max-w-7xl flex-1 items-start gap-6 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:gap-8">
				<div className="flex min-h-[500px] items-center px-1 py-8 sm:px-4 lg:min-h-[560px]">
					<div className="max-w-3xl">
						<StatusBadge className="px-4 py-0.5" tone="success">
							Open Beta
						</StatusBadge>
						<h1 className="mt-5 max-w-2xl font-semibold text-3xl leading-tight tracking-normal sm:text-5xl">
							{CORE_PROMISE}
						</h1>
						<p className="mt-5 max-w-2xl text-base text-muted-foreground leading-7">
							Paste a tutorial, lecture, talk, or walkthrough. Benkyou turns it
							into a recoverable study surface with chapters, Markdown notes,
							bookmarks, and progress that survives the next session.
						</p>

						<NewCourseForm />

						<div className="mt-8 max-w-2xl border-border border-t pt-5">
							<div className="flex items-start gap-3">
								<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
									<HugeIcon name="playCircle" className="size-4" />
								</span>
								<div className="min-w-0">
									<h2 className="font-semibold text-base leading-6">
										Video platforms are built for watching. Benkyou is built for
										studying.
									</h2>
									<p className="mt-2 text-muted-foreground text-sm leading-6">
										YouTube and other video platforms supply the source
										material. Benkyou gives the videos you care about a study
										system for organizing, resuming, and reviewing what matters.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<ContentPanel className="p-0">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-2 px-5 pt-5">
							<HugeIcon name="bookOpenCheck" className="size-5 text-primary" />
							<h2 className="font-semibold text-base">Study workspace</h2>
						</div>
						<span className="px-5 pt-5 text-muted-foreground text-xs">
							Preview
						</span>
					</div>
					<div className="mt-5 border-border border-y bg-muted/25 px-5 py-4">
						<div className="space-y-2">
							<div className="mb-2 flex items-center justify-between text-sm">
								<span className="font-medium">Sample course</span>
								<span className="text-muted-foreground">Resume at 42%</span>
							</div>
							<Progress value={42} />
						</div>
					</div>
					<div className="space-y-5 p-5">
						<div>
							<div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
								<HugeIcon name="list" className="size-4" />
								<span>Chapters</span>
							</div>
							<ul className="space-y-1.5 text-sm">
								{workspacePreview.chapters.map((chapter) => (
									<li
										key={chapter.title}
										className={
											chapter.active
												? "rounded-md border border-primary/25 bg-primary/10 px-3 py-2"
												: "rounded-md border border-border bg-muted/25 px-3 py-2"
										}
									>
										<div className="flex items-center justify-between gap-3">
											<span className="font-medium">{chapter.title}</span>
											<span className="shrink-0 text-muted-foreground text-xs">
												{chapter.time}
											</span>
										</div>
									</li>
								))}
							</ul>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
							<div className="rounded-lg border border-border bg-muted/30 p-3">
								<div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
									<HugeIcon name="note" className="size-4" />
									<span>Latest note</span>
								</div>
								<p className="text-sm leading-6">{workspacePreview.note}</p>
							</div>
							<div className="rounded-lg border border-border bg-muted/30 p-3">
								<div className="mb-2 flex items-center justify-between gap-3">
									<div className="flex items-center gap-2 text-muted-foreground text-xs">
										<HugeIcon name="bookmark" className="size-4" />
										<span>Saved bookmark</span>
									</div>
									<StatusBadge tone="info" className="px-2">
										Auto-save
									</StatusBadge>
								</div>
								<p className="text-sm leading-6">
									Resume from {workspacePreview.bookmark} with notes and
									progress intact.
								</p>
							</div>
						</div>
						<ul className="grid grid-cols-4 gap-2 text-xs">
							{["Chapters", "Notes", "Bookmarks", "Progress"].map((step) => (
								<li
									key={step}
									className="rounded-md bg-accent px-2 py-1.5 text-center font-medium text-accent-foreground"
								>
									{step}
								</li>
							))}
						</ul>
					</div>
				</ContentPanel>
			</section>
			<PublicFooter />
		</main>
	);
}

export { HomeScreen };
