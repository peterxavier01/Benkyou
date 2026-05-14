import type { ErrorComponentProps } from "@tanstack/react-router";
import { AppRecoveryScreen } from "#components/app-recovery-screen";

function GlobalErrorScreen({ error, reset }: ErrorComponentProps) {
	const errorMessage =
		error instanceof Error ? error.message : "An unexpected error occurred.";

	return (
		<AppRecoveryScreen
			title="Something went wrong"
			description="Benkyou hit a problem while opening this screen. You can retry the current route, return to your library, or start from the course entry flow."
			iconTone="destructive"
			onRetry={reset}
			detail={
				import.meta.env.DEV ? (
					<pre className="mt-4 max-h-40 overflow-auto rounded-md border border-border bg-muted p-3 text-muted-foreground text-xs">
						{errorMessage}
					</pre>
				) : null
			}
		/>
	);
}

export { GlobalErrorScreen };
