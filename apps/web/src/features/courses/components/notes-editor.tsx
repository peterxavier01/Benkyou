import {
	DEFAULT_NOTE_AUTOSAVE_DEBOUNCE_MS,
	LOCAL_STORAGE_KEYS,
} from "@benkyou/core";
import type {
	ChapterNoteDTO,
	CourseChapterDTO,
	CoursePlayerDataDTO,
} from "@benkyou/types";
import { Button, HugeIcon, StatusBadge, Textarea } from "@benkyou/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";
import { upsertChapterNote } from "../course-workspace.functions";

type SaveState = "saved" | "saving" | "unsaved" | "failed" | "conflict";

interface NotesEditorProps {
	courseId: string;
	chapter: CourseChapterDTO | null;
	note: ChapterNoteDTO | undefined;
}

interface NoteDraft {
	chapterId: string;
	courseId: string;
	markdown: string;
	serverUpdatedAt: string | null;
	savedAt: string;
}

interface SaveSnapshot {
	chapterId: string;
	markdown: string;
	expectedUpdatedAt: string | null;
}

const draftStorageKey = `${LOCAL_STORAGE_KEYS.notes}:drafts`;

function NotesEditor({ courseId, chapter, note }: NotesEditorProps) {
	const queryClient = useQueryClient();
	const saveNote = useServerFn(upsertChapterNote);
	const [mode, setMode] = useState<"write" | "preview">("write");
	const [markdown, setMarkdown] = useState(note?.markdown ?? "");
	const [lastSavedMarkdown, setLastSavedMarkdown] = useState(
		note?.markdown ?? "",
	);
	const [baseUpdatedAt, setBaseUpdatedAt] = useState(note?.updatedAt ?? null);
	const [saveState, setSaveState] = useState<SaveState>("saved");
	const [availableDraft, setAvailableDraft] = useState<NoteDraft | null>(null);
	const [copied, setCopied] = useState(false);
	const latestRef = useRef({
		chapterId: chapter?.id ?? null,
		markdown,
		lastSavedMarkdown,
		baseUpdatedAt,
	});
	const previousChapterIdRef = useRef(chapter?.id ?? null);
	const inFlightRef = useRef(false);
	const queuedSaveRef = useRef<SaveSnapshot | null>(null);

	const { mutateAsync: saveNoteMutation } = useMutation({
		mutationFn: (input: SaveSnapshot) =>
			saveNote({
				data: {
					chapterId: input.chapterId,
					markdown: input.markdown,
					expectedUpdatedAt: input.expectedUpdatedAt,
				},
			}),
	});

	const saveSnapshot = useCallback(
		async (snapshot: SaveSnapshot) => {
			if (inFlightRef.current) {
				queuedSaveRef.current = snapshot;
				writeDraft({
					courseId,
					chapterId: snapshot.chapterId,
					markdown: snapshot.markdown,
					serverUpdatedAt: snapshot.expectedUpdatedAt,
					savedAt: new Date().toISOString(),
				});
				setSaveState("saving");
				return;
			}

			inFlightRef.current = true;
			setSaveState("saving");
			writeDraft({
				courseId,
				chapterId: snapshot.chapterId,
				markdown: snapshot.markdown,
				serverUpdatedAt: snapshot.expectedUpdatedAt,
				savedAt: new Date().toISOString(),
			});
			let savedNote: ChapterNoteDTO | null = null;

			try {
				const result = await saveNoteMutation(snapshot);
				savedNote = result.note;

				queryClient.setQueryData<CoursePlayerDataDTO>(
					["course-player", courseId],
					(current) =>
						current
							? {
									...current,
									notes: mergeNote(current.notes, result.note),
								}
							: current,
				);
				trackAnalyticsEvent("note_saved", {
					markdown_length: result.note.markdown.length,
				});

				if (latestRef.current.chapterId === snapshot.chapterId) {
					const latestMarkdown = latestRef.current.markdown;
					setLastSavedMarkdown(result.note.markdown);
					setBaseUpdatedAt(result.note.updatedAt);
					setAvailableDraft(null);

					if (latestMarkdown === snapshot.markdown) {
						removeDraft(courseId, snapshot.chapterId);
						setSaveState("saved");
					} else {
						setSaveState(queuedSaveRef.current ? "saving" : "unsaved");
					}
				}
			} catch (error) {
				const message =
					error instanceof Error ? error.message.toLowerCase() : "";
				if (message.includes("changed in another session")) {
					setSaveState("conflict");
				} else {
					setSaveState("failed");
				}
				trackAnalyticsEvent("note_save_failed", {
					reason: message.includes("changed in another session")
						? "conflict"
						: "save_failed",
				});
			} finally {
				inFlightRef.current = false;
				const queued = queuedSaveRef.current;
				queuedSaveRef.current = null;

				if (
					queued &&
					(queued.chapterId !== snapshot.chapterId ||
						queued.markdown !== snapshot.markdown)
				) {
					const nextQueued =
						savedNote && queued.chapterId === savedNote.chapterId
							? { ...queued, expectedUpdatedAt: savedNote.updatedAt }
							: queued;
					void saveSnapshot(nextQueued);
				}
			}
		},
		[courseId, queryClient, saveNoteMutation],
	);

	useEffect(() => {
		latestRef.current = {
			chapterId: chapter?.id ?? null,
			markdown,
			lastSavedMarkdown,
			baseUpdatedAt,
		};
	}, [chapter?.id, markdown, lastSavedMarkdown, baseUpdatedAt]);

	useEffect(() => {
		const previousChapterId = previousChapterIdRef.current;
		const nextChapterId = chapter?.id ?? null;
		const latest = latestRef.current;

		if (
			previousChapterId &&
			previousChapterId !== nextChapterId &&
			latest.markdown !== latest.lastSavedMarkdown
		) {
			void saveSnapshot({
				chapterId: previousChapterId,
				markdown: latest.markdown,
				expectedUpdatedAt: latest.baseUpdatedAt,
			});
		}

		previousChapterIdRef.current = nextChapterId;

		const serverMarkdown = note?.markdown ?? "";
		const serverUpdatedAt = note?.updatedAt ?? null;
		const draft = nextChapterId
			? getDraft(courseId, nextChapterId, serverUpdatedAt)
			: null;
		const chapterChanged = previousChapterId !== nextChapterId;
		const hasLocalChanges = latest.markdown !== latest.lastSavedMarkdown;

		if (chapterChanged || !hasLocalChanges) {
			setMarkdown(serverMarkdown);
			setLastSavedMarkdown(serverMarkdown);
			setBaseUpdatedAt(serverUpdatedAt);
			setAvailableDraft(draft);
			setSaveState(draft ? "failed" : "saved");
			return;
		}

		if (serverMarkdown === latest.lastSavedMarkdown) {
			setBaseUpdatedAt(serverUpdatedAt);
		}
	}, [chapter?.id, courseId, note?.markdown, note?.updatedAt, saveSnapshot]);

	useEffect(() => {
		if (!chapter?.id || markdown === lastSavedMarkdown || availableDraft) {
			return;
		}

		setSaveState("unsaved");
		const timeoutId = window.setTimeout(() => {
			void saveSnapshot({
				chapterId: chapter.id,
				markdown,
				expectedUpdatedAt: baseUpdatedAt,
			});
		}, DEFAULT_NOTE_AUTOSAVE_DEBOUNCE_MS);

		return () => window.clearTimeout(timeoutId);
	}, [
		availableDraft,
		baseUpdatedAt,
		chapter?.id,
		lastSavedMarkdown,
		markdown,
		saveSnapshot,
	]);

	useEffect(() => {
		const flush = () => {
			const latest = latestRef.current;
			if (!latest.chapterId || latest.markdown === latest.lastSavedMarkdown) {
				return;
			}

			writeDraft({
				courseId,
				chapterId: latest.chapterId,
				markdown: latest.markdown,
				serverUpdatedAt: latest.baseUpdatedAt,
				savedAt: new Date().toISOString(),
			});
			void saveSnapshot({
				chapterId: latest.chapterId,
				markdown: latest.markdown,
				expectedUpdatedAt: latest.baseUpdatedAt,
			});
		};

		window.addEventListener("beforeunload", flush);

		return () => {
			window.removeEventListener("beforeunload", flush);
			flush();
		};
	}, [courseId, saveSnapshot]);

	const restoreDraft = () => {
		if (!availableDraft) {
			return;
		}

		setMarkdown(availableDraft.markdown);
		setSaveState("unsaved");
		setAvailableDraft(null);
	};

	const keepServerNote = () => {
		if (chapter?.id) {
			removeDraft(courseId, chapter.id);
		}
		setAvailableDraft(null);
		setSaveState("saved");
	};

	const copyMarkdown = async () => {
		await copyText(markdown);
		trackAnalyticsEvent("note_markdown_copied", {
			markdown_length: markdown.length,
		});
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	};

	const updateMarkdown = (nextMarkdown: string) => {
		setMarkdown(nextMarkdown);

		if (!chapter?.id) {
			return;
		}

		if (nextMarkdown === lastSavedMarkdown) {
			removeDraft(courseId, chapter.id);
			return;
		}

		writeDraft({
			courseId,
			chapterId: chapter.id,
			markdown: nextMarkdown,
			serverUpdatedAt: baseUpdatedAt,
			savedAt: new Date().toISOString(),
		});
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="truncate font-medium text-sm">
						{chapter?.title ?? "No chapter selected"}
					</p>
					<p className="text-muted-foreground text-xs">
						Notes are saved to the selected chapter.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<StatusBadge tone={statusTone(saveState)}>
						{statusLabel(saveState)}
					</StatusBadge>
					<div className="flex rounded-md border border-border bg-background p-0.5">
						<Button
							type="button"
							size="xs"
							variant={mode === "write" ? "secondary" : "ghost"}
							onClick={() => setMode("write")}
						>
							Write
						</Button>
						<Button
							type="button"
							size="xs"
							variant={mode === "preview" ? "secondary" : "ghost"}
							onClick={() => {
								trackAnalyticsEvent("note_preview_opened", {
									markdown_length: markdown.length,
								});
								setMode("preview");
							}}
						>
							Preview
						</Button>
					</div>
					<Button
						type="button"
						size="xs"
						variant="outline"
						onClick={copyMarkdown}
					>
						{copied ? "Copied" : "Copy Markdown"}
					</Button>
				</div>
			</div>

			{availableDraft ? (
				<div className="rounded-md border border-[oklch(0.78_0.1_95)] bg-[oklch(0.98_0.025_95)] p-3">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div className="min-w-0">
							<p className="font-medium text-sm">Local draft available</p>
							<p className="mt-1 text-muted-foreground text-xs">
								A previous save did not finish. Restore it or keep the saved
								server note.
							</p>
						</div>
						<div className="flex shrink-0 flex-wrap gap-2">
							<Button type="button" size="xs" onClick={restoreDraft}>
								Restore draft
							</Button>
							<Button
								type="button"
								size="xs"
								variant="outline"
								onClick={keepServerNote}
							>
								Keep saved note
							</Button>
						</div>
					</div>
				</div>
			) : null}

			{mode === "write" ? (
				<Textarea
					value={markdown}
					disabled={!chapter}
					aria-label="Chapter notes"
					placeholder="Write Markdown notes for this chapter."
					className="ph-no-capture min-h-48 resize-y leading-6 lg:min-h-64"
					onChange={(event) => updateMarkdown(event.target.value)}
				/>
			) : (
				<MarkdownPreview markdown={markdown} />
			)}

			{saveState === "failed" || saveState === "conflict" ? (
				<div className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-destructive text-sm">
					<HugeIcon name="alertCircle" className="mt-0.5 size-4 shrink-0" />
					<p>
						{saveState === "conflict"
							? "This note changed elsewhere. Copy your draft before reloading."
							: "Autosave failed. Your latest text is stored locally for recovery."}
					</p>
				</div>
			) : null}
		</div>
	);
}

