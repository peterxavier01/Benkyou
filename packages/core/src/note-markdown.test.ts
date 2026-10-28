import assert from "node:assert/strict";
import test from "node:test";
import type { BlockNode, InlineNode } from "@tanstack/markdown";

import {
	formatNoteTimestamp,
	insertIntoText,
	NOTE_TIMESTAMP_TAG,
	parseNoteMarkdown,
} from "./note-markdown";

function firstParagraph(markdown: string): InlineNode[] {
	const block = parseNoteMarkdown(markdown).children[0] as BlockNode;
	assert.equal(block.type, "paragraph");
	return block.type === "paragraph" ? block.children : [];
}

function timestamps(nodes: InlineNode[]) {
	return nodes.flatMap((node) =>
		node.type === "inlineComponent" && node.tagName === NOTE_TIMESTAMP_TAG
			? [node.properties]
			: [],
	);
}

test("parseNoteMarkdown turns [m:ss] and [h:mm:ss] into timestamps", () => {
	const nodes = firstParagraph("Named by timestamp [30:21] and [1:02:03].");

	assert.deepEqual(timestamps(nodes), [
		{ "data-seconds": "1821", "data-time": "30:21" },
		{ "data-seconds": "3723", "data-time": "1:02:03" },
	]);
});

test("parseNoteMarkdown normalizes the timestamp label", () => {
	const nodes = firstParagraph("[05:07]");

	assert.deepEqual(timestamps(nodes), [
		{ "data-seconds": "307", "data-time": "5:07" },
	]);
});

test("parseNoteMarkdown leaves invalid or linked times alone", () => {
	assert.deepEqual(timestamps(firstParagraph("[1:75] and [12]")), []);
	assert.deepEqual(timestamps(firstParagraph("`[1:00]`")), []);

	const linked = firstParagraph("[1:00](https://example.com)");
	assert.equal(linked[0]?.type, "link");
	assert.deepEqual(timestamps(linked), []);
});

test("parseNoteMarkdown turns ==text== into a highlight with inline children", () => {
	const nodes = firstParagraph("Never ==edit **shipped** ones== again.");
	const mark = nodes.find((node) => node.type === "inlineComponent");

	assert.equal(mark?.type, "inlineComponent");
	if (mark?.type !== "inlineComponent") return;
	assert.equal(mark.tagName, "mark");
	assert.deepEqual(
		mark.children.map((child) => child.type),
		["text", "strong", "text"],
	);
});

test("parseNoteMarkdown ignores == used as an operator", () => {
	const nodes = firstParagraph("if a == b == c");

	assert.equal(
		nodes.some((node) => node.type === "inlineComponent"),
		false,
	);
});

test("parseNoteMarkdown keeps raw HTML as text", () => {
	const nodes = firstParagraph("<img src=x onerror=alert(1)>");

	assert.equal(
		nodes.some((node) => node.type === "inlineHtml"),
		false,
	);
});

test("formatNoteTimestamp writes the Markdown syntax", () => {
	assert.equal(formatNoteTimestamp(1821.7), "[30:21]");
	assert.equal(formatNoteTimestamp(3723), "[1:02:03]");
});

test("insertIntoText pads the insertion away from surrounding words", () => {
	assert.deepEqual(insertIntoText("Hello world", 5, 5, "[1:00]"), {
		text: "Hello [1:00] world",
		caret: 12,
	});
	assert.deepEqual(insertIntoText("", 0, 0, "[1:00]"), {
		text: "[1:00] ",
		caret: 7,
	});
	assert.deepEqual(insertIntoText("See  later", 4, 4, "[1:00]"), {
		text: "See [1:00] later",
		caret: 10,
	});
});

test("insertIntoText replaces the selected text", () => {
	assert.deepEqual(insertIntoText("Go to HERE now", 6, 10, "[2:00]"), {
		text: "Go to [2:00] now",
		caret: 12,
	});
});
