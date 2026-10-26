import {
	DEFAULT_NOTE_AUTOSAVE_DEBOUNCE_MS,
	formatNoteTimestamp,
	insertIntoText,
	LOCAL_STORAGE_KEYS,
	parseNoteMarkdown,
} from "@benkyou/core";
import type {
	ChapterNoteDTO,
	CourseChapterDTO,
	CoursePlayerDataDTO,
} from "@benkyou/types";
import {
	Button,
	HugeIcon,
	NoteMarkdown,
	StatusBadge,
	Textarea,
} from "@benkyou/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";
import { upsertChapterNote } from "../course-workspace.functions";

type SaveState = "saved" | "saving" | "unsaved" | "failed" | "conflict";
type CopyState = "idle" | "copied" | "failed";

interface NotesEditorProps {
	courseId: string;
	chapter: CourseChapterDTO | null;
	note: ChapterNoteDTO | undefined;
	/** Current video time, used by "Insert timestamp". Omit to hide the button. */
	getCurrentSeconds?: () => number;
	/** Called when a `[12:34]` timestamp in the preview is clicked. */
	onSeekTimestamp?: (seconds: number) => void;
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

function NotesEditor({
	courseId,
	chapter,
	note,
	getCurrentSeconds,
	onSeekTimestamp,
}: NotesEditorProps) {
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
	const [copyState, setCopyState] = useState<CopyState>("idle");
	const latestRef = useRef({
		chapterId: chapter?.id ?? null,
		markdown,
		lastSavedMarkdown,
		baseUpdatedAt,
	});
	const previousChapterIdRef = useRef(chapter?.id ?? null);
	const inFlightRef = useRef(false);
	const queuedSaveRef = useRef<SaveSnapshot | null>(null);
	const copyResetTimeoutRef = useRef<number | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const copyDisabled = markdown.trim().length === 0;

	useEffect(
		() => () => {
			if (copyResetTimeoutRef.current !== null) {
				window.clearTimeout(copyResetTimeoutRef.current);
			}
		},
		[],
	);

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
		if (copyDisabled) {
			return;
		}

		if (copyResetTimeoutRef.current !== null) {
			window.clearTimeout(copyResetTimeoutRef.current);
		}

		try {
			await copyText(markdown);
			trackAnalyticsEvent("note_markdown_copied", {
				markdown_length: markdown.length,
			});
			setCopyState("copied");
		} catch {
			setCopyState("failed");
		}

		copyResetTimeoutRef.current = window.setTimeout(() => {
			setCopyState("idle");
			copyResetTimeoutRef.current = null;
		}, 2500);
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

	const seekFromNote = useCallback(
		(seconds: number) => {
			trackAnalyticsEvent("note_timestamp_jumped_to", {});
			onSeekTimestamp?.(seconds);
		},
		[onSeekTimestamp],
	);

	const insertTimestamp = () => {
		if (!chapter || !getCurrentSeconds) {
			return;
		}

		// In preview the textarea is unmounted, so the time goes at the end.
		const textarea = mode === "write" ? textareaRef.current : null;
		const next = insertIntoText(
			markdown,
			textarea?.selectionStart ?? markdown.length,
			textarea?.selectionEnd ?? markdown.length,
			formatNoteTimestamp(getCurrentSeconds()),
		);

		setMode("write");
		updateMarkdown(next.text);
		trackAnalyticsEvent("note_timestamp_inserted", {
			from_preview: mode === "preview",
		});
		window.requestAnimationFrame(() => {
			textareaRef.current?.focus();
			textareaRef.current?.setSelectionRange(next.caret, next.caret);
		});
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<div className="flex min-w-0 items-center gap-2">
						<p className="truncate font-medium text-sm">
							{chapter?.title ?? "No chapter selected"}
						</p>
						<StatusBadge tone={statusTone(saveState)}>
							{statusLabel(saveState)}
						</StatusBadge>
					</div>
					<p className="text-muted-foreground text-sm lg:text-xs">
						Notes are saved to the selected chapter.
					</p>
				</div>
				<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
					{getCurrentSeconds ? (
						<Button
							className="min-h-11 lg:min-h-6"
							disabled={!chapter}
							type="button"
							size="xs"
							variant="outline"
							onClick={insertTimestamp}
						>
							<HugeIcon name="clock" className="size-3.5" />
							Insert timestamp
						</Button>
					) : null}
					<fieldset className="flex rounded-md border border-border bg-background p-0.5">
						<legend className="sr-only">Note editor mode</legend>
						<Button
							aria-pressed={mode === "write"}
							className="min-h-11 lg:min-h-6"
							type="button"
							size="xs"
							variant={mode === "write" ? "secondary" : "ghost"}
							onClick={() => setMode("write")}
						>
							Write
						</Button>
						<Button
							aria-pressed={mode === "preview"}
							className="min-h-11 lg:min-h-6"
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
					</fieldset>
					<Button
						aria-describedby="copy-note-status"
						className="min-h-11 sm:w-32 lg:min-h-6"
						disabled={copyDisabled}
						type="button"
						size="xs"
						variant="outline"
						onClick={copyMarkdown}
					>
						{copyState === "copied"
							? "Copied"
							: copyState === "failed"
								? "Copy failed"
								: "Copy as Markdown"}
					</Button>
					<output aria-live="polite" className="sr-only" id="copy-note-status">
						{copyDisabled
							? "Write a note before copying."
							: copyState === "copied"
								? "Note copied as Markdown."
								: copyState === "failed"
									? "Could not copy the note. Try again."
									: ""}
					</output>
				</div>
			</div>

			{availableDraft ? (
				<div className="rounded-md border border-mark bg-mark-tint p-3">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div className="min-w-0">
							<p className="font-medium text-sm">Local draft available</p>
							<p className="mt-1 text-muted-foreground text-sm lg:text-xs">
								A previous save did not finish. Restore it or keep the saved
								server note.
							</p>
						</div>
						<div className="flex shrink-0 flex-wrap gap-2">
							<Button
								className="min-h-11 lg:min-h-6"
								type="button"
								size="xs"
								onClick={restoreDraft}
							>
								Restore draft
							</Button>
							<Button
								className="min-h-11 lg:min-h-6"
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
					ref={textareaRef}
					value={markdown}
					disabled={!chapter}
					aria-label="Chapter notes"
					placeholder="Write Markdown notes for this chapter. [12:34] links to a moment in the video, ==text== highlights."
					className="ph-no-capture min-h-48 resize-y leading-6 lg:min-h-64"
					onChange={(event) => updateMarkdown(event.target.value)}
				/>
			) : (
				<MarkdownPreview
					markdown={markdown}
					onSeekTimestamp={onSeekTimestamp ? seekFromNote : undefined}
				/>
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

function MarkdownPreview({
	markdown,
	onSeekTimestamp,
}: {
	markdown: string;
	onSeekTimestamp?: (seconds: number) => void;
}) {
	const document = useMemo(() => parseNoteMarkdown(markdown), [markdown]);

	if (document.children.length === 0) {
		return (
			<div className="min-h-48 rounded-md border border-border bg-muted/30 p-4 text-muted-foreground text-sm lg:min-h-64">
				Nothing to preview yet.
			</div>
		);
	}

	return (
		<NoteMarkdown
			document={document}
			onSeekTimestamp={onSeekTimestamp}
			className="min-h-48 max-w-prose rounded-md border border-border bg-card p-5 lg:min-h-64"
		/>
	);
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

	try {
		textarea.select();
		if (!document.execCommand("copy")) {
			throw new Error("Copy command was rejected.");
		}
	} finally {
		document.body.removeChild(textarea);
	}
}

export { NotesEditor };
