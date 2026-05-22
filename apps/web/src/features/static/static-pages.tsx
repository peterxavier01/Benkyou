import {
	ProductName,
	PublicCallout,
	PublicContentPage,
	PublicMetadataRow,
	PublicSection,
} from "#components/public-content-page";

function AboutPage() {
	return (
		<PublicContentPage
			eyebrow="About"
			title={
				<>
					<ProductName /> turns long-form video into a focused study workspace.
				</>
			}
			description="Benkyou helps learners move from passive watching to structured progress with chapters, notes, bookmarks, and resume state."
		>
			<PublicSection
				title="Mission"
				description="Video is useful, but it is easy to lose the structure of what you learned."
			>
				<p>
					Benkyou exists for serious self-directed study. Paste a supported
					YouTube URL, generate a course outline, then work through the material
					with chapter navigation, Markdown notes, saved timestamps, and
					progress that can be resumed later.
				</p>
				<p>
					The product is designed to keep attention on the material. It avoids
					noisy gamification and treats generated structure as a starting point
					that learners can review, correct, and use.
				</p>
			</PublicSection>

			<PublicSection title="Open-source ethos">
				<p>
					The MVP is built as a local-first learning tool. The core workflow
					should remain useful before account creation, and the project is
					structured so product logic, shared contracts, UI, and database code
					stay in clear package boundaries.
				</p>
				<PublicCallout>
					Benkyou should be understandable to run, inspect, and adapt. Hosted
					sync can layer on top without making local study feel incomplete.
				</PublicCallout>
			</PublicSection>

			<PublicSection title="Learning focus">
				<dl>
					<PublicMetadataRow
						label="Best for"
						value="Tutorials, lectures, walkthroughs, talks, and technical explanations."
					/>
					<PublicMetadataRow
						label="Core loop"
						value="Create a course, study chapters, write notes, save bookmarks, and resume later."
					/>
					<PublicMetadataRow
						label="MVP scope"
						value="Single-video courses from YouTube URLs with notes, bookmarks, progress, and basic account readiness."
					/>
				</dl>
			</PublicSection>
		</PublicContentPage>
	);
}

function SelfHostingPage() {
	return (
		<PublicContentPage
			eyebrow="Self-hosting"
			title="Run Benkyou with Docker Compose and a private Postgres service."
			description="Docker Compose is the recommended self-host path. Node and pnpm remain the development path when you want to work directly in the repo."
		>
			<PublicSection title="Requirements">
				<dl>
					<PublicMetadataRow
						label="Recommended"
						value="Docker and Docker Compose for the web app plus Postgres."
					/>
					<PublicMetadataRow
						label="Development"
						value="Node.js 22 and pnpm when running outside Docker."
					/>
					<PublicMetadataRow
						label="Network"
						value="Port 3000 for the app. Postgres stays on the internal Compose network."
					/>
				</dl>
			</PublicSection>

			<PublicSection
				title="Environment"
				description="Use the root environment template for self-hosting. Keep real values in .env, not in docker-compose.yml."
			>
				<CommandBlock command="cp .env.example .env" />
				<dl>
					<PublicMetadataRow
						label="POSTGRES_PASSWORD"
						value="Set a long random password. Do not commit it."
					/>
					<PublicMetadataRow
						label="BETTER_AUTH_SECRET"
						value="Generate a strong session secret and rotate the placeholder."
					/>
					<PublicMetadataRow
						label="BETTER_AUTH_URL"
						value="Set to the canonical app URL, for example http://localhost:3000."
					/>
					<PublicMetadataRow
						label="PUBLIC_SITE_URL"
						value="Set to the public canonical URL used by metadata, robots.txt, and sitemap.xml."
					/>
					<PublicMetadataRow
						label="AI_API_KEY"
						value="Required for real AI generation. Keep it server-side."
					/>
					<PublicMetadataRow
						label="YOUTUBE_API_KEY"
						value="Optional for YouTube metadata enrichment."
					/>
					<PublicMetadataRow
						label="GENERATION_RATE_LIMIT_MAX / WINDOW_HOURS"
						value="Optional quota controls. Defaults are 5 attempts per 24 hours."
					/>
				</dl>
			</PublicSection>

			<PublicSection
				title="Docker start"
				description="The Compose stack builds the app, starts Postgres, waits for the database healthcheck, runs migrations, then starts the web server."
			>
				<CommandBlock command="docker compose up --build" />
				<PublicCallout>
					The Compose file publishes only the web app by default. Postgres is
					reachable to containers as <code>db</code>, not as a public host port.
				</PublicCallout>
			</PublicSection>

			<PublicSection title="Health check">
				<CommandBlock command="curl http://localhost:3000/api/health" />
				<p>
					Use <code>/api/health</code> for deployment readiness checks. It is
					simple, unauthenticated, and does not expose application data.
				</p>
			</PublicSection>

			<PublicSection
				title="Development path"
				description="Use Node and pnpm when contributing locally or running against your own Postgres instance."
			>
				<CommandBlock
					command={
						"pnpm install\npnpm --filter @benkyou/db db:migrate\npnpm --filter @benkyou/web dev"
					}
				/>
			</PublicSection>

			<PublicSection title="Operations">
				<dl>
					<PublicMetadataRow
						label="Migrations"
						value="Run automatically before the web server starts in the Docker image."
					/>
					<PublicMetadataRow
						label="Backups"
						value="Back up the Postgres volume before upgrades or destructive maintenance."
					/>
					<PublicMetadataRow
						label="Public deploy"
						value="Put Benkyou behind a reverse proxy with TLS before exposing it beyond localhost."
					/>
				</dl>
				<PublicCallout>
					Rotate every placeholder secret in <code>.env</code>. The values in
					<code>.env.example</code> are a template, not production credentials.
				</PublicCallout>
			</PublicSection>
		</PublicContentPage>
	);
}

