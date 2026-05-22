import { PRODUCT_NAME } from "@benkyou/core";
import { cn } from "@benkyou/ui";
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
	subtitle = "Learning workspace",
	showText = true,
	to,
}: BrandLogoProps) {
	const content = (
		<>
			<div className="flex size-10 shrink-0 items-center justify-center">
				<img
					src="/logo.png"
					alt={showText ? "" : `${PRODUCT_NAME} logo`}
					className="block size-full object-contain"
				/>
			</div>
			{showText ? (
				<span className="min-w-0 group-data-[collapsible=icon]:hidden">
					<span className="block truncate font-semibold text-[15px] text-current leading-5 tracking-normal">
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
