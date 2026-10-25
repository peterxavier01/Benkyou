import { LEARNING_PLAYBACK_SPEEDS } from "@benkyou/core";
import type { LearningPreferencesDTO } from "@benkyou/types";
import { cn, Switch } from "@benkyou/ui";
import { SettingsGroup, SettingsRow } from "./settings-parts";

function LearningSection({
	preferences,
	onChange,
}: {
	preferences: LearningPreferencesDTO;
	onChange: (preferences: LearningPreferencesDTO) => void;
}) {
	return (
		<>
			<SettingsGroup title="Playback">
				<SettingsRow
					stack
					label="Default playback speed"
					labelId="playback-speed-label"
					description="Notebooks start at this speed. You can still change it in the player."
					control={
						<fieldset
							aria-labelledby="playback-speed-label"
							className="m-0 flex flex-wrap gap-1.5 border-0 p-0"
						>
							{LEARNING_PLAYBACK_SPEEDS.map((speed) => {
								const checked = preferences.playbackSpeed === speed;
								return (
									<label
										key={speed}
										className={cn(
											"relative inline-flex h-10 min-w-14 cursor-pointer items-center justify-center rounded-md border px-3 font-medium text-sm tabular-nums transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
											checked
												? "border-foreground bg-foreground text-background"
												: "border-input bg-card hover:bg-muted",
										)}
									>
										<input
											type="radio"
											name="playback-speed"
											value={speed}
											checked={checked}
											className="sr-only"
											onChange={() =>
												onChange({ ...preferences, playbackSpeed: speed })
											}
										/>
										{speed}×
									</label>
								);
							})}
						</fieldset>
					}
				/>
				<SettingsRow
					label="Autoplay next chapter"
					labelId="autoplay-label"
					description="Continue into the next chapter when one ends."
					control={
						<Switch
							aria-labelledby="autoplay-label"
							checked={preferences.autoplayNextChapter}
							onCheckedChange={(checked) =>
								onChange({ ...preferences, autoplayNextChapter: checked })
							}
						/>
					}
				/>
			</SettingsGroup>
			<SettingsGroup title="Progress">
				<SettingsRow
					label="Mark chapters done automatically"
					labelId="auto-complete-label"
					description="A chapter counts as done once you’ve watched 90% of it. Turn this off to only mark chapters done yourself."
					control={
						<Switch
							aria-labelledby="auto-complete-label"
							checked={!preferences.manualCompletionOnly}
							onCheckedChange={(checked) =>
								onChange({ ...preferences, manualCompletionOnly: !checked })
							}
						/>
					}
				/>
			</SettingsGroup>
		</>
	);
}

export { LearningSection };
