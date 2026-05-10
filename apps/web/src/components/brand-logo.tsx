import { PRODUCT_NAME } from "@benkyou/core";
import { cn, HugeIcon } from "@benkyou/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type BrandLogoProps = {
	className?: string;
	subtitle?: ReactNode;
	showText?: boolean;
	to?: "/";
};

function BrandLogo({
	className,
	subtitle = "Learning workspace",
	showText = true,
	to,
}: BrandLogoProps) {
	const content = (
		<>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18)]">
				<HugeIcon name="bookOpenCheck" className="size-4" />
			</span>
			{showText ? (
				<span className="min-w-0">
					<span className="block truncate font-semibold text-current text-sm leading-5">
						{PRODUCT_NAME}
					</span>
					{subtitle ? (
						<span className="block truncate text-muted-foreground text-xs leading-4">
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
					"inline-flex min-w-0 items-center gap-2 no-underline",
					className,
				)}
			>
				{content}
			</Link>
		);
	}

	return (
		<div className={cn("inline-flex min-w-0 items-center gap-2", className)}>
			{content}
		</div>
	);
}

export { BrandLogo };
