import type { ErrorComponentProps } from "@tanstack/react-router";
import { AppRecoveryScreen } from "#components/app-recovery-screen";

function GlobalErrorScreen({ error, reset }: ErrorComponentProps) {
	const errorMessage =
		error instanceof Error ? error.message : "An unexpected error occurred.";

	return (
		<AppRecoveryScreen
			title="Something went wrong on this page"
			description="Your notebooks, notes and bookmarks are saved and weren’t affected. Reloading usually fixes this."
			iconTone="destructive"
			onRetry={reset}
			detail={
				import.meta.env.DEV ? (
					<pre className="max-h-40 w-full overflow-auto rounded-md border border-border bg-card p-3 text-left text-muted-foreground text-xs">
						{errorMessage}
					</pre>
				) : null
			}
		/>
	);
}

export { GlobalErrorScreen };
