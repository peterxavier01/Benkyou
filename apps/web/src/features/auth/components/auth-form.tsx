import { authClient } from "@benkyou/auth/client";
import {
	type SignInInput,
	type SignUpInput,
	signInInputSchema,
	signUpInputSchema,
} from "@benkyou/auth/schemas";
import { Button, cn, HugeIcon, Input, Label } from "@benkyou/ui";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@benkyou/ui/components/alert";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { z } from "zod";
import { useResetSessionData } from "#/integrations/better-auth/use-reset-session-data";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";

type AuthMode = "sign-in" | "sign-up";
type AuthFormValues = SignUpInput;
type AuthFieldErrors = Partial<Record<keyof AuthFormValues, string>>;

type AuthFormProps = {
	redirectTo: string;
	initialMode?: AuthMode;
};

const PASSWORD_HINT = "At least 8 characters.";

const defaultValues = {
	name: "",
	email: "",
	password: "",
} satisfies AuthFormValues;

function AuthForm({ redirectTo, initialMode = "sign-in" }: AuthFormProps) {
	const navigate = useNavigate();
	const resetSessionData = useResetSessionData();
	const [mode, setMode] = useState<AuthMode>(initialMode);
	const [authError, setAuthError] = useState<string | null>(null);

	const copy =
		mode === "sign-in"
			? {
					title: "Welcome back",
					action: "Sign in",
					description: "Sign in to pick up your notebooks where you left them.",
					error: "Couldn’t sign you in",
					switchAction: "Create an account",
					switchPrompt: "New to Benkyou?",
				}
			: {
					title: "Create your account",
					action: "Create account",
					description:
						"Keep your notebooks in an account so they follow you to other devices.",
					error: "Couldn’t create your account",
					switchAction: "Sign in",
					switchPrompt: "Already have an account?",
				};

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: ({ value }) => validateAuthValues(mode, value),
		},
		onSubmit: async ({ value }) => {
			setAuthError(null);

			const parsed =
				mode === "sign-in"
					? signInInputSchema.safeParse(value)
					: signUpInputSchema.safeParse(value);

			if (!parsed.success) {
				return;
			}

			const result =
				mode === "sign-in"
					? await authClient.signIn.email(parsed.data as SignInInput)
					: await authClient.signUp.email(parsed.data as SignUpInput);

			if (result.error) {
				trackAnalyticsEvent(
					mode === "sign-in" ? "sign_in_failed" : "sign_up_failed",
					{ reason: result.error.message ? "provider_error" : "unknown" },
				);
				setAuthError(
					result.error.message ||
						"Authentication failed. Check your details and try again.",
				);
				return;
			}

			trackAnalyticsEvent(
				mode === "sign-in" ? "sign_in_succeeded" : "sign_up_succeeded",
			);
			await resetSessionData();
			await navigate({ href: redirectTo || "/" });
		},
	});

	return (
		<div className="grid w-full gap-6">
			<div className="grid gap-2">
				<h1 className="font-semibold font-serif text-[32px] leading-tight tracking-[-0.02em]">
					{copy.title}
				</h1>
				<p className="text-muted-foreground">{copy.description}</p>
			</div>

			{authError ? (
				<Alert variant="destructive">
					<HugeIcon name="alertCircle" />
					<AlertTitle>{copy.error}</AlertTitle>
					<AlertDescription>{authError}</AlertDescription>
				</Alert>
			) : null}

			<form
				className="grid gap-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				{mode === "sign-up" ? (
					<form.Field name="name">
						{(field) => (
							<AuthTextField
								autoComplete="name"
								error={getFieldError(field.state.meta.errors)}
								fieldId={field.name}
								label="Name"
								name={field.name}
								onBlur={field.handleBlur}
								onChange={field.handleChange}
								value={field.state.value}
							/>
						)}
					</form.Field>
				) : null}

				<form.Field name="email">
					{(field) => (
						<AuthTextField
							autoComplete="email"
							error={getFieldError(field.state.meta.errors)}
							fieldId={field.name}
							label="Email"
							name={field.name}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							type="email"
							value={field.state.value}
						/>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<AuthTextField
							autoComplete={
								mode === "sign-in" ? "current-password" : "new-password"
							}
							error={getFieldError(field.state.meta.errors)}
							fieldId={field.name}
							hint={mode === "sign-up" ? PASSWORD_HINT : undefined}
							label="Password"
							name={field.name}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							type="password"
							value={field.state.value}
						/>
					)}
				</form.Field>

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="mt-1 h-11 w-full cursor-pointer text-[15px]"
							disabled={state.isSubmitting}
						>
							{state.isSubmitting
								? mode === "sign-in"
									? "Signing in…"
									: "Creating your account…"
								: copy.action}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="grid gap-3 border-border border-t pt-5 text-sm">
				<p className="text-muted-foreground">
					{copy.switchPrompt}{" "}
					<button
						type="button"
						className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline"
						onClick={() => {
							setAuthError(null);
							form.reset();
							trackAnalyticsEvent("auth_mode_changed", {
								mode: mode === "sign-in" ? "sign-up" : "sign-in",
							});
							setMode(mode === "sign-in" ? "sign-up" : "sign-in");
						}}
					>
						{copy.switchAction}
					</button>
				</p>
				<Link to="/" className="w-fit">
					Keep studying without an account
				</Link>
			</div>
		</div>
	);
}

