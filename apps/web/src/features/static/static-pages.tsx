import {
	PublicCallout,
	PublicContentPage,
	PublicSection,
} from "#components/public-content-page";

function PrivacyPage() {
	return (
		<PublicContentPage
			eyebrow="Privacy"
			title="Benkyou keeps the learning loop local-first and explicit."
			description="This Open Beta privacy summary explains what the app stores, when external providers are involved, and how learner data is used."
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
					The Open Beta currently supports YouTube URLs. Benkyou may request
					video metadata, thumbnails, descriptions, and transcript or caption
					data needed to create the study workspace. Playback remains handled by
					the external video provider.
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
			description="These Open Beta terms are written in plain language so learners understand the boundaries of generated study materials."
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
					The Open Beta is provided as an early learning tool. Availability,
					provider integrations, transcript access, and AI generation can fail
					or change. Recovery paths should keep your learning state
					understandable when a failure happens.
				</p>
			</PublicSection>
		</PublicContentPage>
	);
}

export { PrivacyPage, TermsPage };
