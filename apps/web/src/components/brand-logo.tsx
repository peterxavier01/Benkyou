import { PRODUCT_NAME } from "@benkyou/core";
import { BrandMark, cn } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import type { MouseEventHandler, ReactNode } from "react";

type BrandLogoProps = {
	className?: string;
	onClick?: MouseEventHandler<HTMLAnchorElement>;
	subtitle?: ReactNode;
	showText?: boolean;
	to?: "/";
};

function BrandLogo({
	className,
	onClick,
	subtitle = "Study notebooks",
	showText = true,
	to,
}: BrandLogoProps) {
	const content = (
		<>
			<BrandMark
				className="size-9"
				title={showText ? undefined : `${PRODUCT_NAME} logo`}
			/>
			{showText ? (
				<span className="min-w-0 group-data-[collapsible=icon]:hidden">
					<span className="block truncate font-semibold font-serif text-[19px] text-current lowercase leading-6 tracking-[-0.015em]">
						{PRODUCT_NAME}
					</span>
					{subtitle ? (
						<span className="block truncate text-muted-foreground text-[11px] leading-4">
							{subtitle}
						</span>
					) : null}
				</span>
			) : null}
		</>
	);

	if (to) {
		return (
			<Link
				data-slot="brand-logo"
				to={to}
				className={cn(
					"inline-flex min-w-0 items-center gap-2 rounded-lg text-foreground no-underline outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0",
					className,
				)}
				onClick={onClick}
			>
				{content}
			</Link>
		);
	}

	return (
		<div
			className={cn(
				"inline-flex min-w-0 items-center gap-2 text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0",
				className,
			)}
		>
			{content}
		</div>
	);
}

export { BrandLogo };
