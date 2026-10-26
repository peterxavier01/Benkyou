import { cn, HugeIcon, type HugeIconName } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";

type TabItem = {
	icon: HugeIconName;
	label: string;
	to: "/" | "/notebooks" | "/shelves" | "/bookmarks" | "/settings";
};

const tabItems: TabItem[] = [
	{ icon: "add", label: "New", to: "/" },
	{ icon: "notebook", label: "Notebooks", to: "/notebooks" },
	{ icon: "library", label: "Shelves", to: "/shelves" },
	{ icon: "bookmark", label: "Bookmarks", to: "/bookmarks" },
	{ icon: "settings", label: "Settings", to: "/settings" },
];

/** Bottom navigation for phones. The sidebar takes over from `md` up. */
function WorkspaceTabBar({
	isActive,
	onNavigate,
}: {
	isActive: (to: string) => boolean;
	onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
	return (
		<nav
			aria-label="App"
			className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-border border-t bg-background/95 px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur supports-backdrop-filter:bg-background/90 md:hidden"
		>
			{tabItems.map((item) => {
				const active = isActive(item.to);

				return (
					<Link
						key={item.to}
						data-slot="tab-bar-item"
						to={item.to}
						onClick={onNavigate}
						aria-current={active ? "page" : undefined}
						className={cn(
							"flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring",
							active
								? "font-semibold text-primary"
								: "font-medium text-muted-foreground",
						)}
					>
						<HugeIcon
							name={item.icon}
							className="size-[22px]"
							strokeWidth={active ? 2 : 1.75}
						/>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}

/**
 * The notebook player is a full-screen study surface on phones, so it keeps
 * its own back navigation and hides the tab bar.
 */
function isImmersiveRoute(pathname: string) {
	return /^\/notebooks\/(?!new(?:\/|$))[^/]+\/?$/.test(pathname);
}

export { WorkspaceTabBar, isImmersiveRoute };
