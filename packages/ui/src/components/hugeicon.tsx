import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  BookOpenCheckIcon,
  Bookmark02Icon,
  Clock03Icon,
  Home03Icon,
  LibraryIcon,
  ListViewIcon,
  PlayCircleIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

const icons = {
  arrowRight: ArrowRight01Icon,
  bookOpenCheck: BookOpenCheckIcon,
  bookmark: Bookmark02Icon,
  clock: Clock03Icon,
  home: Home03Icon,
  library: LibraryIcon,
  list: ListViewIcon,
  playCircle: PlayCircleIcon,
  settings: Settings02Icon,
} as const;

type HugeIconName = keyof typeof icons;

function HugeIcon({
  name,
  strokeWidth = 2,
  ...props
}: Omit<HugeiconsIconProps, "icon"> & {
  name: HugeIconName;
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
