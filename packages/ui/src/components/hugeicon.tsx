import {
	AiVideoIcon,
	AlertCircleIcon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Bookmark02Icon,
	BookOpenCheckIcon,
	CheckmarkCircle01Icon,
	CircleIcon,
	Clock03Icon,
	Delete02Icon,
	Edit02Icon,
	FullScreenIcon,
	Home03Icon,
	LibraryIcon,
	ListViewIcon,
	Loading03Icon,
	Menu01Icon,
	MinimizeScreenIcon,
	NoteIcon,
	PauseIcon,
	PlayCircleIcon,
	PlayIcon,
	Refresh01Icon,
	Search01Icon,
	Settings02Icon,
	VolumeHighIcon,
	VolumeLowIcon,
	VolumeMute02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

const icons = {
	alertCircle: AlertCircleIcon,
	arrowLeft: ArrowLeft01Icon,
	arrowRight: ArrowRight01Icon,
	aiVideo: AiVideoIcon,
	bookOpenCheck: BookOpenCheckIcon,
	bookmark: Bookmark02Icon,
	checkmarkCircle: CheckmarkCircle01Icon,
	clock: Clock03Icon,
	circle: CircleIcon,
	delete: Delete02Icon,
	edit: Edit02Icon,
	fullScreen: FullScreenIcon,
	home: Home03Icon,
	library: LibraryIcon,
	list: ListViewIcon,
	loading: Loading03Icon,
	menu: Menu01Icon,
	minimizeScreen: MinimizeScreenIcon,
	note: NoteIcon,
	pause: PauseIcon,
	play: PlayIcon,
	playCircle: PlayCircleIcon,
	refresh: Refresh01Icon,
	search: Search01Icon,
	settings: Settings02Icon,
	volumeHigh: VolumeHighIcon,
	volumeLow: VolumeLowIcon,
	volumeMuted: VolumeMute02Icon,
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
