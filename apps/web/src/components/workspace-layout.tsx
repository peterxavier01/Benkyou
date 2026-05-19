import {
	cn,
	HugeIcon,
	Separator,
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
	TooltipProvider,
} from "@benkyou/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import {
	createContext,
	type MouseEvent,
	type ReactNode,
	use,
	useCallback,
	useMemo,
	useRef,
} from "react";
import { BrandLogo } from "./brand-logo";

type WorkspaceLayoutProps = {
	children: ReactNode;
};

type WorkspacePageProps = {
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	description?: ReactNode;
	maxWidth?: "default" | "wide" | "narrow" | "full";
	title: ReactNode;
};

type WorkspaceNavigationFlush = () => void;

type WorkspaceNavigationFlushContextValue = {
	flushNavigation: () => void;
	registerNavigationFlush: (callback: WorkspaceNavigationFlush) => () => void;
};

const WorkspaceNavigationFlushContext =
	createContext<WorkspaceNavigationFlushContextValue | null>(null);

const navItems = [
	{ icon: "home", label: "Home", to: "/" },
	{ icon: "library", label: "Courses", to: "/courses" },
	{ icon: "bookmark", label: "Bookmarks", to: "/bookmarks" },
	{ icon: "settings", label: "Settings", to: "/settings" },
] as const;

const maxWidthClasses = {
	default: "max-w-7xl",
	wide: "max-w-[1480px]",
	narrow: "max-w-5xl",
	full: "max-w-none",
};

function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const navigationFlushCallbacksRef = useRef(
		new Set<WorkspaceNavigationFlush>(),
	);
	const registerNavigationFlush = useCallback(
		(callback: WorkspaceNavigationFlush) => {
			navigationFlushCallbacksRef.current.add(callback);

			return () => {
				navigationFlushCallbacksRef.current.delete(callback);
			};
		},
		[],
	);
	const flushNavigation = useCallback(() => {
		for (const callback of navigationFlushCallbacksRef.current) {
			callback();
		}
	}, []);
	const navigationFlushContext = useMemo(
		() => ({ flushNavigation, registerNavigationFlush }),
		[flushNavigation, registerNavigationFlush],
	);
	const handleWorkspaceNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
		if (
			event.defaultPrevented ||
			event.metaKey ||
			event.altKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.button !== 0
		) {
			return;
		}

		flushNavigation();
	};

	return (
		<WorkspaceNavigationFlushContext.Provider value={navigationFlushContext}>
			<TooltipProvider>
				<SidebarProvider>
					<Sidebar collapsible="icon" variant="sidebar">
						<SidebarHeader className="border-sidebar-border border-b p-3">
							<BrandLogo
								to="/"
								className="px-1 py-0.5"
								onClick={handleWorkspaceNavigation}
							/>
						</SidebarHeader>
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupContent>
									<SidebarMenu>
										{navItems.map((item) => {
											const destination = item.to;
											const active = isActivePath(pathname, destination);

											return (
												<SidebarMenuItem key={destination}>
													<SidebarMenuButton
														asChild
														isActive={active}
														tooltip={item.label}
														className="h-9 text-sidebar-foreground/75 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:shadow-[inset_0_0_0_1px_var(--sidebar-border)]"
													>
														<Link
															to={item.to}
															onClick={handleWorkspaceNavigation}
														>
															<HugeIcon name={item.icon} className="size-4" />
															<span>{item.label}</span>
														</Link>
													</SidebarMenuButton>
												</SidebarMenuItem>
											);
										})}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
						<SidebarRail />
					</Sidebar>
					<SidebarInset className="min-w-0 bg-background">
						{children}
					</SidebarInset>
				</SidebarProvider>
			</TooltipProvider>
		</WorkspaceNavigationFlushContext.Provider>
	);
}

function WorkspacePage({
	action,
	children,
	className,
	description,
	maxWidth = "default",
	title,
}: WorkspacePageProps) {
	return (
		<>
			<header className="sticky top-0 z-20 border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
				<div className="flex h-14 items-center gap-3 px-3 sm:px-6">
					<SidebarTrigger className="md:hidden" />
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

function isActivePath(pathname: string, to: string) {
	if (to === "/") {
		return pathname === "/";
	}

	return pathname === to || pathname.startsWith(`${to}/`);
}

function useWorkspaceNavigationFlush() {
	const context = use(WorkspaceNavigationFlushContext);

	if (!context) {
		throw new Error(
			"useWorkspaceNavigationFlush must be used within WorkspaceLayout.",
		);
	}

	return context;
}

export { WorkspaceLayout, WorkspacePage, useWorkspaceNavigationFlush };
