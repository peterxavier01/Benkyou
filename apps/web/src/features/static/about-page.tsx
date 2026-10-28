import { REPOSITORY_URL } from "@benkyou/core";
import { Button, ContentPanel, HugeIcon } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import { PublicPage, PublicPageIntro } from "#components/public-site";
import { SectionHeading } from "./components/static-blocks";

const isList = [
	"One notebook per video, with chapters, notes, bookmarks and progress",
	"Useful the moment you paste a link, no account needed",
	"Free and open source under the MIT license",
	"Yours to self-host, with your data in your database",
];

const isntList = [
	"A video platform or a place to discover videos",
	"A course marketplace or an LMS",
	"A social network, with feeds or public profiles",
	"Gamified, with streaks and badges",
];

const principles = [
	{
		title: "Start studying immediately",
		body: "The first screen is where you create a notebook. No tour, no sign-up wall.",
	},
	{
		title: "Structure is the value",
		body: "Chapters, notes, bookmarks and progress belong together, not in four separate tools.",
	},
	{
		title: "Keep your attention on the material",
		body: "Fewer controls, less decoration, no notifications asking you to come back.",
	},
	{
		title: "Useful without an account",
		body: "Everything works before you sign in. Signing in is a convenience, not a requirement.",
	},
	{
		title: "Never lose your work",
		body: "Every save, failure and offline moment says what happened and what to do next.",
	},
];

function AboutPage() {
	return (
		<PublicPage>
			<PublicPageIntro
				eyebrow="About"
				title="Some of the best teaching online is a four-hour video."
				aside={
					<div className="hidden flex-col items-center gap-2 lg:flex">
						<span
							lang="ja"
							className="font-jp font-semibold text-[88px] text-foreground leading-none"
						>
							勉強
						</span>
						<span className="text-muted-foreground text-sm">
							benkyō · Japanese for study
						</span>
					</div>
				}
			>
				Tutorials, lectures and conference talks teach as well as many courses.
				But a video player is built for watching once, not for studying over
				weeks. Benkyou is the missing study layer.
			</PublicPageIntro>

			<div className="mx-auto grid w-full max-w-6xl gap-16 px-4 py-12 sm:px-6 sm:py-16">
				<section
					aria-label="What Benkyou is and isn’t"
					className="grid gap-4 md:grid-cols-2"
				>
					<ContentPanel className="grid content-start gap-4 p-5 sm:p-6">
						<h2 className="font-semibold font-serif text-xl">Benkyou is</h2>
						<ul className="grid gap-3">
							{isList.map((item) => (
								<li key={item} className="flex gap-2.5">
									<HugeIcon
										name="check"
										className="mt-1 size-4 shrink-0 text-primary"
									/>
									{item}
								</li>
							))}
						</ul>
					</ContentPanel>
					<ContentPanel className="grid content-start gap-4 bg-muted p-5 sm:p-6">
						<h2 className="font-semibold font-serif text-xl">Benkyou isn’t</h2>
						<ul className="grid gap-3 text-muted-foreground">
							{isntList.map((item) => (
								<li key={item} className="flex gap-2.5">
									<HugeIcon name="close" className="mt-1 size-4 shrink-0" />
									{item}
								</li>
							))}
						</ul>
					</ContentPanel>
				</section>

				<section aria-labelledby="principles" className="grid gap-6">
					<SectionHeading id="principles">What guides it</SectionHeading>
					<ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
						{principles.map((principle, index) => (
							<li key={principle.title} className="grid content-start gap-2">
								<span className="font-semibold font-serif text-primary tabular-nums">
									{String(index + 1).padStart(2, "0")}
								</span>
								<h3 className="font-semibold font-serif text-xl leading-snug">
									{principle.title}
								</h3>
								<p className="text-muted-foreground leading-relaxed">
									{principle.body}
								</p>
							</li>
						))}
					</ol>
				</section>

				<section
					aria-labelledby="built-in-the-open"
					className="grid max-w-2xl gap-4 border-border border-t pt-12"
				>
					<SectionHeading id="built-in-the-open">
						Built in the open
					</SectionHeading>
					<p className="text-muted-foreground leading-relaxed">
						The roadmap, issues and discussions all live on GitHub, and
						contributions that improve the study loop are welcome.
					</p>
					<div className="flex flex-wrap gap-2">
						<Button asChild variant="outline">
							<a href={REPOSITORY_URL}>
								<HugeIcon name="github" className="size-4" />
								View on GitHub
							</a>
						</Button>
						<Button asChild variant="ghost">
							<a href={`${REPOSITORY_URL}/blob/main/ROADMAP.md`}>
								Read the roadmap
							</a>
						</Button>
						<Button asChild variant="ghost">
							<Link to="/self-hosting">Self-host Benkyou</Link>
						</Button>
					</div>
				</section>
			</div>
		</PublicPage>
	);
}

export { AboutPage };
