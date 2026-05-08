import type { BookmarkDTO, ChapterNoteDTO, CourseChapterDTO, CourseDTO } from "@benkyou/types";

export interface CourseMarkdownExportInput {
	course: Pick<CourseDTO, "title" | "description">;
	chapters: Array<Pick<CourseChapterDTO, "id" | "title" | "summary" | "startSeconds">>;
	notes: Array<Pick<ChapterNoteDTO, "chapterId" | "markdown">>;
	bookmarks: Array<Pick<BookmarkDTO, "chapterId" | "timestampSeconds" | "title" | "note">>;
}

export function formatCourseMarkdownExport(input: CourseMarkdownExportInput) {
	const notesByChapter = new Map(input.notes.map((note) => [note.chapterId, note.markdown]));
	const bookmarksByChapter = new Map<string, CourseMarkdownExportInput["bookmarks"]>();

	for (const bookmark of input.bookmarks) {
		if (!bookmark.chapterId) {
			continue;
		}

		const chapterBookmarks = bookmarksByChapter.get(bookmark.chapterId) ?? [];
		chapterBookmarks.push(bookmark);
		bookmarksByChapter.set(bookmark.chapterId, chapterBookmarks);
	}

	const lines = [`# ${input.course.title}`, ""];

	if (input.course.description) {
		lines.push(input.course.description, "");
	}

	for (const chapter of input.chapters) {
		lines.push(`## ${chapter.title}`, "");

		if (chapter.summary) {
			lines.push(chapter.summary, "");
		}

		const note = notesByChapter.get(chapter.id);

		if (note) {
			lines.push("### Notes", "", note, "");
		}

		const bookmarks = bookmarksByChapter.get(chapter.id) ?? [];

		if (bookmarks.length > 0) {
			lines.push("### Bookmarks", "");

			for (const bookmark of bookmarks) {
				const title = bookmark.title ?? `Bookmark at ${formatTimestamp(bookmark.timestampSeconds)}`;
				lines.push(`- ${formatTimestamp(bookmark.timestampSeconds)} - ${title}`);

				if (bookmark.note) {
					lines.push(`  ${bookmark.note}`);
				}
			}

			lines.push("");
		}
	}

	return `${lines.join("\n").trim()}\n`;
}

export function formatTimestamp(totalSeconds: number) {
	const safeSeconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(safeSeconds / 3600);
	const minutes = Math.floor((safeSeconds % 3600) / 60);
	const seconds = safeSeconds % 60;
	const minuteText = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
	const secondText = String(seconds).padStart(2, "0");

	return hours > 0 ? `${hours}:${minuteText}:${secondText}` : `${minuteText}:${secondText}`;
}
