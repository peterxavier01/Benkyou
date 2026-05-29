import { cn } from "@benkyou/ui";
import type { ReactNode } from "react";
import { BrandLogo } from "./brand-logo";

type AppHeaderProps = {
	action?: ReactNode;
	subtitle?: string;
};

function AppHeader({
	action,
	subtitle = "Local-first study from one video.",
}: AppHeaderProps) {
	return (
		<header className="sticky top-0 z-20 border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
			<div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
				<AppHeaderBrand subtitle={subtitle} />
				{action ? <div className="shrink-0">{action}</div> : null}
			</div>
		</header>
	);
}

function AppHeaderBrand({ subtitle }: { subtitle: string }) {
	return <BrandLogo to="/" subtitle={subtitle} />;
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
