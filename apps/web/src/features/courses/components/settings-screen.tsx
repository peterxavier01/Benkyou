import {
	DEFAULT_LEARNING_PREFERENCES,
	LEARNING_PLAYBACK_SPEEDS,
	LOCAL_STORAGE_KEYS,
	LOCAL_STORAGE_PAYLOAD_VERSION,
	learningPreferencesSchema,
} from "@benkyou/core";
import type {
	GetCourseLibraryResponseV1,
	GetLearningPreferencesResponseV1,
	LearningPreferencesDTO,
} from "@benkyou/types";
import {
	Button,
	ContentPanel,
	HugeIcon,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	StatusBadge,
	Switch,
} from "@benkyou/ui";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@benkyou/ui/components/alert-dialog";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { WorkspacePage } from "#components/workspace-layout";
import type { getCurrentUser } from "../../auth/auth.functions";
import {
	exportCourseMarkdown,
	getCourseLibrary,
	getLearningPreferences,
	updateLearningPreferences,
} from "../course-workspace.functions";

interface SettingsScreenProps {
	currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
	initialLibrary: GetCourseLibraryResponseV1;
	initialPreferences: GetLearningPreferencesResponseV1;
}

function SettingsScreen({
	currentUser,
	initialLibrary,
	initialPreferences,
}: SettingsScreenProps) {
	const queryClient = useQueryClient();
	const getLibrary = useServerFn(getCourseLibrary);
	const getPreferences = useServerFn(getLearningPreferences);
	const updatePreferences = useServerFn(updateLearningPreferences);
	const exportCourse = useServerFn(exportCourseMarkdown);
	const [localPreferences, setLocalPreferences] =
		useState<LearningPreferencesDTO | null>(null);
	const [exportCourseId, setExportCourseId] = useState<string>("");
	const [resetDone, setResetDone] = useState(false);

	const libraryQuery = useQuery({
		queryKey: ["course-library"],
		queryFn: () => getLibrary(),
		initialData: initialLibrary,
	});
	const preferencesQuery = useQuery({
		queryKey: ["learning-preferences"],
		queryFn: () => getPreferences(),
		initialData: initialPreferences,
	});
	const courses = libraryQuery.data.items;

	useEffect(() => {
		setLocalPreferences(readLocalPreferences());
	}, []);

	const effectivePreferences = useMemo(
		() =>
			localPreferences ??
			preferencesQuery.data.preferences ??
			DEFAULT_LEARNING_PREFERENCES,
		[localPreferences, preferencesQuery.data.preferences],
	);

	useEffect(() => {
		if (!exportCourseId && courses[0]) {
			setExportCourseId(courses[0].course.id);
		}
	}, [courses, exportCourseId]);

	const preferencesMutation = useMutation({
		mutationFn: (preferences: LearningPreferencesDTO) =>
			updatePreferences({ data: preferences }),
		onSuccess: async (result) => {
			writeLocalPreferences(result.preferences);
			setLocalPreferences(result.preferences);
			await queryClient.invalidateQueries({
				queryKey: ["learning-preferences"],
			});
		},
	});

	const exportMutation = useMutation({
		mutationFn: (courseId: string) => exportCourse({ data: { courseId } }),
		onSuccess: (result) => downloadText(result.filename, result.markdown),
	});

	return (
		<WorkspacePage
			title="Settings"
			description="Account state, learning preferences, and data ownership."
			maxWidth="narrow"
		>
			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<StatusBadge tone={currentUser ? "success" : "warning"}>
							{currentUser ? "Signed in" : "Local session"}
						</StatusBadge>
						<h1 className="mt-3 font-semibold text-2xl tracking-normal">
							{currentUser?.name ?? "Local learner"}
						</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							{currentUser?.email ??
								"Preferences and learning data stay on this device until sign-in."}
						</p>
					</div>
					{currentUser ? null : (
						<Button asChild size="sm">
							<Link to="/sign-in" search={{ redirect: "/settings" }}>
								Sign in for sync
							</Link>
						</Button>
					)}
				</div>
			</ContentPanel>

			<LearningPreferencesForm
				key={JSON.stringify(effectivePreferences)}
				preferences={effectivePreferences}
				pending={preferencesMutation.isPending}
				error={preferencesMutation.error}
				onSubmit={(preferences) => preferencesMutation.mutate(preferences)}
			/>

			<ContentPanel className="overflow-hidden p-4 sm:p-5">
				<div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] lg:items-end">
					<div className="min-w-0">
						<h2 className="font-semibold text-base">Data export</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							Export one course as Markdown with chapters, notes, and bookmarks.
						</p>
					</div>
					<div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
						<Select value={exportCourseId} onValueChange={setExportCourseId}>
							<SelectTrigger className="w-full min-w-0 **:data-[slot=select-value]:min-w-0 **:data-[slot=select-value]:truncate">
								<SelectValue placeholder="Select course" />
							</SelectTrigger>
							<SelectContent className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]">
								{courses.map((item) => (
									<SelectItem key={item.course.id} value={item.course.id}>
										<span className="block truncate">{item.course.title}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							type="button"
							disabled={!exportCourseId || exportMutation.isPending}
							onClick={() => exportMutation.mutate(exportCourseId)}
						>
							<HugeIcon name="note" className="size-4" />
							{exportMutation.isPending ? "Exporting..." : "Export"}
						</Button>
					</div>
				</div>
				{courses.length === 0 ? (
					<p className="mt-3 text-muted-foreground text-sm">
						Create or open a sample course before exporting.
					</p>
				) : null}
			</ContentPanel>

			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="font-semibold text-base">Local data</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							Reset local courses, progress, notes, bookmarks, and preferences
							on this device.
						</p>
						{resetDone ? (
							<p className="mt-2 text-primary text-sm">Local data reset.</p>
						) : null}
					</div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button type="button" variant="outline">
								Reset local data
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Reset local data?</AlertDialogTitle>
								<AlertDialogDescription>
									This clears Benkyou data stored in this browser. Signed-in
									server data is not deleted.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									onClick={() => {
										resetLocalData();
										setLocalPreferences(null);
										setResetDone(true);
									}}
								>
									Reset
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</ContentPanel>

			<ContentPanel className="p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="font-semibold text-base">Self-hosting</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							Review deployment requirements and environment setup.
						</p>
					</div>
					<Button asChild variant="outline">
						<Link to="/self-hosting">Open guide</Link>
					</Button>
				</div>
			</ContentPanel>
		</WorkspacePage>
	);
}

function LearningPreferencesForm({
	error,
	onSubmit,
	pending,
	preferences,
}: {
	error: Error | null;
	onSubmit: (preferences: LearningPreferencesDTO) => void;
	pending: boolean;
	preferences: LearningPreferencesDTO;
}) {
	const form = useForm({
		defaultValues: preferences,
		validators: {
			onSubmit: ({ value }) => {
				const result = learningPreferencesSchema.safeParse(value);

				return result.success ? undefined : { form: "Check preferences." };
			},
		},
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<ContentPanel className="p-4 sm:p-5">
			<h2 className="font-semibold text-base">Learning preferences</h2>
			<p className="mt-1 text-muted-foreground text-sm">
				Choose how the course player behaves during study.
			</p>
			{error ? (
				<p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
					{error.message}
				</p>
			) : null}
			<form
				className="mt-4 grid gap-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="playbackSpeed">
					{(field) => (
						<div className="grid gap-2">
							<Label>Default playback speed</Label>
							<Select
								value={String(field.state.value)}
								onValueChange={(value) => field.handleChange(Number(value))}
							>
								<SelectTrigger className="w-full sm:w-52">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{LEARNING_PLAYBACK_SPEEDS.map((speed) => (
										<SelectItem key={speed} value={String(speed)}>
											{speed}x
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</form.Field>
				<form.Field name="manualCompletionOnly">
					{(field) => (
						<PreferenceSwitch
							checked={field.state.value}
							label="Manual completion only"
							description="Do not automatically mark chapters complete at 90% watched."
							onCheckedChange={field.handleChange}
						/>
					)}
				</form.Field>
				<form.Field name="autoplayNextChapter">
					{(field) => (
						<PreferenceSwitch
							checked={field.state.value}
							label="Autoplay next chapter"
							description="Continue into the next chapter when a chapter ends."
							onCheckedChange={field.handleChange}
						/>
					)}
				</form.Field>
				<div className="flex justify-end">
					<Button type="submit" disabled={pending}>
						{pending ? "Saving..." : "Save preferences"}
					</Button>
				</div>
			</form>
		</ContentPanel>
	);
}

function PreferenceSwitch({
	checked,
	description,
	label,
	onCheckedChange,
}: {
	checked: boolean;
	description: string;
	label: string;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
			<div>
				<p className="font-medium text-sm">{label}</p>
				<p className="mt-1 text-muted-foreground text-xs">{description}</p>
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}

function readLocalPreferences() {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const raw = window.localStorage.getItem(LOCAL_STORAGE_KEYS.preferences);
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw) as {
			version?: number;
			preferences?: unknown;
		};
		const result = learningPreferencesSchema.safeParse(parsed.preferences);

		return parsed.version === LOCAL_STORAGE_PAYLOAD_VERSION && result.success
			? result.data
			: null;
	} catch {
		return null;
	}
}

function writeLocalPreferences(preferences: LearningPreferencesDTO) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(
		LOCAL_STORAGE_KEYS.preferences,
		JSON.stringify({
			version: LOCAL_STORAGE_PAYLOAD_VERSION,
			preferences,
			updatedAt: new Date().toISOString(),
		}),
	);
}

function resetLocalData() {
	for (const key of Object.values(LOCAL_STORAGE_KEYS)) {
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

export { SettingsScreen };
