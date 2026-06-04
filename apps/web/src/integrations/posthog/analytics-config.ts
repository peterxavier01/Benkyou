const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

interface AnalyticsEnv {
	VITE_PUBLIC_POSTHOG_HOST?: unknown;
	VITE_PUBLIC_POSTHOG_KEY?: unknown;
}

export interface AnalyticsConfig {
	enabled: boolean;
	host: string;
	key: string | null;
}

export function getAnalyticsConfig() {
	return resolveAnalyticsConfig({
		VITE_PUBLIC_POSTHOG_HOST: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
		VITE_PUBLIC_POSTHOG_KEY: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
	});
}

export function getServerAnalyticsConfig(
	env: AnalyticsEnv = process.env,
): AnalyticsConfig {
	return resolveAnalyticsConfig(env);
}

export function resolveAnalyticsConfig(env: AnalyticsEnv): AnalyticsConfig {
	const key = normalizeEnvValue(env.VITE_PUBLIC_POSTHOG_KEY);
	const host =
		normalizeEnvValue(env.VITE_PUBLIC_POSTHOG_HOST) ?? DEFAULT_POSTHOG_HOST;

	return {
		enabled: Boolean(key),
		host,
		key,
	};
}

function normalizeEnvValue(value: unknown) {
	const trimmed = typeof value === "string" ? value.trim() : "";
	return trimmed ? trimmed : null;
}