function MarkdownPreview({ markdown }: { markdown: string }) {
	const blocks = parseMarkdownBlocks(markdown);

	if (blocks.length === 0) {
		return (
			<div className="min-h-48 rounded-md border border-border bg-muted/30 p-4 text-muted-foreground text-sm lg:min-h-64">
				Nothing to preview yet.
			</div>
		);
	}

	return (
		<div className="min-h-48 space-y-3 rounded-md border border-border bg-muted/20 p-4 text-sm leading-6 lg:min-h-64">
			{blocks}
		</div>
	);
}

function parseMarkdownBlocks(markdown: string) {
	const lines = markdown.split(/\r?\n/);
	const blocks: ReactNode[] = [];
	let paragraph: string[] = [];
	let list: string[] = [];
	let code: string[] | null = null;

	const flushParagraph = () => {
		if (paragraph.length === 0) {
			return;
		}
		blocks.push(
			<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(" "))}</p>,
		);
		paragraph = [];
	};
	const flushList = () => {
		if (list.length === 0) {
			return;
		}
		const seenItems = new Map<string, number>();
		blocks.push(
			<ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
				{list.map((item) => {
					const count = seenItems.get(item) ?? 0;
					seenItems.set(item, count + 1);
					return <li key={`${item}-${count}`}>{renderInline(item)}</li>;
				})}
			</ul>,
		);
		list = [];
	};

	for (const line of lines) {
		if (line.trim().startsWith("```")) {
			if (code) {
				blocks.push(
					<pre
						key={`code-${blocks.length}`}
						className="overflow-auto rounded-md border border-border bg-background p-3 font-mono text-xs"
					>
						<code>{code.join("\n")}</code>
					</pre>,
				);
				code = null;
			} else {
				flushParagraph();
				flushList();
				code = [];
			}
			continue;
		}

		if (code) {
			code.push(line);
			continue;
		}

		if (line.trim() === "") {
			flushParagraph();
			flushList();
			continue;
		}

		const heading = /^(#{1,3})\s+(.+)$/.exec(line);
		if (heading) {
			flushParagraph();
			flushList();
			const level = heading[1].length;
			const text = heading[2];
			if (level === 1) {
				blocks.push(
					<h2 key={`h-${blocks.length}`} className="font-semibold text-lg">
						{renderInline(text)}
					</h2>,
				);
			} else if (level === 2) {
				blocks.push(
					<h3 key={`h-${blocks.length}`} className="font-semibold">
						{renderInline(text)}
					</h3>,
				);
			} else {
				blocks.push(
					<h4 key={`h-${blocks.length}`} className="font-semibold text-sm">
						{renderInline(text)}
					</h4>,
				);
			}
			continue;
		}

		const listItem = /^[-*]\s+(.+)$/.exec(line);
		if (listItem) {
			flushParagraph();
			list.push(listItem[1]);
			continue;
		}

		if (line.startsWith(">")) {
			flushParagraph();
			flushList();
			blocks.push(
				<blockquote
					key={`quote-${blocks.length}`}
					className="rounded-md border border-border bg-background px-3 py-2 text-muted-foreground"
				>
					{renderInline(line.replace(/^>\s?/, ""))}
				</blockquote>,
			);
			continue;
		}

		paragraph.push(line.trim());
	}

	flushParagraph();
	flushList();

	if (code) {
		blocks.push(
			<pre
				key={`code-${blocks.length}`}
				className="overflow-auto rounded-md border border-border bg-background p-3 font-mono text-xs"
			>
				<code>{code.join("\n")}</code>
			</pre>,
		);
	}

	return blocks;
}

