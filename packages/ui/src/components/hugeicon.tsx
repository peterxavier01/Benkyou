import {
	Add01Icon,
	Cancel01Icon,
	Database01Icon,
	Github01Icon,
	ServerStack01Icon,
	SmartPhone01Icon,
	UserCircleIcon,
	AiVideoIcon,
	Alert02Icon,
	AlertCircleIcon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	ArrowShrinkIcon,
	Bookmark02Icon,
	BookOpenCheckIcon,
	CheckmarkCircle01Icon,
	CircleIcon,
	Clock03Icon,
	Delete02Icon,
	Download04Icon,
	Edit02Icon,
	FullScreenIcon,
	GoBackward10SecIcon,
	GoForward10SecIcon,
	HardDriveIcon,
	Home03Icon,
	InformationCircleIcon,
	LibraryIcon,
	ListViewIcon,
	Loading03Icon,
	Menu01Icon,
	MoreHorizontalIcon,
	Notebook01Icon,
	NoteIcon,
	PauseIcon,
	PlayCircleIcon,
	PlayIcon,
	Refresh01Icon,
	Search01Icon,
	Settings02Icon,
	Tick02Icon,
	ViewIcon,
	ViewOffIcon,
	VolumeHighIcon,
	VolumeLowIcon,
	VolumeMute02Icon,
	WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

const icons = {
	add: Add01Icon,
	alert: Alert02Icon,
	check: Tick02Icon,
	device: HardDriveIcon,
	download: Download04Icon,
	info: InformationCircleIcon,
	more: MoreHorizontalIcon,
	notebook: Notebook01Icon,
	offline: WifiDisconnected01Icon,
	account: UserCircleIcon,
	close: Cancel01Icon,
	database: Database01Icon,
	github: Github01Icon,
	phone: SmartPhone01Icon,
	server: ServerStack01Icon,
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
	goBackward10Seconds: GoBackward10SecIcon,
	goForward10Seconds: GoForward10SecIcon,
	home: Home03Icon,
	library: LibraryIcon,
	list: ListViewIcon,
	loading: Loading03Icon,
	menu: Menu01Icon,
	minimizeScreen: ArrowShrinkIcon,
	note: NoteIcon,
	pause: PauseIcon,
	play: PlayIcon,
	playCircle: PlayCircleIcon,
	refresh: Refresh01Icon,
	search: Search01Icon,
	settings: Settings02Icon,
	view: ViewIcon,
	viewOff: ViewOffIcon,
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
