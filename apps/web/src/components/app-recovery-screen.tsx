import { CORE_PROMISE } from "@benkyou/core";
import { Button, ContentPanel, HugeIcon } from "@benkyou/ui";
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

function AppRecoveryScreen({
	detail,
	description,
	iconTone = "primary",
	onRetry,
	title,
}: AppRecoveryScreenProps) {
	const iconToneClass =
		iconTone === "destructive" ? "text-destructive" : "text-primary";

	return (
		<main className="min-h-dvh bg-background text-foreground">
			<div className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-4 py-8">
				<ContentPanel className="w-full p-5 sm:p-7">
					<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
						<div
							className={`flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted ${iconToneClass}`}
						>
							<HugeIcon name="alertCircle" className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<BrandLogo subtitle={null} />
							<h1 className="mt-2 font-semibold text-2xl tracking-normal">
								{title}
							</h1>
							<p className="mt-2 max-w-xl text-muted-foreground text-sm leading-6">
								{description}
							</p>
							{detail}
							<div className="mt-5 flex flex-wrap gap-2">
								{onRetry ? (
									<Button type="button" onClick={onRetry}>
										Try again
									</Button>
								) : null}
								<Button asChild variant={onRetry ? "outline" : "default"}>
									<Link to="/courses" search={{ q: "", filter: "all" }}>
										Open library
									</Link>
								</Button>
								<Button asChild variant="outline">
									<Link to="/">Create course</Link>
								</Button>
								<Button asChild variant="ghost">
									<Link to="/about">{CORE_PROMISE}</Link>
								</Button>
							</div>
						</div>
					</div>
				</ContentPanel>
			</div>
		</main>
	);
}

export { AppRecoveryScreen };
