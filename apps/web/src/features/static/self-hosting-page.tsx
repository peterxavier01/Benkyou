import { REPOSITORY_URL } from "@benkyou/core";
import { Button, HugeIcon } from "@benkyou/ui";
import type { ReactNode } from "react";
import { PublicPage, PublicPageIntro } from "#components/public-site";
import {
	CommandBlock,
	InlineCode,
	SectionHeading,
} from "./components/static-blocks";

const sections = [
	{ id: "overview", label: "Overview" },
	{ id: "requirements", label: "Requirements" },
	{ id: "quick-start", label: "Quick start" },
	{ id: "configuration", label: "Configuration" },
	{ id: "chapters-and-ai", label: "Chapters and AI" },
	{ id: "analytics", label: "Analytics and privacy" },
	{ id: "operations", label: "Running it" },
	{ id: "contributing", label: "Contributing" },
] as const;

const facts = [
	"MIT license",
	"Docker Compose",
	"Postgres 16",
	"No analytics by default",
];

const settings: { name: string; value: string; body: ReactNode }[] = [
	{
		name: "POSTGRES_PASSWORD",
		value: "Required",
		body: "A long random password for the bundled Postgres database.",
	},
	{
		name: "BETTER_AUTH_SECRET",
		value: "Required",
		body: (
			<>
				Signs sessions. Generate one with{" "}
				<InlineCode>npx -y @better-auth/cli secret</InlineCode>.
			</>
		),
	},
	{
		name: "BETTER_AUTH_URL",
		value: "http://localhost:3000",
		body: "The URL people use to reach your instance.",
	},
	{
		name: "PUBLIC_SITE_URL",
		value: "http://localhost:3000",
		body: "Canonical URL for metadata, robots.txt and the sitemap.",
	},
	{
		name: "BENKYOU_WEB_PORT",
		value: "3000",
		body: "Host port for the web app. The container always listens on 3000.",
	},
	{
		name: "AI_PROVIDER · AI_API_KEY",
		value: "openai · empty",
		body: "Only needed to write chapters for videos without creator timestamps. Keep the key server-side.",
	},
	{
		name: "YOUTUBE_TRANSCRIPT_PROVIDER",
		value: "auto",
		body: (
			<>
				Uses TranscriptAPI when <InlineCode>TRANSCRIPTAPI_API_KEY</InlineCode>{" "}
				is set, otherwise a free local package.
			</>
		),
	},
	{
		name: "YOUTUBE_API_KEY",
		value: "empty",
		body: "Optional. Adds video details and creator timestamps.",
	},
	{
		name: "GENERATION_RATE_LIMIT_MAX",
		value: "5 per 24 hours",
		body: (
			<>
				Chapter generations allowed per window. Set the window with{" "}
				<InlineCode>GENERATION_RATE_LIMIT_WINDOW_HOURS</InlineCode>.
			</>
		),
	},
	{
		name: "VITE_PUBLIC_POSTHOG_KEY",
		value: "empty",
		body: "Analytics. Leave it empty and nothing is sent.",
	},
];

