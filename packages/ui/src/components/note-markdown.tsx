import type { MarkdownDocument } from "@tanstack/markdown";
import {
	Markdown,
	type MarkdownComponentProps,
	type MarkdownComponents,
} from "@tanstack/markdown/react";
import { useMemo } from "react";
import { highlightMarkdownCode } from "#lib/code-highlighter";
import { cn } from "#lib/utils";
import { TimestampChip } from "./study-blocks";

/** Must match `NOTE_TIMESTAMP_TAG` from `@benkyou/core`. */
const TIMESTAMP_TAG = "note-timestamp";

type TimestampProps = {
	"data-seconds"?: string;
	"data-time"?: string;
};

function ExternalLink({ href, ...props }: MarkdownComponentProps<"a">) {
	const external = /^https?:\/\//i.test(href ?? "");
	return (
		<a
			href={href}
			{...props}
			{...(external && { target: "_blank", rel: "noopener noreferrer" })}
		/>
	);
}

/**
 * Renders a parsed chapter note: GFM-style Markdown, highlighted code blocks,
 * `==highlights==`, and `[12:34]` timestamps that call `onSeekTimestamp`.
 * Parse the note with `parseNoteMarkdown` from `@benkyou/core`.
 */
function NoteMarkdown({
	document,
	onSeekTimestamp,
	className,
}: {
	document: MarkdownDocument;
	onSeekTimestamp?: (seconds: number) => void;
	className?: string;
}) {
	const components = useMemo<MarkdownComponents>(
		() => ({
			a: ExternalLink,
			[TIMESTAMP_TAG]: ({
				"data-seconds": seconds,
				"data-time": time = "",
			}: TimestampProps) => (
				<TimestampChip
					time={time}
					disabled={!onSeekTimestamp}
					className="mx-0.5 disabled:pointer-events-none"
					onClick={() => onSeekTimestamp?.(Number(seconds))}
				/>
			),
		}),
		[onSeekTimestamp],
	);

	return (
		<div data-slot="note-markdown" className={cn("note-markdown", className)}>
			<Markdown components={components} highlighter={highlightMarkdownCode}>
				{document}
			</Markdown>
		</div>
	);
}

export { NoteMarkdown };