function AuthTextField({
	autoComplete,
	error,
	fieldId,
	hint,
	label,
	name,
	onBlur,
	onChange,
	type = "text",
	value,
}: {
	autoComplete: string;
	error?: string;
	fieldId: string;
	hint?: string;
	label: string;
	name: string;
	onBlur: () => void;
	onChange: (value: string) => void;
	type?: "email" | "password" | "text";
	value: string;
}) {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const isPassword = type === "password";
	const inputType = isPassword && isPasswordVisible ? "text" : type;
	const hintId = hint ? `${fieldId}-hint` : undefined;
	const errorId = error ? `${fieldId}-error` : undefined;
	const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

	return (
		<div className="grid gap-2">
			<Label htmlFor={fieldId}>{label}</Label>
			<div className="relative">
				<Input
					id={fieldId}
					name={name}
					type={inputType}
					autoComplete={autoComplete}
					value={value}
					aria-invalid={Boolean(error)}
					aria-describedby={describedBy}
					className={cn(
						"ph-no-capture h-11 bg-card text-[15px]",
						isPassword && "pr-11",
					)}
					onBlur={onBlur}
					onChange={(event) => onChange(event.target.value)}
				/>
				{isPassword ? (
					<button
						type="button"
						aria-label={isPasswordVisible ? "Hide password" : "Show password"}
						aria-pressed={isPasswordVisible}
						className="-translate-y-1/2 absolute top-1/2 right-1 flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => setIsPasswordVisible((current) => !current)}
					>
						<HugeIcon
							name={isPasswordVisible ? "viewOff" : "view"}
							className="size-4"
						/>
					</button>
				) : null}
			</div>
			{hint ? (
				<p id={hintId} className="text-muted-foreground text-[13px]">
					{hint}
				</p>
			) : null}
			{error ? (
				<p id={errorId} className="text-destructive text-sm">
					{error}
				</p>
			) : null}
		</div>
	);
}

function validateAuthValues(mode: AuthMode, value: AuthFormValues) {
	const parsed =
		mode === "sign-in"
			? signInInputSchema.safeParse(value)
			: signUpInputSchema.safeParse(value);

	if (parsed.success) {
		return undefined;
	}

	return {
		fields: toFieldErrors(parsed.error),
	};
}

function toFieldErrors(error: z.ZodError): AuthFieldErrors {
	const fieldErrors: AuthFieldErrors = {};

	for (const issue of error.issues) {
		const field = issue.path[0];

		if (
			typeof field === "string" &&
			!fieldErrors[field as keyof AuthFormValues]
		) {
			fieldErrors[field as keyof AuthFormValues] = issue.message;
		}
	}

	return fieldErrors;
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

export { AuthForm };
