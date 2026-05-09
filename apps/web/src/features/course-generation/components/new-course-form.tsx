import { getParseVideoUrlErrorMessage, parseVideoUrl } from "@benkyou/core";
import { Button, HugeIcon, Input, Label } from "@benkyou/ui";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@benkyou/ui/components/alert";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
	createCourseFromUrl,
	openSampleCourse,
} from "../course-generation.functions";

interface NewCourseFormValues {
	url: string;
}

const defaultValues = {
	url: "",
} satisfies NewCourseFormValues;

function NewCourseForm() {
	const navigate = useNavigate();
	const createCourse = useServerFn(createCourseFromUrl);
	const openSample = useServerFn(openSampleCourse);
	const [formError, setFormError] = useState<string | null>(null);
	const [openingSample, setOpeningSample] = useState(false);

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: ({ value }) => validateVideoUrl(value.url),
		},
		onSubmit: async ({ value }) => {
			setFormError(null);

			try {
				const result = await createCourse({ data: { url: value.url } });
				await navigate({ href: `/courses/new/${result.generationJobId}` });
			} catch (error) {
				setFormError(toErrorMessage(error));
			}
		},
	});

	return (
		<div className="mt-7 max-w-2xl">
			{formError ? (
				<Alert variant="destructive" className="mb-3">
					<AlertTitle>Could not create course</AlertTitle>
					<AlertDescription>{formError}</AlertDescription>
				</Alert>
			) : null}

			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<div className="mb-2 flex items-center justify-between gap-3">
					<Label htmlFor="course-url">Video URL</Label>
					<span className="text-muted-foreground text-xs">
						Paste a public YouTube link
					</span>
				</div>
				<form.Field name="url">
					{(field) => {
						const error = getFieldError(field.state.meta.errors);

						return (
							<>
								<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/35 p-2 sm:flex-row">
									<Input
										id="course-url"
										name={field.name}
										type="url"
										placeholder="https://youtube.com/watch?v=..."
										className="h-10 flex-1"
										value={field.state.value}
										aria-invalid={Boolean(error)}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<form.Subscribe selector={(state) => state.isSubmitting}>
										{(isSubmitting: boolean) => (
											<Button
												type="submit"
												size="lg"
												className="sm:w-auto"
												disabled={isSubmitting}
											>
												{isSubmitting ? "Generating..." : "Generate course"}
												<HugeIcon name="arrowRight" className="size-4" />
											</Button>
										)}
									</form.Subscribe>
								</div>
								{error ? (
									<p className="mt-2 text-destructive text-sm">{error}</p>
								) : null}
							</>
						);
					}}
				</form.Field>
			</form>

			<div className="mt-4">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 justify-start px-4 text-primary hover:bg-transparent hover:text-primary/80"
					disabled={openingSample}
					onClick={async () => {
						setFormError(null);
						setOpeningSample(true);

						try {
							const result = await openSample();
							await navigate({ href: `/courses/${result.courseId}` });
						} catch (error) {
							setFormError(toErrorMessage(error));
						} finally {
							setOpeningSample(false);
						}
					}}
				>
					<HugeIcon name="playCircle" className="size-4" />
					{openingSample ? "Opening sample..." : "Try sample course"}
				</Button>
			</div>
		</div>
	);
}

function validateVideoUrl(url: string) {
	const parsed = parseVideoUrl(url);

	if (parsed.ok) {
		return undefined;
	}

	return {
		fields: {
			url: getParseVideoUrlErrorMessage(parsed.error),
		},
	};
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

function toErrorMessage(error: unknown) {
	return error instanceof Error
		? error.message
		: "Something went wrong. Try again.";
}

export { NewCourseForm };
