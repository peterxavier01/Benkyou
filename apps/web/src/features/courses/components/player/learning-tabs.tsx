import { formatTimestamp } from "@benkyou/core";
import type {
	BookmarkDTO,
	CourseChapterDTO,
	CoursePlayerDataDTO,
} from "@benkyou/types";
import {
	BookmarkItem,
	Button,
	ContentPanel,
	HugeIcon,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	TimestampChip,
} from "@benkyou/ui";
import { NotesEditor } from "../notes-editor";

function LearningTabs({
	courseId,
	chapter,
	note,
	bookmarks,
	deletingBookmark,
	onAddBookmark,
	onDeleteBookmark,
	onEditBookmark,
	onJumpToBookmark,
}: {
	courseId: string;
	chapter: CourseChapterDTO | null;
	note: CoursePlayerDataDTO["notes"][number] | undefined;
	bookmarks: BookmarkDTO[];
	deletingBookmark: boolean;
	onAddBookmark: () => void;
	onDeleteBookmark: (bookmark: BookmarkDTO) => void;
	onEditBookmark: (bookmark: BookmarkDTO) => void;
	onJumpToBookmark: (bookmark: BookmarkDTO) => void;
}) {
	return (
		<ContentPanel className="min-w-0 overflow-hidden p-0">
			<Tabs
				key={chapter?.id ?? "no-chapter"}
				defaultValue={chapter?.summary ? "summary" : "notes"}
				className="flex-col gap-0"
			>
				<TabsList
					variant="line"
					className="h-11 w-full justify-start rounded-none border-border border-b px-2 lg:h-10"
				>
					<TabsTrigger value="summary" className="h-11 px-3 text-sm lg:h-10">
						Summary
					</TabsTrigger>
					<TabsTrigger value="notes" className="h-11 px-3 text-sm lg:h-10">
						Notes
					</TabsTrigger>
					<TabsTrigger value="bookmarks" className="h-11 px-3 text-sm lg:h-10">
						Bookmarks
						{bookmarks.length > 0 ? (
							<span className="text-muted-foreground text-xs tabular-nums">
								{bookmarks.length}
							</span>
						) : null}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="summary" className="px-5 py-4 sm:px-6">
					{chapter?.summary ? (
						<p className="max-w-prose font-serif text-prose">
							{chapter.summary}
						</p>
					) : (
						<p className="text-muted-foreground text-sm">
							This chapter has no summary. Use Notes to write down what matters.
						</p>
					)}
				</TabsContent>
				<TabsContent value="notes" className="p-4">
					<NotesEditor courseId={courseId} chapter={chapter} note={note} />
				</TabsContent>
				<TabsContent value="bookmarks" className="p-2">
					{bookmarks.length === 0 ? (
						<div className="flex flex-col items-start gap-3 p-3">
							<p className="text-muted-foreground text-sm">
								No bookmarks in this chapter yet. Bookmark a moment to come back
								to it later.
							</p>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={onAddBookmark}
							>
								<HugeIcon name="bookmark" className="size-4" />
								Bookmark this moment
							</Button>
						</div>
					) : (
						<ul className="grid gap-1">
							{bookmarks.map((bookmark) => {
								const time = formatTimestamp(bookmark.timestampSeconds);
								return (
									<li key={bookmark.id}>
										<BookmarkItem
											className="hover:bg-muted/50"
											time={time}
											label={bookmark.title ?? `Bookmark at ${time}`}
											note={bookmark.note}
											actions={
												<div className="flex items-center gap-0.5">
													<TimestampChip
														time={time}
														className="mr-1 hidden sm:inline-flex"
														onClick={() => onJumpToBookmark(bookmark)}
													/>
													<Button
														type="button"
														size="icon"
														variant="ghost"
														className="size-11 sm:hidden"
														onClick={() => onJumpToBookmark(bookmark)}
													>
														<HugeIcon name="play" className="size-4" />
														<span className="sr-only">Jump to {time}</span>
													</Button>
													<Button
														type="button"
														size="icon"
														variant="ghost"
														className="size-11 sm:size-8"
														onClick={() => onEditBookmark(bookmark)}
													>
														<HugeIcon name="edit" className="size-4" />
														<span className="sr-only">Edit bookmark</span>
													</Button>
													<Button
														type="button"
														size="icon"
														variant="ghost"
														className="size-11 sm:size-8"
														disabled={deletingBookmark}
														onClick={() => onDeleteBookmark(bookmark)}
													>
														<HugeIcon name="delete" className="size-4" />
														<span className="sr-only">Delete bookmark</span>
													</Button>
												</div>
											}
										/>
									</li>
								);
							})}
						</ul>
					)}
				</TabsContent>
			</Tabs>
		</ContentPanel>
	);
}

export { LearningTabs };
