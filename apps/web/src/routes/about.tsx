import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "#/features/static/about-page";
import { buildSeoHead, buildWebPageJsonLd } from "#lib/seo";

const title = "About Benkyou | Study notebooks for long videos";
const description =
	"Why Benkyou exists, what it is and isn’t, and the principles behind it: a free, open-source study layer for tutorials, lectures and talks.";

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
