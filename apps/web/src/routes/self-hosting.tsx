import { createFileRoute } from "@tanstack/react-router";
import { SelfHostingPage } from "#/features/static/self-hosting-page";
import { buildSeoHead, buildWebPageJsonLd } from "#lib/seo";

const title = "Self-host Benkyou | Run it on your own server";
const description =
	"Run Benkyou with one Docker Compose command. Your notebooks stay in your own Postgres, and analytics stay off unless you turn them on.";

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
