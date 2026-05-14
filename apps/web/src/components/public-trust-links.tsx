import { Link } from "@tanstack/react-router";

const trustLinks = [
	{ label: "About", to: "/about" },
	{ label: "Self-hosting", to: "/self-hosting" },
	{ label: "Privacy", to: "/privacy" },
	{ label: "Terms", to: "/terms" },
] as const;

function PublicTrustLinks() {
	return (
		<nav aria-label="Trust pages" className="flex flex-wrap gap-x-4 gap-y-2">
			{trustLinks.map((link) => (
				<Link key={link.to} to={link.to} className="text-sm">
					{link.label}
				</Link>
			))}
		</nav>
	);
}

function PublicFooter() {
	return (
		<footer className="border-border border-t bg-muted/40">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-5 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<p>Benkyou is a local-first learning workspace.</p>
				<PublicTrustLinks />
			</div>
		</footer>
	);
}

export { PublicFooter, PublicTrustLinks };
