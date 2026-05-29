import {
	LOCAL_STORAGE_KEYS,
	LOCAL_STORAGE_PAYLOAD_VERSION,
	learningPreferencesSchema,
} from "@benkyou/core";
import type { LearningPreferencesDTO } from "@benkyou/types";

export function readLocalPreferences() {
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

export function writeLocalPreferences(preferences: LearningPreferencesDTO) {
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
