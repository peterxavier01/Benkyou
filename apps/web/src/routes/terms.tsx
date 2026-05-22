import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "#/features/static/static-pages";
import { buildSeoHead } from "#lib/seo";

export const Route = createFileRoute("/terms")({
	head: () =>
		buildSeoHead({
			path: "/terms",
			title: "Terms | Benkyou",
			description:
				"Review Benkyou's acceptable-use boundaries for personal study workspaces, external video sources, and AI-generated course material.",
		}),
	component: TermsPage,
});
