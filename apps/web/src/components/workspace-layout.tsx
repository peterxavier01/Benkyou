import {
	cn,
	HugeIcon,
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
import { isImmersiveRoute, WorkspaceTabBar } from "./workspace-tab-bar";

type WorkspaceLayoutProps = {
	children: ReactNode;
};

type WorkspaceNavigationFlush = () => void;

type WorkspaceNavigationFlushContextValue = {
	flushNavigation: () => void;
	registerNavigationFlush: (callback: WorkspaceNavigationFlush) => () => void;
};

const WorkspaceNavigationFlushContext =
	createContext<WorkspaceNavigationFlushContextValue | null>(null);

const navItems = [
	{ icon: "notebook", label: "Notebooks", to: "/notebooks" },
	{ icon: "library", label: "Shelves", to: "/shelves" },
	{ icon: "bookmark", label: "Bookmarks", to: "/bookmarks" },
	{ icon: "settings", label: "Settings", to: "/settings" },
] as const;

function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const immersive = isImmersiveRoute(pathname);
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
								<SidebarGroupContent className="flex flex-col gap-3">
									<SidebarMenu>
										<SidebarMenuItem>
											<SidebarMenuButton
												asChild
												tooltip="New notebook"
												className="h-9 justify-center border border-input bg-card font-medium text-foreground hover:bg-muted group-data-[collapsible=icon]:border-0"
											>
												<Link to="/" onClick={handleWorkspaceNavigation}>
													<HugeIcon name="add" className="size-4" />
													<span>New notebook</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									</SidebarMenu>
									<SidebarMenu aria-label="App">
										{navItems.map((item) => {
											const destination = item.to;
											const active = isActivePath(pathname, destination);

											return (
												<SidebarMenuItem key={destination}>
													<SidebarMenuButton
														asChild
														isActive={active}
														tooltip={item.label}
														className="h-9 text-sidebar-foreground data-active:bg-sidebar-accent data-active:font-semibold data-active:text-sidebar-accent-foreground data-active:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
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
					<SidebarInset
						className={cn(
							"min-w-0 bg-background",
							!immersive &&
								"pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0",
						)}
					>
						{children}
					</SidebarInset>
					{immersive ? null : (
						<WorkspaceTabBar
							isActive={(to) => isActivePath(pathname, to)}
							onNavigate={handleWorkspaceNavigation}
						/>
					)}
				</SidebarProvider>
			</TooltipProvider>
		</WorkspaceNavigationFlushContext.Provider>
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

export { WorkspacePage } from "./workspace-page";
export { WorkspaceLayout, useWorkspaceNavigationFlush };
