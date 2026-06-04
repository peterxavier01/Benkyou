import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "#/features/course-generation/components/home-screen";
import {
	buildSeoHead,
	buildWebApplicationJsonLd,
	buildWebPageJsonLd,
	buildWebsiteJsonLd,
} from "#lib/seo";

const title = "Benkyou | Turn long videos into focused study workspaces";
const description =
	"Study tutorials, lectures, talks, and walkthroughs with chapters, notes, bookmarks, and progress in one recoverable workspace.";

export const Route = createFileRoute("/")({
	head: () =>
		buildSeoHead({
			path: "/",
			title,
			description,
			jsonLd: [
				buildWebsiteJsonLd(),
				buildWebApplicationJsonLd(),
				buildWebPageJsonLd({ path: "/", title, description }),
			],
		}),
	component: HomeScreen,
});
