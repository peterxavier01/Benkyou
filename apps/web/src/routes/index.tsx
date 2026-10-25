import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "#/features/course-generation/components/home-screen";
import {
	buildSeoHead,
	buildWebApplicationJsonLd,
	buildWebPageJsonLd,
	buildWebsiteJsonLd,
} from "#lib/seo";

const title = "Benkyou | Study notebooks for long videos";
const description =
	"Paste a YouTube link. Benkyou gives it chapters, notes, bookmarks and progress, and keeps them right where you left them. Free and open source.";

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
