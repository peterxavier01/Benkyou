import type * as React from "react";

import { cn } from "#lib/utils";

function AppShell({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="app-shell"
			className={cn(
				"grid min-h-dvh bg-background text-foreground md:grid-cols-[240px_minmax(0,1fr)]",
				className,
			)}
			{...props}
		/>
	);
}

function AppSidebar({ className, ...props }: React.ComponentProps<"aside">) {
	return (
		<aside
			data-slot="app-sidebar"
			className={cn(
				"hidden border-border border-r bg-sidebar text-sidebar-foreground md:flex md:min-h-dvh md:flex-col",
				className,
			)}
			{...props}
		/>
	);
}

function AppSidebarHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="app-sidebar-header"
			className={cn("border-sidebar-border border-b p-4", className)}
			{...props}
		/>
	);
}

function AppSidebarNav({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			data-slot="app-sidebar-nav"
			className={cn("flex flex-1 flex-col gap-1 p-2", className)}
			{...props}
		/>
	);
}

function AppSidebarNavItem({
	className,
	active = false,
	...props
}: React.ComponentProps<"a"> & {
	active?: boolean;
}) {
	return (
		<a
			data-slot="app-sidebar-nav-item"
			data-active={active ? "true" : undefined}
			className={cn(
				"relative flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground/75 no-underline outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:before:absolute data-active:before:inset-y-1 data-active:before:left-0 data-active:before:w-[3px] data-active:before:rounded-full data-active:before:bg-sidebar-primary [&_svg]:size-4 [&_svg]:shrink-0",
				className,
			)}
			{...props}
		/>
	);
}

function AppMain({ className, ...props }: React.ComponentProps<"main">) {
	return (
		<main
			data-slot="app-main"
			className={cn("min-w-0 bg-background", className)}
			{...props}
		/>
	);
}

function AppTopBar({ className, ...props }: React.ComponentProps<"header">) {
	return (
		<header
			data-slot="app-top-bar"
			className={cn(
				"sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-border border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/85 sm:px-6",
				className,
			)}
			{...props}
		/>
	);
}

function ContentPanel({
	className,
	...props
}: React.ComponentProps<"section">) {
	return (
		<section
			data-slot="content-panel"
			className={cn(
				"rounded-lg border border-border bg-card p-4 text-card-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export {
	AppMain,
	AppShell,
	AppSidebar,
	AppSidebarHeader,
	AppSidebarNav,
	AppSidebarNavItem,
	AppTopBar,
	ContentPanel,
};
