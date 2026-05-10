import { authClient } from "@benkyou/auth/client";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	HugeIcon,
} from "@benkyou/ui";
import { Link, useRouter } from "@tanstack/react-router";

export default function BetterAuthHeader() {
	const { data: session, isPending } = authClient.useSession();
	const router = useRouter();

	if (isPending) {
		return <div className="size-8 animate-pulse rounded-md bg-muted" />;
	}

	if (session?.user) {
		const fallbackInitial = session.user.name?.charAt(0).toUpperCase() || "U";

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						className="h-10 max-w-[240px] justify-start gap-2 px-2 text-left sm:max-w-[280px]"
					>
						{session.user.image ? (
							<img
								src={session.user.image}
								alt=""
								className="size-8 rounded-md border border-border object-cover"
							/>
						) : (
							<span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-medium text-muted-foreground text-xs">
								{fallbackInitial}
							</span>
						)}
						<span className="hidden min-w-0 flex-col items-start sm:flex">
							<span className="max-w-full truncate font-medium text-xs text-foreground leading-4">
								{session.user.name}
							</span>
							<span className="max-w-full truncate font-normal text-muted-foreground text-xs leading-4">
								{session.user.email}
							</span>
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel className="grid gap-0.5 sm:hidden">
						<span className="truncate text-foreground">
							{session.user.name}
						</span>
						<span className="truncate font-normal text-muted-foreground">
							{session.user.email}
						</span>
					</DropdownMenuLabel>
					<DropdownMenuSeparator className="sm:hidden" />
					<DropdownMenuItem asChild>
						<Link to="/courses" search={{ q: "", filter: "all" }}>
							<HugeIcon name="library" className="size-4" />
							<span>Courses</span>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link to="/settings">
							<HugeIcon name="settings" className="size-4" />
							<span>Settings</span>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={() => {
							void authClient.signOut().then(() => {
								void router.navigate({ to: "/" });
							});
						}}
					>
						<span>Sign out</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<Button asChild variant="outline" size="sm">
			<Link to="/sign-in" search={{ redirect: "/" }}>
				Sign in
			</Link>
		</Button>
	);
}
