import { ContentPanel, cn, HugeIcon } from "@benkyou/ui";
import type { ReactNode } from "react";
import { PublicPage, PublicPageIntro } from "#components/public-site";

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

/** Long-form text page, used for Privacy and Terms. */
function PublicContentPage({
	children,
	description,
	eyebrow,
	title,
}: PublicContentPageProps) {
	return (
		<PublicPage>
			<PublicPageIntro eyebrow={eyebrow} title={title}>
				{description}
			</PublicPageIntro>
			<div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-10 sm:px-6 sm:py-14">
				{children}
			</div>
		</PublicPage>
	);
}

function PublicSection({
	children,
	className,
	description,
	title,
}: PublicSectionProps) {
	return (
		<ContentPanel className={cn("p-5 sm:p-6", className)}>
			<div className="grid gap-3">
				<div>
					<h2 className="font-semibold font-serif text-xl">{title}</h2>
					{description ? (
						<p className="mt-1 text-muted-foreground text-sm leading-6">
							{description}
						</p>
					) : null}
				</div>
				<div className="grid gap-3 text-[15px] leading-relaxed">{children}</div>
			</div>
		</ContentPanel>
	);
}

function PublicCallout({ children }: { children: ReactNode }) {
	return (
		<div className="flex gap-2.5 rounded-md bg-muted p-3.5">
			<HugeIcon
				name="info"
				className="mt-0.5 size-4 shrink-0 text-muted-foreground"
			/>
			<p className="text-muted-foreground text-sm leading-6">{children}</p>
		</div>
	);
}

export { PublicCallout, PublicContentPage, PublicSection };
