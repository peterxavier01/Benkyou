import { cn, Separator, SidebarTrigger } from "@benkyou/ui";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { isImmersiveRoute } from "./workspace-tab-bar";

type WorkspacePageProps = {
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	description?: ReactNode;
	maxWidth?: "default" | "wide" | "narrow" | "full";
	title: ReactNode;
};

const maxWidthClasses = {
	default: "max-w-7xl",
	wide: "max-w-[1480px]",
	narrow: "max-w-5xl",
	full: "max-w-none",
};

function WorkspacePage({
	action,
	children,
	className,
	description,
	maxWidth = "default",
	title,
}: WorkspacePageProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	// Phones navigate with the bottom tab bar; immersive screens keep the
	// sidebar sheet because the tab bar is hidden there.
	const showMobileTrigger = isImmersiveRoute(pathname);

	return (
		<>
			<header className="sticky top-0 z-20 border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
				<div className="flex h-14 items-center gap-3 px-3 sm:px-6">
					{showMobileTrigger ? (
						<SidebarTrigger className="size-11 md:hidden" />
					) : null}
					<Separator orientation="vertical" className="hidden h-5 md:block" />
					<div className="min-w-0 flex-1">
						<h1 className="truncate font-semibold text-sm leading-5 text-foreground">
							{title}
						</h1>
						{description ? (
							<p className="hidden truncate text-muted-foreground text-xs leading-4 sm:block">
								{description}
							</p>
						) : null}
					</div>
					{action ? <div className="shrink-0">{action}</div> : null}
				</div>
			</header>
			<section
				className={cn(
					"mx-auto grid w-full gap-4 p-3 sm:p-6",
					maxWidthClasses[maxWidth],
					className,
				)}
			>
				{children}
			</section>
		</>
	);
}

export { WorkspacePage };
