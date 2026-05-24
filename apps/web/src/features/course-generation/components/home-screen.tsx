import { CORE_PROMISE } from "@benkyou/core";
import { ContentPanel, HugeIcon, Progress, StatusBadge } from "@benkyou/ui";

import { AppHeader } from "#components/app-header";
import { PublicFooter } from "#components/public-trust-links";
import BetterAuthHeader from "../../../integrations/better-auth/header-user";
import { NewCourseForm } from "./new-course-form";

const learningLoopSteps = ["Chapters", "Notes", "Bookmarks", "Progress"];

function HomeScreen() {
	return (
		<main className="flex min-h-dvh flex-col bg-background text-foreground">
			<AppHeader action={<BetterAuthHeader />} />

			<section className="mx-auto grid w-full max-w-7xl flex-1 items-start gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
				<div className="flex min-h-[500px] items-center rounded-lg border border-border bg-card px-4 py-8 text-card-foreground sm:px-8 lg:min-h-[560px]">
					<div className="max-w-3xl">
						<StatusBadge className="px-4 py-0.5" tone="success">
							Open Beta
						</StatusBadge>
						<h1 className="mt-5 max-w-2xl font-semibold text-3xl leading-tight tracking-normal sm:text-5xl">
							{CORE_PROMISE}
						</h1>
						<p className="mt-5 max-w-2xl text-base text-muted-foreground leading-7">
							Benkyou helps serious learners study tutorials, lectures, talks,
							and walkthroughs with chapters, notes, bookmarks, and progress in
							one recoverable workspace.
						</p>

						<NewCourseForm />

						<div className="mt-7 max-w-2xl rounded-lg border border-border bg-muted/35 p-4">
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

				<ContentPanel className="p-5">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-2">
							<HugeIcon name="list" className="size-5 text-primary" />
							<h2 className="font-semibold text-base">Study workspace</h2>
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
								Benkyou opens a study workspace with chapter navigation,
								Markdown notes, bookmarks, and resumable progress.
							</p>
						</div>
					</div>
				</ContentPanel>
			</section>
			<PublicFooter />
		</main>
	);
}

export { HomeScreen };
