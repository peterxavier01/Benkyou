import {
	formatTimestamp,
	MAX_BOOKMARK_NOTE_LENGTH,
	MAX_BOOKMARK_TITLE_LENGTH,
} from "@benkyou/core";
import type { BookmarkDTO, CourseChapterDTO } from "@benkyou/types";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
} from "@benkyou/ui";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

interface BookmarkDialogValues {
	title: string;
	note: string;
}

interface BookmarkDialogProps {
	bookmark?: BookmarkDTO | null;
	chapter: CourseChapterDTO | null;
	open: boolean;
	submitting: boolean;
	timestampSeconds: number;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: BookmarkDialogValues) => Promise<void>;
}

function BookmarkDialog({
	bookmark,
	chapter,
	open,
	submitting,
	timestampSeconds,
	onOpenChange,
	onSubmit,
}: BookmarkDialogProps) {
	const form = useForm({
		defaultValues: {
			title: bookmark?.title ?? "",
			note: bookmark?.note ?? "",
		} satisfies BookmarkDialogValues,
		validators: {
			onSubmit: ({ value }) => validateBookmark(value),
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});
	const mode = bookmark ? "edit" : "create";

	useEffect(() => {
		if (!open) {
			return;
		}

		form.reset({
			title: bookmark?.title ?? "",
			note: bookmark?.note ?? "",
		});
	}, [bookmark?.note, bookmark?.title, form, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{mode === "edit" ? "Edit bookmark" : "Add bookmark"}
					</DialogTitle>
					<DialogDescription>
						{formatTimestamp(timestampSeconds)}
						{chapter ? ` in ${chapter.title}` : " in this course"}
					</DialogDescription>
				</DialogHeader>

				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="title">
						{(field) => {
							const error = getFieldError(field.state.meta.errors);

							return (
								<div className="grid gap-2">
									<Label htmlFor="bookmark-title">Title</Label>
									<Input
										id="bookmark-title"
										name={field.name}
										value={field.state.value}
										placeholder="Optional title"
										className="ph-no-capture"
										aria-invalid={Boolean(error)}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									{error ? (
										<p className="text-destructive text-xs">{error}</p>
									) : null}
								</div>
							);
						}}
					</form.Field>

					<form.Field name="note">
						{(field) => {
							const error = getFieldError(field.state.meta.errors);

							return (
								<div className="grid gap-2">
									<Label htmlFor="bookmark-note">Note</Label>
									<Textarea
										id="bookmark-note"
										name={field.name}
										value={field.state.value}
										placeholder="Optional note"
										className="ph-no-capture min-h-24"
										aria-invalid={Boolean(error)}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									{error ? (
										<p className="text-destructive text-xs">{error}</p>
									) : null}
								</div>
							);
						}}
					</form.Field>

					<DialogFooter className="mt-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									disabled={state.isSubmitting || submitting}
								>
									{submitting
										? "Saving..."
										: mode === "edit"
											? "Save bookmark"
											: "Add bookmark"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function validateBookmark(value: BookmarkDialogValues) {
	const fields: Partial<Record<keyof BookmarkDialogValues, string>> = {};

	if (value.title.length > MAX_BOOKMARK_TITLE_LENGTH) {
		fields.title = "Title is too long.";
	}
	if (value.note.length > MAX_BOOKMARK_NOTE_LENGTH) {
		fields.note = "Note is too long.";
	}

	return Object.keys(fields).length > 0 ? { fields } : undefined;
}

function getFieldError(errors: unknown[]) {
	const [firstError] = errors;

	if (!firstError) {
		return undefined;
	}

	if (typeof firstError === "string") {
		return firstError;
	}

	if (
		typeof firstError === "object" &&
		firstError !== null &&
		"message" in firstError &&
		typeof firstError.message === "string"
	) {
		return firstError.message;
	}

	return "Check this field.";
}

export { BookmarkDialog, type BookmarkDialogValues };
