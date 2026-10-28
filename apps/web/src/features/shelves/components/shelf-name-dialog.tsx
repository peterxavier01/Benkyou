import { createShelfRequestV1Schema } from "@benkyou/core";
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
} from "@benkyou/ui";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";

type ShelfNameDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "rename";
	initialName?: string;
	onSubmit: (name: string) => Promise<unknown>;
};

/** Name a new shelf, or rename one. */
function ShelfNameDialog({
	open,
	onOpenChange,
	mode,
	initialName = "",
	onSubmit,
}: ShelfNameDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-serif text-xl">
						{mode === "create" ? "New shelf" : "Rename shelf"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Group notebooks that belong together, like a course split across several videos."
							: "Choose a new name for this shelf."}
					</DialogDescription>
				</DialogHeader>
				{open ? (
					<ShelfNameForm
						mode={mode}
						initialName={initialName}
						onCancel={() => onOpenChange(false)}
						onSubmit={async (name) => {
							await onSubmit(name);
							onOpenChange(false);
						}}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

function ShelfNameForm({
	mode,
	initialName,
	onCancel,
	onSubmit,
}: {
	mode: "create" | "rename";
	initialName: string;
	onCancel: () => void;
	onSubmit: (name: string) => Promise<void>;
}) {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const form = useForm({
		defaultValues: { name: initialName },
		validators: {
			onSubmit: ({ value }) => {
				const parsed = createShelfRequestV1Schema.safeParse(value);
				return parsed.success
					? undefined
					: { fields: { name: parsed.error.issues[0]?.message } };
			},
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			try {
				await onSubmit(value.name.trim());
			} catch (error) {
				setSubmitError(
					error instanceof Error ? error.message : "Couldn’t save the shelf.",
				);
			}
		},
	});

	return (
		<form
			className="grid gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="name">
				{(field) => {
					const error =
						typeof field.state.meta.errors[0] === "string"
							? field.state.meta.errors[0]
							: undefined;
					return (
						<div className="grid gap-2">
							<Label htmlFor="shelf-name">Name</Label>
							<Input
								id="shelf-name"
								autoFocus
								autoComplete="off"
								placeholder="Backend fundamentals"
								value={field.state.value}
								aria-invalid={Boolean(error)}
								aria-describedby={error ? "shelf-name-error" : undefined}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
							{error ? (
								<p id="shelf-name-error" className="text-destructive text-sm">
									{error}
								</p>
							) : null}
						</div>
					);
				}}
			</form.Field>
			{submitError ? (
				<p role="alert" className="text-destructive text-sm">
					{submitError}
				</p>
			) : null}
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(submitting) => (
						<Button type="submit" disabled={submitting}>
							{submitting
								? "Saving…"
								: mode === "create"
									? "Create shelf"
									: "Save name"}
						</Button>
					)}
				</form.Subscribe>
			</DialogFooter>
		</form>
	);
}

export { ShelfNameDialog };
