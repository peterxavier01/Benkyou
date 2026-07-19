import { LEARNING_PLAYBACK_SPEEDS } from "@benkyou/core";
import {
	Button,
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	HugeIcon,
	Slider,
} from "@benkyou/ui";

interface PlayerMobileSettingsProps {
	muted: boolean;
	onMutedChange: (muted: boolean) => void;
	onPlaybackSpeedChange: (speed: number) => void;
	onVolumeChange: (volume: number) => void;
	pending?: boolean;
	playbackSpeed: number;
	portalContainer?: HTMLElement | null;
	volume: number;
}

function PlayerMobileSettings({
	muted,
	onMutedChange,
	onPlaybackSpeedChange,
	onVolumeChange,
	pending,
	playbackSpeed,
	portalContainer,
	volume,
}: PlayerMobileSettingsProps) {
	const effectiveMuted = muted || volume === 0;
	const volumeLabel = effectiveMuted ? "Muted" : `${volume}%`;

	return (
		<Drawer>
			<DrawerTrigger asChild>
				<Button
					aria-label="Playback settings"
					className="size-11"
					size="icon-lg"
					type="button"
					variant="outline"
				>
					<HugeIcon name="settings" className="size-5" />
				</Button>
			</DrawerTrigger>
			<DrawerContent
				className="overflow-hidden"
				portalContainer={portalContainer}
			>
				<DrawerHeader className="shrink-0 text-left">
					<DrawerTitle>Playback settings</DrawerTitle>
					<DrawerDescription>
						Adjust audio and playback speed.
					</DrawerDescription>
				</DrawerHeader>

				<div
					data-vaul-no-drag
					className="grid min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain px-4 pb-2"
					style={{ touchAction: "pan-y" }}
				>
					<section className="grid gap-3" aria-labelledby="volume-heading">
						<div className="flex items-center justify-between gap-3">
							<h3 id="volume-heading" className="font-medium text-sm">
								Volume
							</h3>
							<span className="text-muted-foreground text-sm tabular-nums">
								{volumeLabel}
							</span>
						</div>
						<div className="flex items-center gap-3">
							<Button
								aria-label={effectiveMuted ? "Unmute player" : "Mute player"}
								className="size-11"
								onClick={() => onMutedChange(!effectiveMuted)}
								size="icon-lg"
								type="button"
								variant="outline"
							>
								<HugeIcon
									name={effectiveMuted ? "volumeMuted" : "volumeHigh"}
									className="size-5"
								/>
							</Button>
							<Slider
								aria-label="Player volume"
								className="h-11 flex-1 cursor-pointer **:data-[slot=slider-thumb]:size-5 **:data-[slot=slider-track]:h-2"
								max={100}
								min={0}
								step={1}
								style={{ touchAction: "pan-y" }}
								value={[volume]}
								onValueChange={(values) => onVolumeChange(values[0] ?? volume)}
							/>
						</div>
					</section>

					<section className="grid gap-3" aria-labelledby="speed-heading">
						<div className="flex items-center justify-between gap-3">
							<h3 id="speed-heading" className="font-medium text-sm">
								Playback speed
							</h3>
							<span className="text-muted-foreground text-sm tabular-nums">
								{playbackSpeed}x
							</span>
						</div>
						<div className="grid grid-cols-4 gap-2">
							{LEARNING_PLAYBACK_SPEEDS.map((speed) => (
								<Button
									aria-pressed={speed === playbackSpeed}
									className="min-h-11 px-2 tabular-nums"
									disabled={pending}
									key={speed}
									onClick={() => onPlaybackSpeedChange(speed)}
									type="button"
									variant={speed === playbackSpeed ? "secondary" : "outline"}
								>
									{speed}x
								</Button>
							))}
						</div>
					</section>
				</div>

				<DrawerFooter className="shrink-0">
					<DrawerClose asChild>
						<Button className="min-h-11" type="button">
							Done
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

export { PlayerMobileSettings };
