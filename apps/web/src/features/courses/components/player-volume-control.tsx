import { Button, HugeIcon, Slider } from "@benkyou/ui";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@benkyou/ui/components/popover";

interface PlayerVolumeControlProps {
	muted: boolean;
	onMutedChange: (muted: boolean) => void;
	onVolumeChange: (volume: number) => void;
	volume: number;
}

function PlayerVolumeControl({
	muted,
	onMutedChange,
	onVolumeChange,
	volume,
}: PlayerVolumeControlProps) {
	const effectiveMuted = muted || volume === 0;
	const iconName = effectiveMuted
		? "volumeMuted"
		: volume < 50
			? "volumeLow"
			: "volumeHigh";
	const volumeLabel = effectiveMuted ? "Muted" : `${volume}%`;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					aria-label={`Volume, ${volumeLabel}`}
					size="icon-sm"
					type="button"
					variant="outline"
				>
					<HugeIcon name={iconName} className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-52 p-3">
				<div className="flex items-center justify-between gap-3">
					<Button
						aria-label={effectiveMuted ? "Unmute player" : "Mute player"}
						size="icon-sm"
						type="button"
						variant="ghost"
						onClick={() => onMutedChange(!effectiveMuted)}
					>
						<HugeIcon name={iconName} className="size-4" />
					</Button>
					<span className="min-w-12 text-right text-muted-foreground text-xs tabular-nums">
						{volumeLabel}
					</span>
				</div>
				<Slider
					aria-label="Player volume"
					className="mt-2 h-6 cursor-pointer **:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-track]:h-2"
					max={100}
					min={0}
					step={1}
					value={[volume]}
					onValueChange={(values) => onVolumeChange(values[0] ?? volume)}
				/>
			</PopoverContent>
		</Popover>
	);
}

export { PlayerVolumeControl };
