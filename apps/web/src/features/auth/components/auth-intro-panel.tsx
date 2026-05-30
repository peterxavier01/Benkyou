import { CORE_PROMISE } from "@benkyou/core";
import type { HugeIconName } from "@benkyou/ui";
import { ContentPanel, HugeIcon, StatusBadge } from "@benkyou/ui";
import { BrandLogo } from "#components/brand-logo";

const authBenefits = [
	{
		icon: "clock",
		label: "Resume progress across sessions",
	},
	{
		icon: "bookmark",
		label: "Keep notes and bookmarks recoverable",
	},
	{
		icon: "list",
		label: "Sync generated course structure",
	},
] as const satisfies ReadonlyArray<{
	icon: HugeIconName;
	label: string;
}>;

function AuthIntroPanel() {
	return (
		<ContentPanel className="flex flex-col justify-between p-5 sm:p-7 md:min-h-[420px]">
			<div className="grid gap-5">
				<BrandLogo subtitle="Hosted sync" />

				<StatusBadge tone="neutral" className="w-fit px-2">
					Account workspace
				</StatusBadge>
				<div className="grid gap-4">
					<h1 className="max-w-xl font-semibold text-2xl leading-tight tracking-normal sm:text-3xl">
						{CORE_PROMISE}
					</h1>
					<p className="max-w-xl text-muted-foreground text-sm leading-6">
						Use Benkyou locally right away. Sign in when you want notes,
						bookmarks, progress, and generated structure to follow you across
						sessions.
					</p>
				</div>
			</div>

			<ul className="mt-8 space-y-2.5 text-sm">
				{authBenefits.map((benefit) => (
					<li
						key={benefit.label}
						className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
					>
						<span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
							<HugeIcon name={benefit.icon} className="size-3.5" />
						</span>
						<span className="text-muted-foreground">{benefit.label}</span>
					</li>
				))}
			</ul>
		</ContentPanel>
	);
}

export { AuthIntroPanel };
