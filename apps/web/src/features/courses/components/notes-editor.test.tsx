import type { ChapterNoteDTO, CourseChapterDTO } from "@benkyou/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { NotesEditor } from "./notes-editor";

const { saveNoteMock } = vi.hoisted(() => ({
	saveNoteMock: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
	useServerFn: () => saveNoteMock,
}));

vi.mock("#/integrations/posthog/analytics", () => ({
	trackAnalyticsEvent: vi.fn(),
}));

vi.mock("../course-workspace.functions", () => ({
	upsertChapterNote: vi.fn(),
}));

const chapter: CourseChapterDTO = {
	id: "chapter-1",
	courseId: "course-1",
	title: "Chapter 1",
	summary: null,
	orderIndex: 0,
	startSeconds: 0,
	endSeconds: null,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

function note(markdown: string, updatedAt: string): ChapterNoteDTO {
	return {
		id: "note-1",
		userId: null,
		chapterId: chapter.id,
		markdown,
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt,
	};
}

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});

	return { promise, resolve, reject };
}

function renderEditor(
	editorNote?: ChapterNoteDTO,
	playback: {
		getCurrentSeconds?: () => number;
		onSeekTimestamp?: (seconds: number) => void;
	} = {},
) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const Wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	const view = render(
		<NotesEditor
			courseId="course-1"
			chapter={chapter}
			note={editorNote}
			{...playback}
		/>,
		{ wrapper: Wrapper },
	);

	return {
		...view,
		rerenderWithNote: (nextNote?: ChapterNoteDTO) =>
			view.rerender(
				<NotesEditor courseId="course-1" chapter={chapter} note={nextNote} />,
			),
	};
}

describe("NotesEditor", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		window.localStorage.clear();
		saveNoteMock.mockReset();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
		window.localStorage.clear();
	});

	test("keeps newer local text visible when an older autosave finishes", async () => {
		const firstSave = createDeferred<{ note: ChapterNoteDTO }>();
		const secondSave = createDeferred<{ note: ChapterNoteDTO }>();
		saveNoteMock
			.mockReturnValueOnce(firstSave.promise)
			.mockReturnValueOnce(secondSave.promise);
		const { rerenderWithNote } = renderEditor();
		const textarea = screen.getByLabelText("Chapter notes");

		fireEvent.change(textarea, { target: { value: "A" } });
		await act(async () => {
			vi.advanceTimersByTime(800);
		});
		expect(saveNoteMock).toHaveBeenCalledTimes(1);

		fireEvent.change(textarea, { target: { value: "AB" } });
		await act(async () => {
			vi.advanceTimersByTime(800);
		});
		expect(saveNoteMock).toHaveBeenCalledTimes(1);

		const savedA = note("A", "2026-01-01T00:01:00.000Z");
		await act(async () => {
			firstSave.resolve({ note: savedA });
		});
		rerenderWithNote(savedA);

		expect((textarea as HTMLTextAreaElement).value).toBe("AB");
		expect(screen.queryByText("Saved")).toBeNull();
		expect(saveNoteMock).toHaveBeenCalledTimes(2);
		expect(saveNoteMock).toHaveBeenLastCalledWith({
			data: {
				chapterId: chapter.id,
				markdown: "AB",
				expectedUpdatedAt: savedA.updatedAt,
			},
		});

		await act(async () => {
			secondSave.resolve({
				note: note("AB", "2026-01-01T00:02:00.000Z"),
			});
		});

		expect((textarea as HTMLTextAreaElement).value).toBe("AB");
	});

	test("inserts the current video time at the cursor", () => {
		renderEditor(undefined, { getCurrentSeconds: () => 1821.6 });
		const textarea = screen.getByLabelText(
			"Chapter notes",
		) as HTMLTextAreaElement;

		fireEvent.change(textarea, { target: { value: "Migrations run" } });
		textarea.setSelectionRange(10, 10);
		fireEvent.click(screen.getByRole("button", { name: "Insert timestamp" }));

		expect(textarea.value).toBe("Migrations [30:21] run");
	});

	test("renders timestamps and highlights in the preview", () => {
		const onSeekTimestamp = vi.fn();
		const { container } = renderEditor(
			note(
				"Named by timestamp [30:21]. ==Never edit one that has shipped.==",
				"2026-01-01T00:01:00.000Z",
			),
			{ onSeekTimestamp },
		);

		fireEvent.click(screen.getByRole("button", { name: "Preview" }));
		fireEvent.click(screen.getByRole("button", { name: "Jump to 30:21" }));

		expect(onSeekTimestamp).toHaveBeenCalledWith(1821);
		expect(container.querySelector("mark")?.textContent).toBe(
			"Never edit one that has shipped.",
		);
	});

	test("keeps raw HTML in notes as text", () => {
		const { container } = renderEditor(
			note("<img src=x onerror=alert(1)>", "2026-01-01T00:01:00.000Z"),
		);

		fireEvent.click(screen.getByRole("button", { name: "Preview" }));

		expect(container.querySelector("img")).toBeNull();
		expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeTruthy();
	});
});
