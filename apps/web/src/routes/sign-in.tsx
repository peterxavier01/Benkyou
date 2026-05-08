import { authClient } from "@benkyou/auth/client";
import {
  type SignInInput,
  type SignUpInput,
  signInInputSchema,
  signUpInputSchema,
} from "@benkyou/auth/schemas";
import { CORE_PROMISE, PRODUCT_NAME } from "@benkyou/core";
import {
  Button,
  ContentPanel,
  HugeIcon,
  Input,
  Label,
  StatusBadge,
} from "@benkyou/ui";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@benkyou/ui/components/alert";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { z } from "zod";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  component: SignInPage,
});

type AuthMode = "sign-in" | "sign-up";

type FormErrors = Partial<Record<keyof SignUpInput | "form", string>>;

function SignInPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = useMemo(
    () =>
      mode === "sign-in"
        ? {
            title: "Sign in",
            action: "Sign in",
            switchAction: "Create account",
          }
        : {
            title: "Create account",
            action: "Create account",
            switchAction: "Sign in instead",
          },
    [mode],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const parsed =
      mode === "sign-in"
        ? signInInputSchema.safeParse({ email, password })
        : signUpInputSchema.safeParse({ name, email, password });

    if (!parsed.success) {
      setErrors(toFormErrors(parsed.error));
      setIsSubmitting(false);
      return;
    }

    const result =
      mode === "sign-in"
        ? await authClient.signIn.email(parsed.data as SignInInput)
        : await authClient.signUp.email(parsed.data as SignUpInput);

    if (result.error) {
      setErrors({
        form:
          result.error.message ||
          "Authentication failed. Check your details and try again.",
      });
      setIsSubmitting(false);
      return;
    }

    await navigate({ href: search.redirect || "/" });
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl gap-6 px-4 py-4 md:grid-cols-[minmax(0,1fr)_420px] md:px-6">
        <section className="flex min-h-[280px] flex-col justify-between border-border border-b py-4 md:border-r md:border-b-0 md:pr-8">
          <Link to="/" className="flex w-fit items-center gap-2 no-underline">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HugeIcon name="bookOpenCheck" className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">{PRODUCT_NAME}</p>
              <p className="text-muted-foreground text-xs">
                Learning workspace
              </p>
            </div>
          </Link>

          <div className="max-w-xl py-8 md:py-0">
            <StatusBadge tone="neutral">Hosted sync readiness</StatusBadge>
            <h1 className="mt-4 max-w-lg font-semibold text-3xl leading-tight tracking-normal">
              {CORE_PROMISE}
            </h1>
            <p className="mt-4 max-w-lg text-muted-foreground text-sm leading-6">
              Sign in when you want courses, notes, progress, and bookmarks to
              follow you across sessions.
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="w-fit px-0">
            <Link to="/">
              <HugeIcon name="playCircle" className="size-4" />
              Continue locally
            </Link>
          </Button>
        </section>

        <section className="flex items-center">
          <ContentPanel className="w-full p-5">
            <div className="mb-5">
              <h2 className="font-semibold text-xl">{copy.title}</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Email and password are enabled for the MVP.
              </p>
            </div>

            {errors.form ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Could not continue</AlertTitle>
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "sign-up" ? (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    aria-invalid={Boolean(errors.name)}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {errors.name ? (
                    <p className="text-destructive text-sm">{errors.name}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={Boolean(errors.email)}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {errors.email ? (
                  <p className="text-destructive text-sm">{errors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "sign-in" ? "current-password" : "new-password"
                  }
                  value={password}
                  aria-invalid={Boolean(errors.password)}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {errors.password ? (
                  <p className="text-destructive text-sm">{errors.password}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? "Working..." : copy.action}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between gap-3 border-border border-t pt-4">
              <p className="text-muted-foreground text-sm">
                {mode === "sign-in"
                  ? "New to Benkyou?"
                  : "Already have an account?"}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setErrors({});
                  setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                }}
              >
                {copy.switchAction}
              </Button>
            </div>
          </ContentPanel>
        </section>
      </div>
    </main>
  );
}

function toFormErrors(error: z.ZodError): FormErrors {
  const fieldErrors: FormErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field as keyof SignUpInput]) {
      fieldErrors[field as keyof SignUpInput] = issue.message;
    }
  }

  return fieldErrors;
}
