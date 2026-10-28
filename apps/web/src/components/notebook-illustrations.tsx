import {
	BookmarkItem,
	ChapterRow,
	ChapterRowContent,
	type ChapterState,
	cn,
	HugeIcon,
	PlaybackTimeline,
	ResumeBanner,
	SaveStatus,
} from "@benkyou/ui";
import type { ReactNode } from "react";

/*
 * Static pictures of a notebook for the home and How it works pages. They
 * reuse the real study components so the marketing pages can't drift from
 * the app, but nothing in them is interactive: each one is a single image
 * to assistive tech, described by its label.
 */

type SampleChapter = {
	index: number;
	title: string;
	timestamp: string;
	state: ChapterState;
	progress?: number;
};

const sampleChapters: SampleChapter[] = [
	{ index: 1, title: "Project setup", timestamp: "00:00", state: "completed" },
	{
		index: 2,
		title: "Routing and handlers",
		timestamp: "12:40",
		state: "completed",
	},
	{ index: 3, title: "Database layer", timestamp: "28:15", state: "current" },
	{
		index: 4,
		title: "Authentication",
		timestamp: "41:50",
		state: "in-progress",
		progress: 20,
	},
	{ index: 5, title: "Testing", timestamp: "55:05", state: "not-started" },
];

const SAMPLE_DURATION = 5050;
const sampleChapterStarts = [0, 760, 1695, 2510, 3305, 3820, 4350, 4865];

function Illustration({
	label,
	className,
	children,
}: {
	label: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<figure role="img" aria-label={label} className={cn("m-0", className)}>
			<div aria-hidden="true" className="pointer-events-none select-none">
				{children}
			</div>
		</figure>
	);
}

function ChapterList({
	chapters,
	className,
}: {
	chapters: SampleChapter[];
	className?: string;
}) {
	return (
		<div className={cn("grid grid-cols-[minmax(0,1fr)] gap-0.5", className)}>
			{chapters.map((chapter) => (
				<ChapterRow key={chapter.index} asChild {...chapter} density="compact">
					<div>
						<ChapterRowContent {...chapter} />
					</div>
				</ChapterRow>
			))}
		</div>
	);
}

function TimestampMark({ time }: { time: string }) {
	return (
		<span className="mx-0.5 inline-flex h-[22px] items-center gap-1 rounded-sm bg-muted px-1.5 align-[1px] font-medium font-sans text-foreground text-xs tabular-nums">
			<HugeIcon name="play" className="size-2.5 fill-current" />
			{time}
		</span>
	);
}

/** The hero card: a notebook mid-study, with its timeline, chapters and a note. */
function NotebookPreview({ className }: { className?: string }) {
	return (
		<Illustration
			label="A sample notebook for a full-stack TypeScript video: chapters 1 and 2 are done, chapter 3 is playing, and a note sits beside the chapter list."
			className={className}
		>
			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_16px_40px_rgb(29_26_21/0.1)]">
				<div className="flex items-center justify-between gap-3 border-border border-b px-4 py-3.5 sm:px-5">
					<div className="grid min-w-0 gap-0.5">
						<span className="text-muted-foreground text-xs">
							Sample notebook
						</span>
						<span className="truncate font-semibold font-serif text-[17px]">
							Full-stack TypeScript, end to end
						</span>
					</div>
					<SaveStatus tone="saved" className="shrink-0">
						Saved
					</SaveStatus>
				</div>
				<div className="px-4 pt-4 sm:px-5">
					<div className="flex aspect-video items-center justify-center rounded-lg bg-[#1d1a15]">
						<span className="flex size-13 items-center justify-center rounded-full bg-white/12 text-white">
							<HugeIcon name="play" className="size-5 fill-current" />
						</span>
					</div>
					<PlaybackTimeline
						duration={SAMPLE_DURATION}
						position={2027}
						chapterStarts={sampleChapterStarts}
						bookmarks={[
							{ time: 846, label: "Middleware order matters" },
							{ time: 1821, label: "Migration naming convention" },
						]}
						footer={
							<>
								<span className="font-medium text-foreground">33:47</span>
								<span>1:24:10</span>
							</>
						}
					/>
				</div>
				<div className="mt-4 grid border-border border-t sm:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
					<ChapterList
						chapters={sampleChapters.slice(1)}
						className="border-border p-2 sm:border-r"
					/>
					<div className="hidden gap-2 px-5 py-4 sm:grid sm:content-start">
						<span className="font-medium text-muted-foreground text-xs">
							Note · Database layer
						</span>
						<p className="font-serif text-[15px] leading-relaxed">
							Migrations are named by timestamp <TimestampMark time="30:21" />{" "}
							so they always run in order.{" "}
							<span className="rounded-sm bg-mark-tint px-0.5">
								Never edit one that has shipped.
							</span>
						</p>
					</div>
				</div>
			</div>
		</Illustration>
	);
}

function ChaptersIllustration() {
	return (
		<Illustration label="Three chapters with their start times: Project setup is done and Routing and handlers is playing.">
			<ChapterList
				chapters={[
					{ ...sampleChapters[0] },
					{ ...sampleChapters[1], state: "current" },
					{ ...sampleChapters[2], state: "not-started" },
				]}
				className="rounded-lg border border-border bg-card p-3"
			/>
		</Illustration>
	);
}

function NoteIllustration() {
	return (
		<Illustration label="A chapter note in Markdown, with a bookmark at 14:06 called Middleware order matters.">
			<div className="grid gap-3 rounded-lg border border-border bg-card p-5">
				<p className="font-serif text-[17px] leading-relaxed">
					Handlers run top to bottom, so auth goes before the routes it
					protects.
				</p>
				<BookmarkItem
					className="bg-background"
					time="14:06"
					label="Middleware order matters"
					context="Routing and handlers"
				/>
			</div>
		</Illustration>
	);
}

function ResumeIllustration() {
	return (
		<Illustration label="A banner that says Pick up at 33:47, chapter 3, Database layer, with a Resume button.">
			<ResumeBanner
				time="33:47"
				context="03 · Database layer · last studied Tuesday"
				action={
					<span className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm">
						<HugeIcon name="play" className="size-4" />
						Resume
					</span>
				}
			/>
		</Illustration>
	);
}

function TerminalBlock({ children }: { children: ReactNode }) {
	return (
		<pre className="m-0 overflow-x-auto rounded-lg bg-[#1d1a15] p-5 font-mono text-[#eae7e2] text-sm leading-[1.8] sm:p-6">
			{children}
		</pre>
	);
}

function Prompt() {
	return <span className="select-none text-[#a7a49e]">$ </span>;
}

export {
	ChapterList,
	ChaptersIllustration,
	NotebookPreview,
	NoteIllustration,
	Prompt,
	ResumeIllustration,
	sampleChapters,
	TerminalBlock,
};