function renderInline(text: string) {
	const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
	let cursor = 0;

	return parts.map((part) => {
		cursor += part.length;
		const key = `${cursor}-${part}`;

		if (part.startsWith("`") && part.endsWith("`")) {
			return (
				<code
					key={key}
					className="rounded bg-background px-1 py-0.5 font-mono text-xs"
				>
					{part.slice(1, -1)}
				</code>
			);
		}

		if (part.startsWith("**") && part.endsWith("**")) {
			return <strong key={key}>{part.slice(2, -2)}</strong>;
		}

		return part;
	});
}

function mergeNote(current: ChapterNoteDTO[], next: ChapterNoteDTO) {
	const existingIndex = current.findIndex(
		(item) => item.chapterId === next.chapterId,
	);

	if (existingIndex === -1) {
		return [...current, next];
	}

	return current.map((item, index) => (index === existingIndex ? next : item));
}

function statusTone(saveState: SaveState) {
	if (saveState === "saved") {
		return "success";
	}
	if (saveState === "saving" || saveState === "unsaved") {
		return "warning";
	}
	return "danger";
}

function statusLabel(saveState: SaveState) {
	switch (saveState) {
		case "saved":
			return "Saved";
		case "saving":
			return "Saving";
		case "unsaved":
			return "Unsaved";
		case "conflict":
			return "Conflict";
		case "failed":
			return "Local draft";
	}
}

