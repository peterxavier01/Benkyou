import { createFileRoute } from "@tanstack/react-router";
import { SelfHostingPage } from "#/features/static/static-pages";
import { buildSeoHead } from "#lib/seo";

export const Route = createFileRoute("/self-hosting")({
	head: () =>
		buildSeoHead({
			path: "/self-hosting",
			title: "Self-host Benkyou | Private video study workspace",
			description:
				"Run Benkyou with Docker Compose, Postgres, local-first study state, and server-side provider keys you control.",
		}),
	component: SelfHostingPage,
});
