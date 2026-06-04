import { describe, expect, test } from "vitest";
import { trackAnalyticsEvent } from "./analytics";
import {
	getServerAnalyticsConfig,
	resolveAnalyticsConfig,
} from "./analytics-config";

describe("PostHog analytics config", () => {
	test("is disabled when no public PostHog key is configured", () => {
		expect(resolveAnalyticsConfig({})).toEqual({
			enabled: false,
			host: "https://us.i.posthog.com",
			key: null,
		});
	});

	test("trims configured PostHog key and host", () => {
		expect(
			resolveAnalyticsConfig({
				VITE_PUBLIC_POSTHOG_HOST: " https://eu.i.posthog.com ",
				VITE_PUBLIC_POSTHOG_KEY: " phc_test ",
			}),
		).toEqual({
			enabled: true,
			host: "https://eu.i.posthog.com",
			key: "phc_test",
		});
	});

	test("is disabled when analytics is explicitly disabled", () => {
		expect(
			resolveAnalyticsConfig({
				VITE_PUBLIC_POSTHOG_DISABLED: "true",
				VITE_PUBLIC_POSTHOG_KEY: "phc_test",
			}),
		).toEqual({
			enabled: false,
			host: "https://us.i.posthog.com",
			key: "phc_test",
		});
	});

	test("is disabled in development unless explicitly enabled", () => {
		expect(
			resolveAnalyticsConfig({
				DEV: true,
				VITE_PUBLIC_POSTHOG_KEY: "phc_test",
			}),
		).toEqual({
			enabled: false,
			host: "https://us.i.posthog.com",
			key: "phc_test",
		});

		expect(
			resolveAnalyticsConfig({
				NODE_ENV: "development",
				VITE_PUBLIC_POSTHOG_ENABLE_IN_DEVELOPMENT: "true",
				VITE_PUBLIC_POSTHOG_KEY: "phc_test",
			}),
		).toEqual({
			enabled: true,
			host: "https://us.i.posthog.com",
			key: "phc_test",
		});
	});

	test("tracking is a no-op when analytics is disabled", () => {
		expect(() => trackAnalyticsEvent("course_opened")).not.toThrow();
	});

	test("server analytics config reads runtime environment values", () => {
		expect(
			getServerAnalyticsConfig({
				VITE_PUBLIC_POSTHOG_HOST: " https://eu.i.posthog.com ",
				VITE_PUBLIC_POSTHOG_KEY: " phc_runtime ",
			}),
		).toEqual({
			enabled: true,
			host: "https://eu.i.posthog.com",
			key: "phc_runtime",
		});
	});
});
