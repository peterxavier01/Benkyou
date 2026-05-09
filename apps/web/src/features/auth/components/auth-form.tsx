import { authClient } from "@benkyou/auth/client";
import {
  type SignInInput,
  type SignUpInput,
  signInInputSchema,
  signUpInputSchema,
} from "@benkyou/auth/schemas";
import { Button, ContentPanel, Input, Label } from "@benkyou/ui";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@benkyou/ui/components/alert";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { z } from "zod";

type AuthMode = "sign-in" | "sign-up";
type AuthFormValues = SignUpInput;
type AuthFieldErrors = Partial<Record<keyof AuthFormValues, string>>;

type AuthFormProps = {
  redirectTo: string;
};

const defaultValues = {
  name: "",
  email: "",
  password: "",
} satisfies AuthFormValues;

function AuthForm({ redirectTo }: AuthFormProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [authError, setAuthError] = useState<string | null>(null);

  const copy = useMemo(
    () =>
      mode === "sign-in"
        ? {
            title: "Sign in",
            action: "Sign in",
            description: "Resume your saved courses, notes, and bookmarks.",
            switchAction: "Create account",
            switchPrompt: "New to Benkyou?",
          }
        : {
            title: "Create account",
            action: "Create account",
            description: "Save your learning workspace for later sessions.",
            switchAction: "Sign in instead",
            switchPrompt: "Already have an account?",
          },
    [mode],
  );

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
        setAuthError(
          result.error.message ||
            "Authentication failed. Check your details and try again.",
        );
        return;
      }

      await navigate({ href: redirectTo || "/" });
    },
  });

  return (
    <ContentPanel className="w-full p-5">
      <div className="mb-5">
        <h2 className="font-semibold text-xl">{copy.title}</h2>
        <p className="mt-1 text-muted-foreground text-sm">{copy.description}</p>
      </div>

      {authError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Could not continue</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      ) : null}

      <form
        className="space-y-4"
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
              label="Password"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              type="password"
              value={field.state.value}
            />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Working..." : copy.action}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 flex items-center justify-between gap-3 border-border border-t pt-4">
        <p className="text-muted-foreground text-sm">{copy.switchPrompt}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setAuthError(null);
            form.reset();
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          }}
        >
          {copy.switchAction}
        </Button>
      </div>
    </ContentPanel>
  );
}

function AuthTextField({
  autoComplete,
  error,
  fieldId,
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
  label: string;
  name: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  type?: "email" | "password" | "text";
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={Boolean(error)}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
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
