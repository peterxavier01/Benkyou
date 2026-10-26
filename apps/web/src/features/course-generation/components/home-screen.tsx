import { CORE_PROMISE, REPOSITORY_URL } from "@benkyou/core";
import { Button, HugeIcon } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
	ChaptersIllustration,
	NotebookPreview,
	NoteIllustration,
	Prompt,
	ResumeIllustration,
	TerminalBlock,
} from "#components/notebook-illustrations";
import { PublicPage } from "#components/public-site";
import { NewCourseForm } from "./new-course-form";

function HomeScreen() {
	return (
		<PublicPage>
			<section className="relative overflow-hidden">
				<div
					aria-hidden="true"
					className="genko-grid absolute inset-0 mask-[linear-gradient(to_bottom,#000_55%,transparent)]"
				/>
				<div className="relative mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:gap-14 lg:pt-[72px] lg:pb-24">
					<div className="grid gap-6 sm:gap-7">
						<span className="inline-flex h-7 w-fit items-center gap-2 rounded-full border border-border bg-card px-2.5 text-[13px] text-muted-foreground">
							<span className="size-1.5 rounded-full bg-primary" />
							Open beta · Free and open source
						</span>
						<h1 className="text-balance font-semibold font-serif text-[40px] leading-[1.04] tracking-[-0.025em] sm:text-[56px] lg:text-[64px] lg:leading-[1.02]">
							{CORE_PROMISE}
						</h1>
						<p className="max-w-[520px] text-pretty text-base text-muted-foreground leading-relaxed sm:text-lg">
							Paste a YouTube link. Benkyou gives it chapters, notes, bookmarks
							and progress, and keeps them right where you left them.
						</p>
						<NewCourseForm id="hero-url" showHelp />
					</div>
					<NotebookPreview />
				</div>
			</section>

			<section
				aria-labelledby="home-how"
				className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
			>
				<div className="grid max-w-[780px] gap-4 pb-8 sm:pb-10">
					<h2
						id="home-how"
						className="text-balance font-semibold font-serif text-3xl leading-[1.1] tracking-[-0.02em] sm:text-[44px]"
					>
						YouTube is built for watching. Benkyou is built for studying.
					</h2>
					<p className="text-base text-muted-foreground leading-relaxed sm:text-[17px]">
						Long tutorials, lectures and talks are some of the best teaching on
						the internet. A video player just isn’t a place to learn from them.
					</p>
				</div>
				<HowRow
					number="01"
					title="Chapters for every video"
					illustration={<ChaptersIllustration />}
				>
					Benkyou uses the creator’s timestamps when a video has them, and
					writes chapters from the captions when it doesn’t. You can edit any of
					them.
				</HowRow>
				<HowRow
					number="02"
					title="Notes and bookmarks in one place"
					illustration={<NoteIllustration />}
				>
					Write Markdown notes for each chapter and bookmark the moments worth
					coming back to. A bookmark takes you back to the exact second.
				</HowRow>
				<HowRow
					number="03"
					title="Pick up where you left off"
					illustration={<ResumeIllustration />}
				>
					Your position and progress save as you study. Come back next week,
					press Resume, and you’re back in the right chapter.
				</HowRow>
				<p className="border-border border-t pt-8 text-sm">
					<Link to="/how-it-works" className="font-medium">
						See how it works, step by step
					</Link>
				</p>
			</section>

			<section
				aria-labelledby="home-self-host"
				className="border-border border-y bg-muted"
			>
				<div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
					<div className="grid gap-3.5">
						<h2
							id="home-self-host"
							className="font-semibold font-serif text-3xl leading-tight tracking-[-0.015em] sm:text-4xl"
						>
							Yours to run.
						</h2>
						<p className="max-w-[480px] text-base text-muted-foreground leading-relaxed">
							Benkyou is MIT-licensed and self-hostable. One Docker Compose
							command runs the app and its database on your own server, with
							analytics off by default.
						</p>
						<div className="flex flex-wrap gap-3 pt-1.5">
							<Button asChild variant="outline" className="h-10 bg-card px-4">
								<Link to="/self-hosting">Self-hosting guide</Link>
							</Button>
							<Button asChild variant="ghost" className="h-10">
								<a href={REPOSITORY_URL}>
									<HugeIcon name="github" className="size-4" />
									View the source
								</a>
							</Button>
						</div>
					</div>
					<TerminalBlock>
						<Prompt />
						cp .env.example .env
						{"\n"}
						<Prompt />
						docker compose up --build
					</TerminalBlock>
				</div>
			</section>

			<section aria-labelledby="home-cta" className="relative overflow-hidden">
				<div
					aria-hidden="true"
					className="genko-grid absolute inset-0 opacity-70"
				/>
				<div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
					<h2
						id="home-cta"
						className="max-w-[680px] text-balance font-semibold font-serif text-3xl leading-tight tracking-[-0.02em] sm:text-[40px]"
					>
						Got a four-hour tutorial sitting in a tab?
					</h2>
					<NewCourseForm id="cta-url" className="text-left" />
				</div>
			</section>
		</PublicPage>
	);
}

function HowRow({
	number,
	title,
	illustration,
	children,
}: {
	number: string;
	title: string;
	illustration: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 border-border border-t py-8 sm:py-10 lg:grid-cols-2 lg:gap-10">
			<div className="flex items-start gap-4 sm:gap-6">
				<span className="pt-1 font-semibold font-serif text-primary text-xl tabular-nums">
					{number}
				</span>
				<div className="grid max-w-[440px] gap-2.5">
					<h3 className="font-semibold font-serif text-2xl leading-tight tracking-[-0.01em] sm:text-[28px]">
						{title}
					</h3>
					<p className="text-base text-muted-foreground leading-relaxed">
						{children}
					</p>
				</div>
			</div>
			<div className="min-w-0">{illustration}</div>
		</div>
	);
}

export { HomeScreen };
