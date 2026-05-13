import { CORE_PROMISE } from "@benkyou/core";
import { Button, ContentPanel, HugeIcon } from "@benkyou/ui";
import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { BrandLogo } from "#components/brand-logo";

function GlobalErrorScreen({ error, reset }: ErrorComponentProps) {
	const errorMessage =
		error instanceof Error ? error.message : "An unexpected error occurred.";

	return (
		<main className="min-h-dvh bg-background text-foreground">
			<div className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-4 py-8">
				<ContentPanel className="w-full p-5 sm:p-7">
					<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-destructive">
							<HugeIcon name="alertCircle" className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<BrandLogo subtitle={null} />
							<h1 className="mt-2 font-semibold text-2xl tracking-normal">
								Something went wrong
							</h1>
							<p className="mt-2 max-w-xl text-muted-foreground text-sm leading-6">
								Benkyou hit a problem while opening this screen. You can retry
								the current route or return to your library.
							</p>
							{import.meta.env.DEV ? (
								<pre className="mt-4 max-h-40 overflow-auto rounded-md border border-border bg-muted p-3 text-muted-foreground text-xs">
									{errorMessage}
								</pre>
							) : null}
							<div className="mt-5 flex flex-wrap gap-2">
								<Button type="button" onClick={reset}>
									Try again
								</Button>
								<Button asChild variant="outline">
									<Link to="/courses" search={{ q: "", filter: "all" }}>
										Open library
									</Link>
								</Button>
								<Button asChild variant="ghost">
									<Link to="/">{CORE_PROMISE}</Link>
								</Button>
							</div>
						</div>
					</div>
				</ContentPanel>
			</div>
		</main>
	);
}

export { GlobalErrorScreen };
