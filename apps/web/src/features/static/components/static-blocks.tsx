import { cn } from "@benkyou/ui";
import type { ReactNode } from "react";

/** A command block on a light surface, for docs-style pages. */
function CommandBlock({ lines }: { lines: string[] }) {
	return (
		<pre className="m-0 max-w-full overflow-x-auto rounded-md border border-border bg-muted p-3.5 font-mono text-[13px] leading-relaxed sm:text-sm">
			<code>
				{lines.map((line) => (
					<span key={line} className="block whitespace-pre">
						<span
							aria-hidden="true"
							className="select-none text-muted-foreground"
						>
							${" "}
						</span>
						{line}
					</span>
				))}
			</code>
		</pre>
	);
}

function InlineCode({ children }: { children: ReactNode }) {
	return (
		<code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]">
			{children}
		</code>
	);
}

/** Serif section heading used on About, How it works and Self-hosting. */
function SectionHeading({
	id,
	children,
	className,
}: {
	id?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<h2
			id={id}
			className={cn(
				"scroll-mt-24 text-balance font-semibold font-serif text-[26px] leading-tight tracking-[-0.015em] sm:text-[32px]",
				className,
			)}
		>
			{children}
		</h2>
	);
}

/** Numbered step with a serif number, heading, body and optional picture. */
function NumberedStep({
	number,
	title,
	children,
	illustration,
}: {
	number: string;
	title: string;
	children: ReactNode;
	illustration?: ReactNode;
}) {
	return (
		<section className="grid items-start gap-6 border-border border-t py-8 first:border-t-0 sm:py-12 lg:grid-cols-2 lg:gap-12">
			<div className="grid gap-3">
				<div className="flex items-baseline gap-3.5">
					<span className="font-semibold font-serif text-[17px] text-primary tabular-nums sm:text-xl">
						{number}
					</span>
					<h2 className="font-semibold font-serif text-[26px] leading-tight tracking-[-0.01em] sm:text-[30px]">
						{title}
					</h2>
				</div>
				<div className="grid max-w-[480px] gap-3 text-[15px] text-muted-foreground leading-relaxed sm:text-base">
					{children}
				</div>
			</div>
			<div className="min-w-0">{illustration}</div>
		</section>
	);
}

export { CommandBlock, InlineCode, NumberedStep, SectionHeading };
