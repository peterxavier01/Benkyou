import type { CourseLibraryItemDTO } from "@benkyou/types";
import { ContentPanel, HugeIcon } from "@benkyou/ui";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@benkyou/ui/components/empty";
import type { ReactNode } from "react";
import { Thumbnail } from "#/features/courses/components/library/library-rows";

/** Up to three overlapping thumbnails, so a shelf reads as a stack. */
function ShelfCovers({ notebooks }: { notebooks: CourseLibraryItemDTO[] }) {
	const covers = notebooks.slice(0, 3);

	if (covers.length === 0) {
		return (
			<span
				aria-hidden="true"
				className="flex aspect-video w-[72px] shrink-0 items-center justify-center rounded border border-input border-dashed text-muted-foreground sm:w-24"
			>
				<HugeIcon name="library" className="size-4" />
			</span>
		);
	}

	return (
		<span
			aria-hidden="true"
			className="relative block w-[84px] shrink-0 sm:w-[108px]"
		>
			{covers.map((item, index) => (
				<span
					key={item.course.id}
					className="absolute top-0 block rounded shadow-[0_0_0_2px_var(--card)]"
					style={{ left: index * 6, zIndex: 3 - index, top: index * 3 }}
				>
					<Thumbnail
						url={item.video.thumbnailUrl}
						className="w-[72px] sm:w-24"
					/>
				</span>
			))}
			<span className="invisible block">
				<Thumbnail url={null} className="w-[72px] sm:w-24" />
			</span>
		</span>
	);
}

function ShelvesEmpty({
	title,
	children,
	action,
}: {
	title: string;
	children: ReactNode;
	action: ReactNode;
}) {
	return (
		<ContentPanel className="genko-grid p-8 sm:p-12">
			<Empty>
				<EmptyHeader>
					<EmptyTitle className="font-serif text-2xl">{title}</EmptyTitle>
					<EmptyDescription>{children}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>{action}</EmptyContent>
			</Empty>
		</ContentPanel>
	);
}

export { ShelfCovers, ShelvesEmpty };
