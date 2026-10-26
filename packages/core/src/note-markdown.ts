import type {
	InlineComponentNode,
	MarkdownDocument,
	MarkdownExtension,
} from "@tanstack/markdown";
import { parseMarkdown } from "@tanstack/markdown/parser";
import { parseTimestamp } from "./course-generation";
import { formatTimestamp } from "./export";

/** Emitted tag for `[12:34]` video timestamps. Renderers map it to a seek control. */
export const NOTE_TIMESTAMP_TAG = "note-timestamp";

/** `[m:ss]`, `[mm:ss]` or `[h:mm:ss]`, unless it opens a link like `[1:00](url)`. */
const TIMESTAMP_PATTERN = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\](?![([])/;

/** Longest `==highlight==` span we look ahead for, so a lone `==` stays cheap. */
const MAX_HIGHLIGHT_LENGTH = 1000;

const noteTimestampExtension: MarkdownExtension = {
	name: "note-timestamp",
	inlineParser: {
		markers: "[",
		parse(context) {
			if (context.inLink) {
				return undefined;
			}

			const match = TIMESTAMP_PATTERN.exec(context.source.slice(context.index));
			const seconds = match ? parseTimestamp(match[1]) : null;
			if (!match || seconds === null) {
				return undefined;
			}

			const time = formatTimestamp(seconds);
			const node: InlineComponentNode = {
				type: "inlineComponent",
				name: "timestamp",
				tagName: NOTE_TIMESTAMP_TAG,
				attributes: { seconds: String(seconds) },
				properties: { "data-seconds": String(seconds), "data-time": time },
				children: [{ type: "text", value: time }],
			};

			return { node, length: match[0].length };
		},
	},
};

const noteHighlightExtension: MarkdownExtension = {
	name: "note-highlight",
	inlineParser: {
		markers: "=",
		parse(context) {
			const { source, index } = context;
			if (!source.startsWith("==", index)) {
				return undefined;
			}

			const contentStart = index + 2;
			const close = source.indexOf("==", contentStart);
			if (close === -1 || close - contentStart > MAX_HIGHLIGHT_LENGTH) {
				return undefined;
			}

			const content = source.slice(contentStart, close);
			if (content.trim() !== content || content === "") {
				return undefined;
			}

			const node: InlineComponentNode = {
				type: "inlineComponent",
				name: "highlight",
				tagName: "mark",
				attributes: {},
				children: context.parseInline(content),
			};

			return { node, length: close + 2 - index };
		},
	},
};

export const noteMarkdownExtensions: MarkdownExtension[] = [
	noteTimestampExtension,
	noteHighlightExtension,
];

/**
 * Parses a chapter note. Raw HTML stays escaped (notes are user content), and
 * the note extensions add `[12:34]` timestamps and `==highlights==`.
 */
export function parseNoteMarkdown(markdown: string): MarkdownDocument {
	return parseMarkdown(markdown, { extensions: noteMarkdownExtensions });
}

/** The Markdown written into a note for a moment in the video. */
export function formatNoteTimestamp(seconds: number) {
	return `[${formatTimestamp(seconds)}]`;
}

/**
 * Inserts `insertion` over the selected range, padding it with spaces so it
 * doesn't run into the surrounding words. Returns the new text and caret.
 */
export function insertIntoText(
	text: string,
	selectionStart: number,
	selectionEnd: number,
	insertion: string,
) {
	const before = text.slice(0, selectionStart);
	const after = text.slice(selectionEnd);
	const leading = before === "" || /\s$/.test(before) ? "" : " ";
	const trailing = /^\s/.test(after) ? "" : " ";
	const inserted = `${leading}${insertion}${trailing}`;

	return {
		text: `${before}${inserted}${after}`,
		caret: before.length + inserted.length,
	};
}
