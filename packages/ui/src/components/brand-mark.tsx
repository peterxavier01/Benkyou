import type * as React from "react";

import { cn } from "#lib/utils";

/**
 * The Benkyou mark: a notebook with a play button and an amber bookmark
 * ribbon. Colors come from theme tokens, so it follows light and dark mode.
 * Drawn on a 64×64 grid; keep the ribbon visible at every size.
 */
function BrandMark({
	className,
	title,
	...props
}: React.ComponentProps<"svg"> & { title?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			role={title ? "img" : undefined}
			aria-hidden={title ? undefined : true}
			aria-label={title}
			className={cn("size-8 shrink-0", className)}
			{...props}
		>
			<rect
				x="12"
				y="5"
				width="40"
				height="52"
				rx="6"
				style={{ fill: "var(--primary)" }}
			/>
			<path
				d="M18 5h3v52h-3a6 6 0 0 1-6-6V11a6 6 0 0 1 6-6z"
				style={{ fill: "color-mix(in oklch, var(--primary) 82%, black)" }}
			/>
			<path
				d="M30.5 22.5v17L44.5 31z"
				strokeWidth="2"
				strokeLinejoin="round"
				style={{
					fill: "var(--primary-foreground)",
					stroke: "var(--primary-foreground)",
				}}
			/>
			<path
				d="M40 50v13l3.75-3.5L47.5 63V50z"
				style={{ fill: "var(--mark)" }}
			/>
		</svg>
	);
}

export { BrandMark };
