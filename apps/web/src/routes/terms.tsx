import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "#/features/static/static-pages";
import { buildSeoHead, buildWebPageJsonLd } from "#lib/seo";

const title = "Terms | Benkyou";
const description =
	"Review Benkyou's acceptable-use boundaries for personal study workspaces, external video sources, and AI-generated course material.";

export const Route = createFileRoute("/terms")({
	head: () =>
		buildSeoHead({
			path: "/terms",
			title,
			description,
			jsonLd: [buildWebPageJsonLd({ path: "/terms", title, description })],
		}),
	component: TermsPage,
});
