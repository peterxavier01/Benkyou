import {
	AiVideoIcon,
	AlertCircleIcon,
	ArrowRight01Icon,
	Bookmark02Icon,
	BookOpenCheckIcon,
	CheckmarkCircle01Icon,
	CircleIcon,
	Clock03Icon,
	Home03Icon,
	LibraryIcon,
	ListViewIcon,
	Loading03Icon,
	PlayCircleIcon,
	Refresh01Icon,
	Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

const icons = {
	alertCircle: AlertCircleIcon,
	arrowRight: ArrowRight01Icon,
	aiVideo: AiVideoIcon,
	bookOpenCheck: BookOpenCheckIcon,
	bookmark: Bookmark02Icon,
	checkmarkCircle: CheckmarkCircle01Icon,
	clock: Clock03Icon,
	circle: CircleIcon,
	home: Home03Icon,
	library: LibraryIcon,
	list: ListViewIcon,
	loading: Loading03Icon,
	playCircle: PlayCircleIcon,
	refresh: Refresh01Icon,
	settings: Settings02Icon,
} as const;

type HugeIconName = keyof typeof icons;

function HugeIcon({
	name,
	strokeWidth = 2,
	...props
}: Omit<HugeiconsIconProps, "icon"> & {
	name: HugeIconName;
	className?: string;
}) {
	return (
		<HugeiconsIcon
			aria-hidden="true"
			data-icon="inline"
			icon={icons[name]}
			strokeWidth={strokeWidth}
			{...props}
		/>
	);
}

export { HugeIcon, type HugeIconName };
