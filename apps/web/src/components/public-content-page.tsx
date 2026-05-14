import { CORE_PROMISE, PRODUCT_NAME } from "@benkyou/core";
import { Button, ContentPanel, cn, HugeIcon, StatusBadge } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppHeader } from "#components/app-header";
import { PublicFooter, PublicTrustLinks } from "#components/public-trust-links";

type PublicContentPageProps = {
	children: ReactNode;
	description: ReactNode;
	eyebrow: string;
	title: ReactNode;
};

type PublicSectionProps = {
	children: ReactNode;
	className?: string;
	description?: ReactNode;
	title: ReactNode;
};

type PublicMetadataRowProps = {
	label: ReactNode;
	value: ReactNode;
};

function PublicContentPage({
	children,
	description,
	eyebrow,
	title,
}: PublicContentPageProps) {
	return (
		<main className="flex min-h-dvh flex-col bg-background text-foreground">
			<AppHeader
				action={
					<div className="hidden items-center gap-3 sm:flex">
						<PublicTrustLinks />
						<Button asChild size="sm">
							<Link to="/">{CORE_PROMISE}</Link>
						</Button>
					</div>
				}
				subtitle="Trust and project context"
			/>

			<section className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-5 px-3 py-6 sm:px-6 lg:py-10">
				<div className="grid gap-4 border-border border-b pb-6">
					<StatusBadge tone="info" className="w-fit px-3 py-0.5">
						{eyebrow}
					</StatusBadge>
					<div className="grid gap-3">
						<h1 className="max-w-3xl font-semibold text-3xl leading-tight tracking-normal sm:text-4xl">
							{title}
						</h1>
						<p className="max-w-3xl text-base text-muted-foreground leading-7">
							{description}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button asChild>
							<Link to="/">Create course</Link>
						</Button>
						<Button asChild variant="outline">
							<Link to="/courses" search={{ q: "", filter: "all" }}>
								Open library
							</Link>
						</Button>
					</div>
				</div>

				{children}
			</section>

			<PublicFooter />
		</main>
	);
}

function PublicSection({
	children,
	className,
	description,
	title,
}: PublicSectionProps) {
	return (
		<ContentPanel className={cn("p-4 sm:p-5", className)}>
			<div className="grid gap-3">
				<div>
					<h2 className="font-semibold text-lg tracking-normal">{title}</h2>
					{description ? (
						<p className="mt-1 max-w-3xl text-muted-foreground text-sm leading-6">
							{description}
						</p>
					) : null}
				</div>
				<div className="grid gap-3 text-sm leading-6">{children}</div>
			</div>
		</ContentPanel>
	);
}

function PublicMetadataRow({ label, value }: PublicMetadataRowProps) {
	return (
		<div className="grid gap-1 border-border border-t py-3 first:border-t-0 sm:grid-cols-[180px_minmax(0,1fr)]">
			<dt className="font-medium text-foreground">{label}</dt>
			<dd className="min-w-0 text-muted-foreground">{value}</dd>
		</div>
	);
}

function PublicCallout({ children }: { children: ReactNode }) {
	return (
		<div className="flex gap-3 rounded-lg border border-border bg-muted/35 p-3">
			<div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
				<HugeIcon name="checkmarkCircle" className="size-4" />
			</div>
			<p className="text-muted-foreground text-sm leading-6">{children}</p>
		</div>
	);
}

function ProductName() {
	return <>{PRODUCT_NAME}</>;
}

export {
	ProductName,
	PublicCallout,
	PublicContentPage,
	PublicMetadataRow,
	PublicSection,
};
