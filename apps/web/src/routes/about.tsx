import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "#/features/static/static-pages";
import { buildSeoHead } from "#lib/seo";

export const Route = createFileRoute("/about")({
	head: () =>
		buildSeoHead({
			path: "/about",
			title: "About Benkyou | Focused study from long-form video",
			description:
				"Learn how Benkyou helps self-directed learners turn tutorials, lectures, walkthroughs, and talks into structured course workspaces.",
		}),
	component: AboutPage,
});
