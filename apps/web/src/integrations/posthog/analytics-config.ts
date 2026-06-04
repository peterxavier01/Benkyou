const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

interface AnalyticsEnv {
	DEV?: unknown;
	MODE?: unknown;
	NODE_ENV?: unknown;
	VITE_PUBLIC_POSTHOG_DISABLED?: unknown;
	VITE_PUBLIC_POSTHOG_ENABLE_IN_DEVELOPMENT?: unknown;
	VITE_PUBLIC_POSTHOG_HOST?: unknown;
	VITE_PUBLIC_POSTHOG_KEY?: unknown;
}

export interface AnalyticsConfig {
	enabled: boolean;
	host: string;
	key: string | null;
}

export function getAnalyticsConfig() {
	const config = resolveAnalyticsConfig({
		DEV: import.meta.env.DEV,
		MODE: import.meta.env.MODE,
		VITE_PUBLIC_POSTHOG_DISABLED: import.meta.env.VITE_PUBLIC_POSTHOG_DISABLED,
		VITE_PUBLIC_POSTHOG_ENABLE_IN_DEVELOPMENT: import.meta.env
			.VITE_PUBLIC_POSTHOG_ENABLE_IN_DEVELOPMENT,
		VITE_PUBLIC_POSTHOG_HOST: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
		VITE_PUBLIC_POSTHOG_KEY: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
	});

	console.log("[Analytics Config]", config);
	return config;
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
	const disabled =
		isTruthyEnvValue(env.VITE_PUBLIC_POSTHOG_DISABLED) ||
		(isDevelopmentEnv(env) &&
			!isTruthyEnvValue(env.VITE_PUBLIC_POSTHOG_ENABLE_IN_DEVELOPMENT));

	return {
		enabled: Boolean(key) && !disabled,
		host,
		key,
	};
}

function normalizeEnvValue(value: unknown) {
	const trimmed = typeof value === "string" ? value.trim() : "";
	return trimmed ? trimmed : null;
}

function isDevelopmentEnv(env: AnalyticsEnv) {
	if (typeof env.DEV === "boolean") {
		return env.DEV;
	}

	return (
		normalizeEnvValue(env.DEV)?.toLowerCase() === "true" ||
		normalizeEnvValue(env.MODE)?.toLowerCase() === "development" ||
		normalizeEnvValue(env.NODE_ENV)?.toLowerCase() === "development"
	);
}

function isTruthyEnvValue(value: unknown) {
	const normalized = normalizeEnvValue(value)?.toLowerCase();
	return (
		normalized === "1" ||
		normalized === "true" ||
		normalized === "yes" ||
		normalized === "on"
	);
}
