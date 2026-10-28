import { createFileRoute } from "@tanstack/react-router";
import { HowItWorksPage } from "#/features/static/how-it-works-page";
import { buildSeoHead, buildWebPageJsonLd } from "#lib/seo";

const title = "How Benkyou works | From a YouTube link to a study notebook";
const description =
	"Paste a YouTube link and get chapters, Markdown notes, bookmarks and progress that stay put between sessions.";

export const Route = createFileRoute("/how-it-works")({
	head: () =>
		buildSeoHead({
			path: "/how-it-works",
			title,
			description,
			jsonLd: [
				buildWebPageJsonLd({ path: "/how-it-works", title, description }),
			],
		}),
	component: HowItWorksPage,
});
