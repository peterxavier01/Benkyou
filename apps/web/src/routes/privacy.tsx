import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "#/features/static/static-pages";
import { buildSeoHead, buildWebPageJsonLd } from "#lib/seo";

const title = "Privacy | Benkyou";
const description =
	"See what Benkyou stores, how local-first study state works, and when video or AI providers are used to prepare study structure.";

export const Route = createFileRoute("/privacy")({
	head: () =>
		buildSeoHead({
			path: "/privacy",
			title,
			description,
			jsonLd: [buildWebPageJsonLd({ path: "/privacy", title, description })],
		}),
	component: PrivacyPage,
});
