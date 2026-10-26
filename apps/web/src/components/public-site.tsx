import { REPOSITORY_URL } from "@benkyou/core";
import {
	Button,
	cn,
	HugeIcon,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useHydratedSession } from "#/integrations/better-auth/use-hydrated-session";
import { BrandLogo } from "#components/brand-logo";

const publicNav = [
	{ label: "How it works", to: "/how-it-works" },
	{ label: "Self-hosting", to: "/self-hosting" },
	{ label: "About", to: "/about" },
] as const;

const footerLinks = [
	...publicNav,
	{ label: "Privacy", to: "/privacy" },
	{ label: "Terms", to: "/terms" },
] as const;

/** Header, main and footer shared by the home, public and auth pages. */
function PublicPage({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className="flex min-h-dvh flex-col bg-background text-foreground">
			<PublicHeader />
			<main className={cn("flex-1", className)}>{children}</main>
			<PublicFooter />
		</div>
	);
}

function PublicHeader() {
	return (
		<header className="sticky top-0 z-20 border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
			<div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 pr-1 pl-4 sm:h-16 sm:px-6">
				<BrandLogo to="/" subtitle={null} />
				<nav aria-label="Main" className="hidden items-center gap-7 md:flex">
					{publicNav.map((item) => (
						<Link
							key={item.to}
							data-slot="public-nav-link"
							to={item.to}
							className="text-foreground text-sm no-underline hover:text-primary data-[status=active]:font-medium data-[status=active]:text-primary"
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className="flex items-center gap-1 sm:gap-2">
					<Button asChild variant="ghost" className="hidden md:inline-flex">
						<a data-slot="github-link" href={REPOSITORY_URL}>
							<HugeIcon name="github" className="size-4" />
							GitHub
						</a>
					</Button>
					<AccountButton />
					<PublicMobileMenu />
				</div>
			</div>
		</header>
	);
}

function AccountButton() {
	const { data: session, isPending } = useHydratedSession();

	if (isPending) {
		return <span className="h-9 w-[76px] animate-pulse rounded-md bg-muted" />;
	}

	if (session?.user) {
		return (
			<Button asChild variant="outline">
				<Link to="/courses" search={{ q: "", filter: "all" }}>
					Your notebooks
				</Link>
			</Button>
		);
	}

	// Signed-out learners keep private notebooks too, so they get a way in.
	return (
		<>
			<Button asChild variant="ghost" className="hidden md:inline-flex">
				<Link to="/courses" search={{ q: "", filter: "all" }}>
					Your notebooks
				</Link>
			</Button>
			<Button asChild variant="outline">
				<Link to="/sign-in" search={{ redirect: "/courses" }}>
					Sign in
				</Link>
			</Button>
		</>
	);
}

function PublicMobileMenu() {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="size-11 md:hidden"
				>
					<HugeIcon name="menu" className="size-5" />
					<span className="sr-only">Open menu</span>
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-[min(320px,85vw)]">
				<SheetHeader>
					<SheetTitle className="font-serif text-lg">Menu</SheetTitle>
					<SheetDescription className="sr-only">
						Pages about Benkyou
					</SheetDescription>
				</SheetHeader>
				<nav aria-label="Main" className="grid px-2">
					{[{ label: "Home", to: "/" } as const, ...publicNav].map((item) => (
						<Link
							key={item.to}
							data-slot="public-nav-link"
							to={item.to}
							activeOptions={{ exact: true }}
							className="flex min-h-12 items-center rounded-md px-3 text-base text-foreground no-underline hover:bg-muted data-[status=active]:font-medium data-[status=active]:text-primary"
							onClick={() => setOpen(false)}
						>
							{item.label}
						</Link>
					))}
					<Link
						data-slot="public-nav-link"
						to="/courses"
						search={{ q: "", filter: "all" }}
						className="flex min-h-12 items-center rounded-md px-3 text-base text-foreground no-underline hover:bg-muted"
						onClick={() => setOpen(false)}
					>
						Your notebooks
					</Link>
					<a
						data-slot="public-nav-link"
						href={REPOSITORY_URL}
						className="flex min-h-12 items-center gap-2 rounded-md px-3 text-base text-foreground no-underline hover:bg-muted"
					>
						<HugeIcon name="github" className="size-4" />
						GitHub
					</a>
				</nav>
			</SheetContent>
		</Sheet>
	);
}

function PublicFooter() {
	return (
		<footer className="border-border border-t">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div className="grid gap-1.5">
					<BrandLogo subtitle={null} className="[&_svg]:size-7" />
					<p className="text-muted-foreground text-[13px]">
						Study notebooks for long videos.
					</p>
				</div>
				<nav
					aria-label="Footer"
					className="flex flex-wrap gap-x-6 gap-y-3 text-[13px]"
				>
					{footerLinks.map((link) => (
						<Link
							key={link.to}
							data-slot="footer-link"
							to={link.to}
							className="text-muted-foreground no-underline hover:text-foreground"
						>
							{link.label}
						</Link>
					))}
					<a
						data-slot="footer-link"
						href={REPOSITORY_URL}
						className="text-muted-foreground no-underline hover:text-foreground"
					>
						GitHub
					</a>
				</nav>
			</div>
		</footer>
	);
}

/** Eyebrow, serif heading and lead paragraph that open a public page. */
function PublicPageIntro({
	eyebrow,
	title,
	children,
	aside,
}: {
	eyebrow: string;
	title: ReactNode;
	children: ReactNode;
	aside?: ReactNode;
}) {
	return (
		<section className="relative overflow-hidden border-border border-b">
			<div
				aria-hidden="true"
				className="genko-grid absolute inset-0 mask-[linear-gradient(to_bottom,#000_55%,transparent)]"
			/>
			<div className="relative mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 pt-10 pb-11 sm:px-6 sm:pt-16 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_auto]">
				<div className="grid max-w-3xl gap-4">
					<p className="font-medium text-[13px] text-primary">{eyebrow}</p>
					<h1 className="text-balance font-semibold font-serif text-[38px] leading-[1.06] tracking-[-0.025em] sm:text-5xl">
						{title}
					</h1>
					<div className="max-w-2xl text-pretty text-base text-muted-foreground leading-relaxed sm:text-lg">
						{children}
					</div>
				</div>
				{aside}
			</div>
		</section>
	);
}

export { PublicFooter, PublicHeader, PublicPage, PublicPageIntro };
