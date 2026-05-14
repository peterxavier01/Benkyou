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
			title="Run Benkyou with Node, pnpm, Postgres, and explicit environment values."
			description="The current path is a straightforward local or server deployment. Docker is planned for the launch hardening phase and is not required for Phase 9."
		>
			<PublicSection title="Requirements">
				<dl>
					<PublicMetadataRow label="Node.js" value={<code>&gt;=20.19</code>} />
					<PublicMetadataRow
						label="Package manager"
						value={<code>pnpm</code>}
					/>
					<PublicMetadataRow
						label="Database"
						value="A reachable Postgres database connection string."
					/>
					<PublicMetadataRow
						label="Application"
						value="The TanStack Start app in apps/web."
					/>
				</dl>
			</PublicSection>

			<PublicSection
				title="Environment"
				description="Copy the example file, then fill in the values needed by the app and supporting packages."
			>
				<pre>
					<code>cp apps/web/.env.example apps/web/.env.local</code>
				</pre>
				<dl>
					<PublicMetadataRow
						label="DATABASE_URL"
						value="Postgres connection string used by the database package."
					/>
					<PublicMetadataRow
						label="BETTER_AUTH_SECRET"
						value="Secret used by Better Auth for hosted sessions."
					/>
					<PublicMetadataRow
						label="BETTER_AUTH_URL"
						value="Canonical app URL, for example http://localhost:3000."
					/>
					<PublicMetadataRow
						label="AI_PROVIDER"
						value="Currently openai for generated chapter fallback."
					/>
					<PublicMetadataRow
						label="AI_API_KEY and OPENAI_MODEL"
						value="Needed when real AI generation is enabled."
					/>
					<PublicMetadataRow
						label="YOUTUBE_API_KEY"
						value="Optional for YouTube metadata enrichment."
					/>
				</dl>
			</PublicSection>

			<PublicSection title="Database setup">
				<pre>
					<code>pnpm --filter @benkyou/db db:migrate</code>
				</pre>
				<pre>
					<code>pnpm --filter @benkyou/db db:seed</code>
				</pre>
				<p>
					Migrations and seed data live in <code>packages/db</code>. App-local
					schema files and database clients should not be added under{" "}
					<code>apps/web</code>.
				</p>
			</PublicSection>

			<PublicSection title="Run and build">
				<pre>
					<code>pnpm install</code>
				</pre>
				<pre>
					<code>pnpm --filter @benkyou/web dev</code>
				</pre>
				<pre>
					<code>pnpm --filter @benkyou/web build</code>
				</pre>
				<pre>
					<code>pnpm --filter @benkyou/web start</code>
				</pre>
				<PublicCallout>
					Docker files are tracked as Phase 10 launch hardening. Until then, use
					the Node, pnpm, and Postgres path above.
				</PublicCallout>
			</PublicSection>
		</PublicContentPage>
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
