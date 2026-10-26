import { createHighlighter } from "@tanstack/highlight/core";
import { c } from "@tanstack/highlight/languages/c";
import { cpp } from "@tanstack/highlight/languages/cpp";
import { csharp } from "@tanstack/highlight/languages/csharp";
import { css } from "@tanstack/highlight/languages/css";
import { diff } from "@tanstack/highlight/languages/diff";
import { go } from "@tanstack/highlight/languages/go";
import { html } from "@tanstack/highlight/languages/html";
import { java } from "@tanstack/highlight/languages/java";
import { js } from "@tanstack/highlight/languages/js";
import { json } from "@tanstack/highlight/languages/json";
import { jsx } from "@tanstack/highlight/languages/jsx";
import { kotlin } from "@tanstack/highlight/languages/kotlin";
import { php } from "@tanstack/highlight/languages/php";
import { python } from "@tanstack/highlight/languages/python";
import { rust } from "@tanstack/highlight/languages/rust";
import { shell } from "@tanstack/highlight/languages/shell";
import { sql } from "@tanstack/highlight/languages/sql";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";
import { yaml } from "@tanstack/highlight/languages/yaml";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";

/**
 * Languages people most often paste from programming videos. Each one adds to
 * the client bundle, and unknown fences fall back to escaped plain text.
 * Shared by server and client rendering so hydration output matches.
 */
const highlighter = createHighlighter({
	languages: [
		c,
		cpp,
		csharp,
		css,
		diff,
		go,
		html,
		java,
		js,
		json,
		jsx,
		kotlin,
		php,
		python,
		rust,
		shell,
		sql,
		ts,
		tsx,
		yaml,
	],
});

/** Returns escaped token markup for TanStack Markdown's `<pre><code>`. */
export const highlightMarkdownCode =
	createTanStackMarkdownHighlighter(highlighter);
