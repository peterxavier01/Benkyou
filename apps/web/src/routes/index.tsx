import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "#/features/course-generation/components/home-screen";
import { buildSeoHead } from "#lib/seo";

export const Route = createFileRoute("/")({
	head: () =>
		buildSeoHead({
			path: "/",
			title: "Benkyou | Turn long videos into focused study workspaces",
			description:
				"Study tutorials, lectures, talks, and walkthroughs with chapters, notes, bookmarks, and progress in one recoverable workspace.",
		}),
	component: HomeScreen,
});
