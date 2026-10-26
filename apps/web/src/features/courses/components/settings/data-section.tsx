import type { CourseLibraryItemDTO } from "@benkyou/types";
import {
	Button,
	HugeIcon,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@benkyou/ui";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@benkyou/ui/components/alert-dialog";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { SettingsGroup, SettingsRow } from "./settings-parts";
import type { SettingsUser } from "./settings-types";

function DataSection({
	currentUser,
	notebooks,
	exportPending,
	exportError,
	onExport,
	onResetBrowserData,
}: {
	currentUser: SettingsUser;
	notebooks: CourseLibraryItemDTO[];
	exportPending: boolean;
	exportError: string | null;
	onExport: (courseId: string) => void;
	onResetBrowserData: () => void;
}) {
	const [exportId, setExportId] = useState(() => notebooks[0]?.course.id ?? "");
	const [resetDone, setResetDone] = useState(false);
	const count = notebooks.length;
	const countLabel = `${count} ${count === 1 ? "notebook" : "notebooks"}`;

	return (
		<>
			<SettingsGroup title="Where your data lives">
				{currentUser ? (
					<SettingsRow
						label={
							<span className="flex items-center gap-2">
								<HugeIcon name="account" className="size-4" />
								In your account
							</span>
						}
						description={`${countLabel}, with their notes, bookmarks and progress, are saved to your account. Only you can see them.`}
					/>
				) : (
					<SettingsRow
						label={
							<span className="flex items-center gap-2">
								<HugeIcon name="info" className="size-4" />
								Saved in this browser
							</span>
						}
						description="Notebooks you make without an account are private to this browser. Sign in or create an account to keep them on any device; they move over automatically."
						control={
							<Button asChild>
								<Link to="/sign-in" search={{ redirect: "/settings" }}>
									Sign in
								</Link>
							</Button>
						}
					/>
				)}
			</SettingsGroup>

			<SettingsGroup
				title="Export"
				description="Download a notebook as one Markdown file with its video link, chapters, notes and bookmarks."
			>
				<SettingsRow
					stack
					label="Notebook"
					labelId="export-notebook-label"
					description={
						count === 0
							? "Create a notebook or open the sample before exporting."
							: undefined
					}
					control={
						<div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
							<Select
								value={exportId}
								onValueChange={setExportId}
								disabled={count === 0}
							>
								<SelectTrigger
									aria-labelledby="export-notebook-label"
									className="w-full min-w-0 **:data-[slot=select-value]:min-w-0 **:data-[slot=select-value]:truncate"
								>
									<SelectValue placeholder="Choose a notebook" />
								</SelectTrigger>
								<SelectContent className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]">
									{notebooks.map((item) => (
										<SelectItem key={item.course.id} value={item.course.id}>
											<span className="block truncate">
												{item.course.title}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								variant="outline"
								disabled={!exportId || exportPending}
								onClick={() => onExport(exportId)}
							>
								<HugeIcon name="download" className="size-4" />
								{exportPending ? "Exporting…" : "Export"}
							</Button>
						</div>
					}
				/>
				{exportError ? (
					<p
						role="alert"
						className="flex gap-2 p-4 text-destructive text-sm sm:px-5"
					>
						<HugeIcon name="alertCircle" className="mt-0.5 size-4 shrink-0" />
						{exportError}
					</p>
				) : null}
			</SettingsGroup>

			<SettingsGroup title="This browser">
				<SettingsRow
					label="Clear data saved in this browser"
					description={
						resetDone
							? "Cleared. Your notebooks weren’t affected."
							: "Removes your preferences cached here, unsaved note drafts and dismissed hints. Notebooks, saved notes and bookmarks aren’t affected."
					}
					control={
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button type="button" variant="outline">
									Clear browser data
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Clear browser data?</AlertDialogTitle>
									<AlertDialogDescription>
										This removes from this browser:
									</AlertDialogDescription>
								</AlertDialogHeader>
								<ul className="grid list-disc gap-1 pl-5 text-sm">
									<li>Note drafts that haven’t been saved yet</li>
									<li>Learning preferences cached on this device</li>
									<li>Hints you’ve already dismissed</li>
								</ul>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										onClick={() => {
											onResetBrowserData();
											setResetDone(true);
										}}
									>
										Clear browser data
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					}
				/>
			</SettingsGroup>

			<SettingsGroup title="Self-hosting">
				<SettingsRow
					label="Run your own Benkyou"
					description="Keep every notebook in your own database."
					control={
						<Button asChild variant="outline">
							<Link to="/self-hosting">Open guide</Link>
						</Button>
					}
				/>
			</SettingsGroup>
		</>
	);
}

export { DataSection };
