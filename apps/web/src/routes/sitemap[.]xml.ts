import { createFileRoute } from "@tanstack/react-router";
import { getCanonicalUrl, PUBLIC_SEO_ROUTES } from "#lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: () =>
				new Response(buildSitemapXml(), {
					headers: {
						"content-type": "application/xml; charset=utf-8",
					},
				}),
		},
	},
});

function buildSitemapXml() {
	const urls = PUBLIC_SEO_ROUTES.map(
		(route) => `  <url>
    <loc>${escapeXml(getCanonicalUrl(route.path))}</loc>
    <priority>${route.priority}</priority>
  </url>`,
	).join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function escapeXml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}
