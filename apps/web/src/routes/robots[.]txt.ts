import { createFileRoute } from "@tanstack/react-router";
import { getCanonicalUrl } from "#lib/seo";

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () =>
				new Response(buildRobotsTxt(), {
					headers: {
						"content-type": "text/plain; charset=utf-8",
					},
				}),
		},
	},
});

function buildRobotsTxt() {
	return [
		"User-agent: *",
		"Allow: /$",
		"Allow: /about$",
		"Allow: /self-hosting$",
		"Allow: /privacy$",
		"Allow: /terms$",
		"Disallow: /sign-in",
		"Disallow: /courses",
		"Disallow: /bookmarks",
		"Disallow: /settings",
		"Disallow: /api",
		`Sitemap: ${getCanonicalUrl("/sitemap.xml")}`,
		"",
	].join("\n");
}
