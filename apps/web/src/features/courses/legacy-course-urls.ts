import { type ParsedLocation, redirect } from "@tanstack/react-router";

/** Maps an old /courses URL to the same place under /notebooks. */
export function toNotebookUrl(href: string) {
	return href.replace(/^\/courses(?=[/?#]|$)/, "/notebooks");
}

/**
 * Notebooks used to live under /courses. Old bookmarks and shared links move
 * permanently to /notebooks, keeping the search and hash.
 */
export function redirectFromLegacyCourseUrl(location: ParsedLocation): never {
	throw redirect({ href: toNotebookUrl(location.href), statusCode: 301 });
}