function SelfHostingPage() {
	return (
		<PublicPage>
			<PublicPageIntro
				eyebrow="Self-hosting"
				title="Run Benkyou on your own server."
			>
				<p>
					One Docker Compose command starts the app and its database. Your
					notebooks stay in your Postgres, and analytics stay off unless you
					turn them on.
				</p>
				<ul className="mt-5 flex flex-wrap gap-2 text-foreground text-sm">
					{facts.map((fact) => (
						<li
							key={fact}
							className="inline-flex h-7 items-center rounded-full border border-border bg-card px-3"
						>
							{fact}
						</li>
					))}
				</ul>
			</PublicPageIntro>

			<div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
				<nav
					aria-labelledby="on-this-page"
					className="lg:sticky lg:top-24 lg:self-start"
				>
					<h2
						id="on-this-page"
						className="mb-2 font-medium text-muted-foreground text-xs"
					>
						On this page
					</h2>
					<ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm lg:grid lg:gap-2">
						{sections.map((section) => (
							<li key={section.id}>
								<a href={`#${section.id}`}>{section.label}</a>
							</li>
						))}
					</ul>
				</nav>

				<div className="grid min-w-0 max-w-3xl grid-cols-[minmax(0,1fr)] gap-12 text-[15px] leading-relaxed sm:text-base">
					<DocSection id="overview" title="Overview">
						<p>
							Benkyou runs as two containers: the web app and a Postgres 16
							database. Only the web app is published on a host port. The
							database stays on Compose’s internal network, where the app
							reaches it as <InlineCode>db</InlineCode>.
						</p>
						<p>
							Self-hosted Benkyou is the complete product. Nothing in the study
							loop depends on the hosted version.
						</p>
					</DocSection>

					<DocSection id="requirements" title="Requirements">
						<ul className="grid list-disc gap-1.5 pl-5">
							<li>Docker with the Compose plugin</li>
							<li>Git</li>
							<li>
								For local development without Docker: Node.js 20.19 or newer,
								pnpm 10, and a Postgres connection string
							</li>
						</ul>
					</DocSection>

					<DocSection id="quick-start" title="Quick start">
						<ol className="grid gap-7">
							<QuickStep number={1} title="Get the code">
								<CommandBlock
									lines={[`git clone ${REPOSITORY_URL}.git`, "cd Benkyou"]}
								/>
							</QuickStep>
							<QuickStep number={2} title="Create your environment file">
								<CommandBlock lines={["cp .env.example .env"]} />
								<p>
									Open <InlineCode>.env</InlineCode> and replace{" "}
									<InlineCode>POSTGRES_PASSWORD</InlineCode> and{" "}
									<InlineCode>BETTER_AUTH_SECRET</InlineCode> with real values.
									Compose won’t start without them.
								</p>
								<p className="flex gap-2 rounded-md bg-warning/10 p-3 text-sm">
									<HugeIcon
										name="alert"
										className="mt-0.5 size-4 shrink-0 text-warning"
									/>
									Never commit .env. It holds your database password and auth
									secret.
								</p>
							</QuickStep>
							<QuickStep number={3} title="Start Benkyou">
								<CommandBlock lines={["docker compose up --build"]} />
								<p>
									This builds the app, starts Postgres, runs database migrations
									and serves Benkyou at{" "}
									<InlineCode>http://localhost:3000</InlineCode>.
								</p>
							</QuickStep>
						</ol>
					</DocSection>

					<DocSection id="configuration" title="Configuration">
						<p>
							Everything is set in <InlineCode>.env</InlineCode>. Only the first
							two are required.
						</p>
						<dl className="divide-y divide-border rounded-lg border border-border bg-card">
							{settings.map((setting) => (
								<div
									key={setting.name}
									className="grid gap-1 px-4 py-3.5 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:gap-4"
								>
									<dt className="grid content-start gap-0.5">
										<span className="break-all font-mono text-[13px]">
											{setting.name}
										</span>
										<span className="text-muted-foreground text-xs">
											{setting.value}
										</span>
									</dt>
									<dd className="text-muted-foreground text-sm">
										{setting.body}
									</dd>
								</div>
							))}
						</dl>
					</DocSection>

					<DocSection id="chapters-and-ai" title="Chapters and AI">
						<p>
							Benkyou looks for creator timestamps in the video description
							first. When a video has usable, ordered timestamps, those become
							the chapters and no AI is used.
						</p>
						<p>
							For videos without timestamps, set{" "}
							<InlineCode>AI_PROVIDER=openai</InlineCode> and{" "}
							<InlineCode>AI_API_KEY</InlineCode> to write chapters from the
							captions. Without a key, creator timestamps and the sample
							notebook still work.
						</p>
					</DocSection>

					<DocSection id="analytics" title="Analytics and privacy">
						<p className="flex gap-2.5 rounded-md bg-info/10 p-3.5 text-sm">
							<HugeIcon
								name="info"
								className="mt-0.5 size-4 shrink-0 text-info"
							/>
							<span>
								Analytics are off unless you set{" "}
								<InlineCode>VITE_PUBLIC_POSTHOG_KEY</InlineCode>. Set{" "}
								<InlineCode>VITE_PUBLIC_POSTHOG_DISABLED=true</InlineCode> to
								force them off even when a key is present.
							</span>
						</p>
					</DocSection>

					<DocSection id="operations" title="Running it">
						<p>Check that the app is up:</p>
						<CommandBlock lines={["curl http://localhost:3000/api/health"]} />
						<ul className="grid list-disc gap-1.5 pl-5">
							<li>
								Migrations run automatically before the web server starts.
							</li>
							<li>Back up the Postgres volume before upgrading.</li>
							<li>
								Put Benkyou behind a reverse proxy with TLS before exposing it
								beyond localhost.
							</li>
						</ul>
					</DocSection>

					<DocSection id="contributing" title="Contributing">
						<p>
							Benkyou welcomes contributions that improve the self-hostable
							study loop. Read the contributing guide and the roadmap on GitHub
							before starting large changes.
						</p>
						<div className="flex flex-wrap gap-2">
							<Button asChild variant="outline">
								<a href={REPOSITORY_URL}>
									<HugeIcon name="github" className="size-4" />
									View on GitHub
								</a>
							</Button>
							<Button asChild variant="ghost">
								<a href={`${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`}>
									Contributing guide
								</a>
							</Button>
						</div>
					</DocSection>
				</div>
			</div>
		</PublicPage>
	);
}

function DocSection({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<section
			aria-labelledby={id}
			className="grid grid-cols-[minmax(0,1fr)] gap-4"
		>
			<SectionHeading id={id} className="text-2xl sm:text-[28px]">
				{title}
			</SectionHeading>
			{children}
		</section>
	);
}

function QuickStep({
	number,
	title,
	children,
}: {
	number: number;
	title: string;
	children: ReactNode;
}) {
	return (
		<li className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3.5">
			<span className="flex size-7 items-center justify-center rounded-full bg-foreground font-semibold text-background text-sm tabular-nums">
				{number}
			</span>
			<div className="grid min-w-0 gap-3">
				<h3 className="pt-0.5 font-semibold">{title}</h3>
				{children}
			</div>
		</li>
	);
}

export { SelfHostingPage };
