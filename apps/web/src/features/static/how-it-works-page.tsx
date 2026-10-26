import { ContentPanel, HugeIcon, type HugeIconName } from "@benkyou/ui";
import { NewCourseForm } from "#/features/course-generation/components/new-course-form";
import {
	ChapterList,
	NoteIllustration,
	ResumeIllustration,
	sampleChapters,
} from "#components/notebook-illustrations";
import { PublicPage, PublicPageIntro } from "#components/public-site";
import { NumberedStep, SectionHeading } from "./components/static-blocks";

const supportedLinks = [
	"youtube.com/watch?v=…",
	"youtu.be/…",
	"youtube.com/embed/…",
	"youtube.com/shorts/…",
];

const storageOptions: {
	icon: HugeIconName;
	label: string;
	title: string;
	body: string;
}[] = [
	{
		icon: "account",
		label: "Signed in",
		title: "In your account",
		body: "Only you can see them, on any device you sign in on.",
	},
	{
		icon: "server",
		label: "Self-hosted",
		title: "On your server",
		body: "Run Benkyou with Docker Compose and keep everything in your own Postgres database.",
	},
	{
		icon: "phone",
		label: "No account",
		title: "Private in this browser",
		body: "Start right away. Notebooks made without signing in stay private to your browser, and move to your account when you sign in.",
	},
];

const questions = [
	{
		q: "Does Benkyou use AI?",
		a: "Only when a video has no creator timestamps. Then it reads the captions to write chapters. Your notes are never sent to the AI provider.",
	},
	{
		q: "Is it free?",
		a: "Yes. Benkyou is free during the open beta, and the code is open source under the MIT license.",
	},
	{
		q: "Can I get my notes out?",
		a: "Yes. Export any notebook as Markdown, with its chapters, notes and bookmarks in one file.",
	},
	{
		q: "Which videos work best?",
		a: "Long ones you plan to study rather than watch once: tutorials, lectures, workshops and talks.",
	},
];

function HowItWorksPage() {
	return (
		<PublicPage>
			<PublicPageIntro
				eyebrow="How it works"
				title="From a YouTube link to a notebook in four steps."
			>
				Benkyou adds the structure a video player leaves out: chapters, notes,
				bookmarks and progress that stay put between sessions.
			</PublicPageIntro>

			<div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
				<NumberedStep
					number="01"
					title="Paste a YouTube link"
					illustration={
						<ContentPanel className="grid gap-2.5 p-4 sm:p-5">
							<h3 className="font-medium text-muted-foreground text-xs">
								Supported links
							</h3>
							<ul className="grid gap-1.5 font-mono text-[13px]">
								{supportedLinks.map((link) => (
									<li key={link}>{link}</li>
								))}
							</ul>
							<p className="border-border border-t pt-2.5 text-muted-foreground text-sm">
								Playlists and other video sites aren’t supported yet.
							</p>
						</ContentPanel>
					}
				>
					<p>
						Any public YouTube video works: a tutorial, a lecture, a conference
						talk. No account needed to start.
					</p>
				</NumberedStep>

				<NumberedStep
					number="02"
					title="Get chapters"
					illustration={
						<ContentPanel className="grid gap-2 p-3">
							<p className="flex items-start gap-2 px-3 pt-1 text-muted-foreground text-[13px]">
								<HugeIcon name="info" className="mt-px size-4 shrink-0" />
								No creator chapters found. These were written from the captions.
							</p>
							<ChapterList
								chapters={sampleChapters
									.slice(0, 3)
									.map((chapter) => ({ ...chapter, state: "not-started" }))}
							/>
						</ContentPanel>
					}
				>
					<p>
						If the creator added timestamps to the description, Benkyou uses
						them as your chapters. If not, it writes them from the video’s
						captions.
					</p>
					<ul className="grid gap-2">
						<li className="flex gap-2">
							<HugeIcon
								name="check"
								className="mt-1 size-4 shrink-0 text-foreground"
							/>
							Creator timestamps always come first
						</li>
						<li className="flex gap-2">
							<HugeIcon
								name="check"
								className="mt-1 size-4 shrink-0 text-foreground"
							/>
							Very long videos get a high-level map rather than dense chapters
						</li>
					</ul>
				</NumberedStep>

				<NumberedStep
					number="03"
					title="Study, chapter by chapter"
					illustration={<NoteIllustration />}
				>
					<p>
						Write notes for each chapter in Markdown. Bookmark moments worth
						coming back to. A chapter counts as done once you’ve watched 90% of
						it, and you can mark it done or not done yourself.
					</p>
				</NumberedStep>

				<NumberedStep
					number="04"
					title="Come back to it"
					illustration={<ResumeIllustration />}
				>
					<p>
						Benkyou remembers where you stopped. Open the notebook next week and
						press Resume.
					</p>
				</NumberedStep>
			</div>

			<section
				aria-labelledby="where-notebooks-live"
				className="border-border border-y bg-muted"
			>
				<div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 sm:py-20">
					<div className="grid max-w-2xl gap-3">
						<SectionHeading id="where-notebooks-live">
							Where your notebooks live
						</SectionHeading>
						<p className="text-muted-foreground leading-relaxed">
							It depends on how you use Benkyou. Any notebook exports as a
							single Markdown file with its chapters, notes and bookmarks.
						</p>
					</div>
					<ul className="grid gap-3 md:grid-cols-3">
						{storageOptions.map((option) => (
							<li key={option.label}>
								<ContentPanel className="grid h-full content-start gap-2 p-5">
									<span className="flex items-center gap-2 text-muted-foreground text-[13px]">
										<HugeIcon name={option.icon} className="size-4" />
										{option.label}
									</span>
									<h3 className="font-semibold font-serif text-xl">
										{option.title}
									</h3>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{option.body}
									</p>
								</ContentPanel>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section
				aria-labelledby="questions"
				className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
			>
				<SectionHeading id="questions">Questions</SectionHeading>
				<dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
					{questions.map((item) => (
						<div key={item.q} className="grid gap-1.5">
							<dt className="font-semibold">{item.q}</dt>
							<dd className="text-muted-foreground text-[15px] leading-relaxed">
								{item.a}
							</dd>
						</div>
					))}
				</dl>
			</section>

			<section
				aria-labelledby="how-cta"
				className="relative overflow-hidden border-border border-t"
			>
				<div
					aria-hidden="true"
					className="genko-grid absolute inset-0 opacity-70"
				/>
				<div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20">
					<SectionHeading id="how-cta" className="max-w-[640px]">
						Try it with a video you’ve been meaning to study.
					</SectionHeading>
					<NewCourseForm id="how-url" className="text-left" />
				</div>
			</section>
		</PublicPage>
	);
}

export { HowItWorksPage };
