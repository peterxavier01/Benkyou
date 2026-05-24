import { PRODUCT_NAME } from "@benkyou/core";

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_TITLE = "Benkyou | Focused study workspaces for long videos";
const DEFAULT_DESCRIPTION =
	"Study tutorials, lectures, talks, and walkthroughs with chapters, notes, bookmarks, and progress in one recoverable workspace.";
const DEFAULT_IMAGE_PATH = "/social-card.png";
const DEFAULT_THEME_COLOR = "#00694c";

type SeoIndexing = "index" | "noindex";

interface SeoOptions {
	canonical?: boolean;
	description?: string;
	imagePath?: string;
	indexing?: SeoIndexing;
	path?: string;
	title?: string;
	type?: "website" | "article";
}

export const PUBLIC_SEO_ROUTES = [
	{
		path: "/",
		priority: "1.0",
	},
	{
		path: "/about",
		priority: "0.7",
	},
	{
		path: "/self-hosting",
		priority: "0.8",
	},
	{
		path: "/privacy",
		priority: "0.4",
	},
	{
		path: "/terms",
		priority: "0.4",
	},
] as const;

export function buildSeoHead(options: SeoOptions = {}) {
	const title = options.title ?? DEFAULT_TITLE;
	const description = options.description ?? DEFAULT_DESCRIPTION;
	const indexing = options.indexing ?? "index";
	const canonicalUrl = getCanonicalUrl(options.path ?? "/");
	const imageUrl = getCanonicalUrl(options.imagePath ?? DEFAULT_IMAGE_PATH);
	const robots =
		indexing === "index"
			? "index,follow"
			: "noindex,nofollow,noarchive,nosnippet";

	return {
		meta: [
			{ title },
			{ name: "description", content: description },
			{ name: "application-name", content: PRODUCT_NAME },
			{ name: "robots", content: robots },
			{ name: "theme-color", content: DEFAULT_THEME_COLOR },
			{ property: "og:site_name", content: PRODUCT_NAME },
			{ property: "og:type", content: options.type ?? "website" },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:url", content: canonicalUrl },
			{ property: "og:image", content: imageUrl },
			{ property: "og:image:alt", content: `${PRODUCT_NAME} study workspace` },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: imageUrl },
		],
		links: [
			...(options.canonical === false
				? []
				: [{ rel: "canonical", href: canonicalUrl }]),
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "icon", href: "/favicon.ico", sizes: "any" },
			{ rel: "apple-touch-icon", href: "/logo192.png" },
		],
	};
}

export function buildNoIndexHead(title: string, description: string) {
	return buildSeoHead({
		canonical: false,
		title,
		description,
		indexing: "noindex",
	});
}

export function getCanonicalUrl(path: string) {
	const siteUrl = getPublicSiteUrl();
	return new URL(path, siteUrl).toString();
}

export function getPublicSiteUrl() {
	const rawUrl =
		getRuntimeEnvValue("PUBLIC_SITE_URL") ??
		getRuntimeEnvValue("VITE_PUBLIC_SITE_URL") ??
		DEFAULT_SITE_URL;

	try {
		return new URL(rawUrl).origin;
	} catch {
		return DEFAULT_SITE_URL;
	}
}

function getRuntimeEnvValue(key: string) {
	const globalWithProcess = globalThis as {
		process?: { env?: Record<string, string | undefined> };
	};

	return globalWithProcess.process?.env?.[key] ?? import.meta.env[key];
}
