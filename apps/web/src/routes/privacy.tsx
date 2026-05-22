import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "#/features/static/static-pages";
import { buildSeoHead } from "#lib/seo";

export const Route = createFileRoute("/privacy")({
	head: () =>
		buildSeoHead({
			path: "/privacy",
			title: "Privacy | Benkyou",
			description:
				"See what Benkyou stores, how local-first study state works, and when YouTube or AI providers are used to generate course structure.",
		}),
	component: PrivacyPage,
});
