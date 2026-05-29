import { LEARNING_PLAYBACK_SPEEDS } from "@benkyou/core";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@benkyou/ui";

interface PlayerPlaybackSpeedMenuProps {
	disabled?: boolean;
	onPlaybackSpeedChange: (speed: number) => void;
	pending?: boolean;
	playbackSpeed: number;
}

function PlayerPlaybackSpeedMenu({
	disabled,
	onPlaybackSpeedChange,
	pending,
	playbackSpeed,
}: PlayerPlaybackSpeedMenuProps) {
	const formattedSpeed = formatPlaybackSpeed(playbackSpeed);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-busy={pending || undefined}
					aria-label={`Playback speed, ${formattedSpeed}`}
					className="min-w-14 px-2 font-semibold tabular-nums"
					disabled={disabled || pending}
					size="sm"
					type="button"
					variant="outline"
				>
					{formattedSpeed}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-32">
				<DropdownMenuLabel>Speed</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup
					value={String(playbackSpeed)}
					onValueChange={(value) => onPlaybackSpeedChange(Number(value))}
				>
					{LEARNING_PLAYBACK_SPEEDS.map((speed) => (
						<DropdownMenuRadioItem key={speed} value={String(speed)}>
							{formatPlaybackSpeed(speed)}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function formatPlaybackSpeed(speed: number) {
	return `${speed}x`;
}

export { PlayerPlaybackSpeedMenu };
