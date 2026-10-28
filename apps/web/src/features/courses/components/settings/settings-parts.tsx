import { cn } from "@benkyou/ui";
import type { ReactNode } from "react";

/** A titled group of settings rows. */
function SettingsGroup({
	title,
	description,
	children,
}: {
	title: string;
	description?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="grid gap-3">
			<div className="grid gap-1">
				<h2 className="font-semibold font-serif text-xl">{title}</h2>
				{description ? (
					<p className="text-muted-foreground text-sm leading-relaxed">
						{description}
					</p>
				) : null}
			</div>
			<div className="divide-y divide-border rounded-lg border border-border bg-card">
				{children}
			</div>
		</section>
	);
}

/** One row: label and help on the left, the control on the right. */
function SettingsRow({
	label,
	labelId,
	description,
	control,
	className,
	stack = false,
}: {
	label: ReactNode;
	labelId?: string;
	description?: ReactNode;
	control?: ReactNode;
	className?: string;
	/** Put the control under the label on every screen size. */
	stack?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-3 p-4 sm:px-5",
				!stack && "sm:flex-row sm:items-center sm:justify-between sm:gap-6",
				className,
			)}
		>
			<div className="grid min-w-0 gap-1">
				<span id={labelId} className="font-medium text-sm">
					{label}
				</span>
				{description ? (
					<span className="text-muted-foreground text-sm leading-relaxed">
						{description}
					</span>
				) : null}
			</div>
			{control ? <div className="min-w-0 shrink-0">{control}</div> : null}
		</div>
	);
}

export { SettingsGroup, SettingsRow };
