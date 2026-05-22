import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "#/features/course-generation/components/home-screen";
import { buildSeoHead } from "#lib/seo";

export const Route = createFileRoute("/")({
	head: () =>
		buildSeoHead({
			path: "/",
			title: "Benkyou | Turn a video into a structured course",
			description:
				"Paste a YouTube URL and study with generated chapters, Markdown notes, saved timestamps, and progress you can resume later.",
		}),
	component: HomeScreen,
});
