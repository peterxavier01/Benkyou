import { Button, HugeIcon } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandLogo } from "#components/brand-logo";

type AppRecoveryScreenProps = {
	detail?: ReactNode;
	description: ReactNode;
	iconTone?: "destructive" | "primary";
	onRetry?: () => void;
	title: ReactNode;
};

/** Full-page fallback for crashes and unknown routes. */
function AppRecoveryScreen({
	detail,
	description,
	iconTone = "primary",
	onRetry,
	title,
}: AppRecoveryScreenProps) {
	return (
		<main className="genko-grid flex min-h-dvh flex-col bg-background text-foreground">
			<header className="flex h-16 items-center px-4 sm:px-8">
				<BrandLogo to="/" subtitle={null} />
			</header>
			<div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-4 px-4 pt-10 pb-16 text-center sm:pt-16">
				<span
					aria-hidden="true"
					className={
						iconTone === "destructive"
							? "flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
							: "flex size-16 items-center justify-center rounded-full border-2 border-input border-dashed text-muted-foreground"
					}
				>
					<HugeIcon
						name={iconTone === "destructive" ? "alert" : "notebook"}
						className="size-7"
					/>
				</span>
				<h1 className="text-balance font-semibold font-serif text-3xl leading-tight sm:text-4xl">
					{title}
				</h1>
				<p className="text-muted-foreground leading-relaxed">{description}</p>
				{detail}
				<div className="flex flex-wrap justify-center gap-2 pt-2">
					{onRetry ? (
						<Button type="button" onClick={onRetry}>
							<HugeIcon name="refresh" className="size-4" />
							Reload
						</Button>
					) : null}
					<Button asChild variant={onRetry ? "outline" : "default"}>
						<Link to="/notebooks" search={{ q: "", filter: "all" }}>
							Go to your notebooks
						</Link>
					</Button>
					{onRetry ? null : (
						<Button asChild variant="outline">
							<Link to="/">New notebook</Link>
						</Button>
					)}
				</div>
			</div>
		</main>
	);
}

export { AppRecoveryScreen };