function getDraft(
	courseId: string,
	chapterId: string,
	serverUpdatedAt: string | null,
) {
	const draft = readDrafts()[draftId(courseId, chapterId)];
	if (!draft || draft.markdown.trim() === "") {
		return null;
	}

	if (!isDraftNewer(draft, serverUpdatedAt)) {
		removeDraft(courseId, chapterId);
		return null;
	}

	return draft;
}

function writeDraft(draft: NoteDraft) {
	if (typeof window === "undefined") {
		return;
	}

	const drafts = readDrafts();
	drafts[draftId(draft.courseId, draft.chapterId)] = draft;
	window.localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
}

function removeDraft(courseId: string, chapterId: string) {
	if (typeof window === "undefined") {
		return;
	}

	const drafts = readDrafts();
	delete drafts[draftId(courseId, chapterId)];
	window.localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
}

function readDrafts(): Record<string, NoteDraft> {
	if (typeof window === "undefined") {
		return {};
	}

	try {
		const raw = window.localStorage.getItem(draftStorageKey);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function isDraftNewer(draft: NoteDraft, serverUpdatedAt: string | null) {
	if (!serverUpdatedAt || draft.serverUpdatedAt !== serverUpdatedAt) {
		return true;
	}

	return (
		new Date(draft.savedAt).getTime() > new Date(serverUpdatedAt).getTime()
	);
}

function draftId(courseId: string, chapterId: string) {
	return `${courseId}:${chapterId}`;
}

async function copyText(text: string) {
	if (navigator.clipboard) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	document.body.appendChild(textarea);
	textarea.select();
	document.execCommand("copy");
	document.body.removeChild(textarea);
}

export { NotesEditor };