function CommandBlock({ command }: { command: string }) {
	return (
		<pre className="max-w-full overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed sm:text-sm">
			<code className="whitespace-pre">{command}</code>
		</pre>
	);
}

function PrivacyPage() {
	return (
		<PublicContentPage
			eyebrow="Privacy"
			title="Benkyou keeps the learning loop local-first and explicit."
			description="This MVP privacy summary explains what the app stores, when external providers are involved, and how learner data is used."
		>
			<PublicSection title="What Benkyou stores">
				<p>
					Benkyou stores the course records needed for the learning workspace:
					video metadata, generated chapters, course progress, chapter progress,
					notes, bookmarks, learning preferences, and account session data when
					sign-in is used.
				</p>
				<p>
					Anonymous learning data may also be stored in browser local storage so
					the app remains useful before sign-in.
				</p>
			</PublicSection>

			<PublicSection title="Local-first behavior">
				<p>
					Local study state can stay on the device until the learner signs in or
					uses hosted persistence. Local reset controls are available from
					settings for courses, progress, notes, bookmarks, and preferences.
				</p>
			</PublicSection>

			<PublicSection title="AI processing">
				<p>
					Benkyou prefers creator-provided timestamps when they are available.
					When usable timestamps are not available, transcript data may be sent
					to the configured AI provider to generate chapter JSON.
				</p>
				<PublicCallout>
					Generated chapters are a study aid. Learners can review and correct
					course and chapter details in the management screen.
				</PublicCallout>
			</PublicSection>

			<PublicSection title="External video providers">
				<p>
					The MVP supports YouTube URLs. Benkyou may request video metadata,
					thumbnails, descriptions, and transcript or caption data needed to
					create the course workspace. Playback remains handled by the external
					video provider.
				</p>
			</PublicSection>
		</PublicContentPage>
	);
}

function TermsPage() {
	return (
		<PublicContentPage
			eyebrow="Terms"
			title="Use Benkyou as a learning workspace and keep source material rights in mind."
			description="These MVP terms are written in plain language so learners understand the boundaries of generated study materials."
		>
			<PublicSection title="Acceptable use">
				<p>
					Use Benkyou to create personal study workspaces from supported video
					sources. Do not use the app to abuse provider services, process
					material you are not allowed to use, or generate misleading study
					resources for others.
				</p>
			</PublicSection>

			<PublicSection title="External video responsibility">
				<p>
					You are responsible for the videos you submit and for following the
					terms of the external video provider. Benkyou does not grant rights to
					copy, redistribute, or commercialize source videos.
				</p>
			</PublicSection>

			<PublicSection title="AI output caveats">
				<p>
					AI-generated chapters, summaries, and metadata can be incomplete or
					wrong. Treat generated output as a draft study structure, not as a
					source of truth.
				</p>
				<PublicCallout>
					The course management screen exists so learners can correct titles,
					summaries, and chapter timing when generated output needs adjustment.
				</PublicCallout>
			</PublicSection>

			<PublicSection title="Service expectations">
				<p>
					The MVP is provided as an early learning tool. Availability, provider
					integrations, transcript access, and AI generation can fail or change.
					Recovery paths should keep your learning state understandable when a
					failure happens.
				</p>
			</PublicSection>
		</PublicContentPage>
	);
}

export { AboutPage, PrivacyPage, SelfHostingPage, TermsPage };
