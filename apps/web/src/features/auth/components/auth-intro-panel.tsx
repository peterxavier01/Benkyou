import type { HugeIconName } from "@benkyou/ui";
import { HugeIcon } from "@benkyou/ui";

const benefits = [
	{
		icon: "device",
		title: "Pick up on any device",
		body: "Your place in every notebook follows you from laptop to phone.",
	},
	{
		icon: "bookmark",
		title: "Notes and bookmarks kept private",
		body: "Only you can see the notebooks you make while signed in.",
	},
	{
		icon: "settings",
		title: "Your settings, everywhere",
		body: "Playback and learning preferences come with you.",
	},
] as const satisfies ReadonlyArray<{
	icon: HugeIconName;
	title: string;
	body: string;
}>;

/** Why sign in: shown beside the sign-in and create-account form. */
function AuthIntroPanel() {
	return (
		<aside
			aria-labelledby="auth-benefits"
			className="relative overflow-hidden border-border border-t bg-muted lg:border-t-0 lg:border-l"
		>
			<div
				aria-hidden="true"
				className="genko-grid absolute inset-0 opacity-60"
			/>
			<div className="relative mx-auto flex h-full max-w-[480px] flex-col justify-center gap-8 px-5 py-12 sm:px-10 lg:py-16">
				<h2
					id="auth-benefits"
					className="text-balance font-semibold font-serif text-[28px] leading-tight tracking-[-0.015em] sm:text-[32px]"
				>
					An account is optional. Your notebooks are worth keeping.
				</h2>
				<ul className="grid gap-5">
					{benefits.map((benefit) => (
						<li key={benefit.title} className="flex gap-3.5">
							<span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card">
								<HugeIcon name={benefit.icon} className="size-4" />
							</span>
							<span className="grid gap-0.5">
								<span className="font-medium">{benefit.title}</span>
								<span className="text-muted-foreground text-sm leading-relaxed">
									{benefit.body}
								</span>
							</span>
						</li>
					))}
				</ul>
				<p className="flex gap-2.5 rounded-md border border-border bg-card p-3.5 text-muted-foreground text-sm leading-relaxed">
					<HugeIcon name="info" className="mt-0.5 size-4 shrink-0" />
					Everything already works without an account. Notebooks and shelves you
					made before signing in move to your account.
				</p>
			</div>
		</aside>
	);
}

export { AuthIntroPanel };
