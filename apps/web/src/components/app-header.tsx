import { PRODUCT_NAME } from "@benkyou/core";
import { cn, HugeIcon } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type AppHeaderProps = {
	action?: ReactNode;
	subtitle?: string;
};

function AppHeader({
	action,
	subtitle = "Local-first study from one video.",
}: AppHeaderProps) {
	return (
		<header className="sticky top-0 z-20 border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
			<div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
				<AppHeaderBrand subtitle={subtitle} />
				{action ? <div className="shrink-0">{action}</div> : null}
			</div>
		</header>
	);
}

function AppHeaderBrand({ subtitle }: { subtitle: string }) {
	return (
		<Link to="/" className="flex min-w-0 items-center gap-2 no-underline">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
				<HugeIcon name="bookOpenCheck" className="size-4" />
			</div>
			<div className="min-w-0">
				<p className="truncate font-semibold text-sm">{PRODUCT_NAME}</p>
				<p className="hidden text-muted-foreground text-xs sm:block">
					{subtitle}
				</p>
			</div>
		</Link>
	);
}

function HeaderActionLink({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<span className={cn("inline-flex items-center gap-1.5", className)}>
			{children}
		</span>
	);
}

export { AppHeader, HeaderActionLink };
