import { createFileRoute } from "@tanstack/react-router";
import { SelfHostingPage } from "#/features/static/static-pages";
import { buildSeoHead, buildWebPageJsonLd } from "#lib/seo";

const title = "Self-host Benkyou | Private video study workspace";
const description =
	"Run Benkyou with Docker Compose, Postgres, local-first study state, and server-side provider keys you control.";

export const Route = createFileRoute("/self-hosting")({
	head: () =>
		buildSeoHead({
			path: "/self-hosting",
			title,
			description,
			jsonLd: [
				buildWebPageJsonLd({ path: "/self-hosting", title, description }),
			],
		}),
	component: SelfHostingPage,
});
