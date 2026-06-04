import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "#/features/static/static-pages";
import { buildSeoHead, buildWebPageJsonLd } from "#lib/seo";

const title = "About Benkyou | Focused study from long-form video";
const description =
	"Learn how Benkyou helps self-directed learners turn tutorials, lectures, walkthroughs, and talks into focused study workspaces.";

export const Route = createFileRoute("/about")({
	head: () =>
		buildSeoHead({
			path: "/about",
			title,
			description,
			jsonLd: [buildWebPageJsonLd({ path: "/about", title, description })],
		}),
	component: AboutPage,
});
