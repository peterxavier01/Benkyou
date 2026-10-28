import { getParseVideoUrlErrorMessage, parseVideoUrl } from "@benkyou/core";
import { Button, cn, HugeIcon, Input, Label } from "@benkyou/ui";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@benkyou/ui/components/alert";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";

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

type NewCourseFormProps = {
	/** Unique per page, so two forms can share a page. */
	id?: string;
	/** Show the sample-notebook link and the no-account note under the form. */
	showHelp?: boolean;
	className?: string;
};

function NewCourseForm({
	id = "course-url",
	showHelp = false,
	className,
}: NewCourseFormProps) {
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
			const parsedUrl = parseVideoUrl(value.url);

			trackAnalyticsEvent("course_create_submitted", {
				provider: parsedUrl.ok ? parsedUrl.value.provider : "unknown",
			});

			try {
				const result = await createCourse({ data: { url: value.url } });
				trackAnalyticsEvent("course_create_succeeded", {
					has_generation_job: Boolean(result.generationJobId),
					reused_existing_course: result.reusedExistingCourse,
				});
				if (result.reusedExistingCourse || result.generationJobId === null) {
					await navigate({ href: `/notebooks/${result.courseId}` });
					return;
				}

				trackAnalyticsEvent("generation_job_started", {
					source: "course_create",
				});
				await navigate({ href: `/notebooks/new/${result.generationJobId}` });
			} catch (error) {
				trackAnalyticsEvent("course_create_failed", {
					reason: error instanceof Error ? "server_error" : "unknown",
				});
				setFormError(toErrorMessage(error));
			}
		},
	});

	async function handleOpenSample() {
		setFormError(null);
		setOpeningSample(true);

		try {
			const result = await openSample();
			trackAnalyticsEvent("sample_course_opened");
			setOpeningSample(false);
			await navigate({ href: `/notebooks/${result.courseId}` });
		} catch (error) {
			setFormError(toErrorMessage(error));
			setOpeningSample(false);
		}
	}

	return (
		<div className={cn("grid w-full max-w-[560px] gap-3", className)}>
			{formError ? (
				<Alert variant="destructive">
					<HugeIcon name="alertCircle" />
					<AlertTitle>Couldn’t create a notebook</AlertTitle>
					<AlertDescription>{formError}</AlertDescription>
				</Alert>
			) : null}

			<form
				className="grid gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<Label htmlFor={id} className="font-medium text-[13px]">
					YouTube link
				</Label>
				<form.Field name="url">
					{(field) => {
						const error = getFieldError(field.state.meta.errors);
						const errorId = `${id}-error`;

						return (
							<>
								<div className="flex flex-col gap-2 sm:flex-row">
									<Input
										id={id}
										name={field.name}
										type="url"
										inputMode="url"
										placeholder="https://youtube.com/watch?v=…"
										className="ph-no-capture h-12 flex-1 bg-card px-3.5 text-[15px]"
										value={field.state.value}
										aria-invalid={Boolean(error)}
										aria-describedby={error ? errorId : undefined}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<form.Subscribe>
										{(state) => (
											<Button
												type="submit"
												className="h-12 px-5 text-[15px]"
												disabled={state.isSubmitting}
											>
												{state.isSubmitting ? "Creating…" : "Create notebook"}
												<HugeIcon name="arrowRight" className="size-4" />
											</Button>
										)}
									</form.Subscribe>
								</div>
								{error ? (
									<p id={errorId} className="text-destructive text-sm">
										{error}
									</p>
								) : null}
							</>
						);
					}}
				</form.Field>
			</form>

			{showHelp ? (
				<div className="grid gap-1.5 text-muted-foreground text-sm">
					<p>
						No link handy?{" "}
						<button
							type="button"
							className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline disabled:cursor-default disabled:opacity-70"
							disabled={openingSample}
							onClick={handleOpenSample}
						>
							{openingSample ? "Opening the sample…" : "Open a sample notebook"}
						</button>
					</p>
					<p>No account needed to start.</p>
				</div>
			) : null}
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
