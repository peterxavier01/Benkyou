import { getAnalyticsConfig } from "./analytics-config";

type AnalyticsPrimitive = boolean | number | string | null;
type AnalyticsProperty =
	| AnalyticsPrimitive
	| AnalyticsPrimitive[]
	| Record<string, AnalyticsPrimitive>;

export type AnalyticsProperties = Record<string, AnalyticsProperty | undefined>;

export type AnalyticsEventName =
	| "auth_mode_changed"
	| "bookmark_created"
	| "bookmark_deleted"
	| "bookmark_filter_changed"
	| "bookmark_jumped_to"
	| "bookmark_updated"
	| "chapter_completion_changed"
	| "chapter_metadata_updated"
	| "chapter_selected"
	| "course_create_failed"
	| "course_create_submitted"
	| "course_create_succeeded"
	| "course_deleted"
	| "course_exported"
	| "course_metadata_updated"
	| "course_opened"
	| "course_regenerate_requested"
	| "fullscreen_toggled"
	| "generation_job_cancelled"
	| "generation_job_completed"
	| "generation_job_failed"
	| "generation_job_retry_requested"
	| "generation_job_started"
	| "generation_status_completed_viewed"
	| "generation_status_failed_viewed"
	| "learning_preferences_updated"
	| "library_filter_changed"
	| "local_data_reset"
	| "note_markdown_copied"
	| "note_preview_opened"
	| "note_save_failed"
	| "note_saved"
	| "playback_milestone_reached"
	| "playback_paused"
	| "playback_speed_changed"
	| "playback_started"
	| "sample_course_opened"
	| "sign_in_failed"
	| "sign_in_succeeded"
	| "sign_out_succeeded"
	| "sign_up_failed"
	| "sign_up_succeeded";

interface AnalyticsUser {
	email?: string | null;
	id: string;
	name?: string | null;
}

type PostHogClient = typeof import("posthog-js").default;

let posthogPromise: Promise<PostHogClient | null> | null = null;

export function initializeAnalytics() {
	void getPostHog();
}

export function trackAnalyticsEvent(
	eventName: AnalyticsEventName,
	properties: AnalyticsProperties = {},
) {
	void getPostHog().then((posthog) => {
		posthog?.capture(eventName, compactProperties(properties));
	});
}

export function identifyAnalyticsUser(user: AnalyticsUser) {
	void getPostHog().then((posthog) => {
		posthog?.identify(user.id, {
			email: user.email ?? undefined,
			name: user.name ?? undefined,
		});
	});
}

export function resetAnalyticsUser() {
	void getPostHog().then((posthog) => {
		posthog?.reset();
	});
}

function getPostHog() {
	if (!isBrowser()) {
		return Promise.resolve(null);
	}

	const config = getAnalyticsConfig();
	const key = config.key;
	if (!config.enabled || !key) {
		return Promise.resolve(null);
	}

	posthogPromise ??= import("posthog-js").then(({ default: posthog }) => {
		if (!posthog.__loaded) {
			posthog.init(key, {
				api_host: config.host,
				autocapture: true,
				capture_pageview: "history_change",
				disable_session_recording: true,
			});
		}

		return posthog;
	});

	return posthogPromise;
}

function compactProperties(properties: AnalyticsProperties) {
	return Object.fromEntries(
		Object.entries(properties).filter(([, value]) => value !== undefined),
	);
}

function isBrowser() {
	return typeof window !== "undefined";
}
