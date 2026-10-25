import { DEFAULT_LEARNING_PREFERENCES } from "@benkyou/core";
import type {
	GetCourseLibraryResponseV1,
	GetLearningPreferencesResponseV1,
	LearningPreferencesDTO,
} from "@benkyou/types";
import {
	SaveStatus,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@benkyou/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
	courseLibraryQueryOptions,
	learningPreferencesQueryOptions,
	workspaceQueryKeys,
} from "#/features/workspace/workspace.queries";
import { trackAnalyticsEvent } from "#/integrations/posthog/analytics";
import { WorkspacePage } from "#components/workspace-layout";
import {
	exportCourseMarkdown,
	updateLearningPreferences,
} from "../course-workspace.functions";
import {
	readLocalPreferences,
	writeLocalPreferences,
} from "../learning-preferences.local";
import { AccountSection } from "./settings/account-section";
import { DataSection } from "./settings/data-section";
import { LearningSection } from "./settings/learning-section";
import type { SettingsUser } from "./settings/settings-types";

type SettingsTab = "account" | "learning" | "data";

const tabs: { value: SettingsTab; label: string }[] = [
	{ value: "account", label: "Account" },
	{ value: "learning", label: "Learning" },
	{ value: "data", label: "Your data" },
];

interface SettingsScreenProps {
	currentUser: SettingsUser;
	initialLibrary: GetCourseLibraryResponseV1;
	initialPreferences: GetLearningPreferencesResponseV1;
	tab: SettingsTab;
	onTabChange: (tab: SettingsTab) => void;
}

function SettingsScreen({
	currentUser,
	initialLibrary,
	initialPreferences,
	tab,
	onTabChange,
}: SettingsScreenProps) {
	const queryClient = useQueryClient();
	const updatePreferences = useServerFn(updateLearningPreferences);
	const exportCourse = useServerFn(exportCourseMarkdown);
	const [draftPreferences, setDraftPreferences] =
		useState<LearningPreferencesDTO | null>(() => readLocalPreferences());
	const [exportPending, setExportPending] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	const libraryQuery = useQuery({
		...courseLibraryQueryOptions(),
		initialData: initialLibrary,
	});
	const preferencesQuery = useQuery({
		...learningPreferencesQueryOptions(),
		initialData: initialPreferences,
	});

	const preferences =
		draftPreferences ??
		preferencesQuery.data.preferences ??
		DEFAULT_LEARNING_PREFERENCES;

	const preferencesMutation = useMutation({
		mutationFn: (next: LearningPreferencesDTO) =>
			updatePreferences({ data: next }),
		onSuccess: (result) => {
			trackAnalyticsEvent("learning_preferences_updated", {
				playback_speed: result.preferences.playbackSpeed,
			});
			writeLocalPreferences(result.preferences);
			queryClient.setQueryData(workspaceQueryKeys.learningPreferences, result);
		},
	});

	function handlePreferencesChange(next: LearningPreferencesDTO) {
		setDraftPreferences(next);
		preferencesMutation.mutate(next);
	}

	async function handleExport(courseId: string) {
		setExportError(null);
		setExportPending(true);
		try {
			const result = await exportCourse({ data: { courseId } });
			trackAnalyticsEvent("course_exported", { source: "settings" });
			downloadText(result.filename, result.markdown);
		} catch (error) {
			setExportError(
				error instanceof Error ? error.message : "The export didn’t finish.",
			);
		}
		setExportPending(false);
	}

	return (
		<WorkspacePage
			title="Settings"
			description="Your account, how the player behaves, and your data."
			maxWidth="narrow"
		>
			<Tabs
				value={tab}
				onValueChange={(value) => onTabChange(value as SettingsTab)}
				className="flex-col gap-6"
			>
				<div className="flex flex-wrap items-center justify-between gap-3 border-border border-b">
					<TabsList variant="line" className="h-11 w-full sm:w-fit">
						{tabs.map((item) => (
							<TabsTrigger
								key={item.value}
								value={item.value}
								className="h-11 px-4 text-sm"
							>
								{item.label}
							</TabsTrigger>
						))}
					</TabsList>
					{tab === "learning" ? (
						<PreferencesStatus
							pending={preferencesMutation.isPending}
							error={preferencesMutation.error}
							saved={preferencesMutation.isSuccess}
						/>
					) : null}
				</div>
				<TabsContent value="account" className="grid gap-8">
					<AccountSection currentUser={currentUser} />
				</TabsContent>
				<TabsContent value="learning" className="grid gap-8">
					<LearningSection
						preferences={preferences}
						onChange={handlePreferencesChange}
					/>
				</TabsContent>
				<TabsContent value="data" className="grid gap-8">
					<DataSection
						currentUser={currentUser}
						notebooks={libraryQuery.data.items}
						exportPending={exportPending}
						exportError={exportError}
						onExport={(courseId) => void handleExport(courseId)}
						onResetBrowserData={() => {
							resetBrowserData();
							trackAnalyticsEvent("local_data_reset");
							setDraftPreferences(null);
						}}
					/>
				</TabsContent>
			</Tabs>
		</WorkspacePage>
	);
}

function PreferencesStatus({
	pending,
	error,
	saved,
}: {
	pending: boolean;
	error: Error | null;
	saved: boolean;
}) {
	const tone = pending ? "saving" : error ? "error" : saved ? "saved" : "info";
	const text = pending
		? "Saving…"
		: error
			? "Couldn’t save. Try again."
			: saved
				? "Saved"
				: "Changes save automatically";

	return (
		<div aria-live="polite" className="pb-2 sm:pb-0">
			<SaveStatus tone={tone}>{text}</SaveStatus>
		</div>
	);
}

/** Removes everything Benkyou keeps in this browser, including note drafts. */
function resetBrowserData() {
	const keys: string[] = [];
	for (let index = 0; index < window.localStorage.length; index += 1) {
		const key = window.localStorage.key(index);
		if (key?.startsWith("benkyou:")) {
			keys.push(key);
		}
	}
	for (const key of keys) {
		window.localStorage.removeItem(key);
	}
}

function downloadText(filename: string, text: string) {
	const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

export { SettingsScreen, type SettingsTab };
