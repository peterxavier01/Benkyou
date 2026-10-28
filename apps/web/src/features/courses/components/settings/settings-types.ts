import type { getCurrentUser } from "../../../auth/auth.functions";

type SettingsUser = Awaited<ReturnType<typeof getCurrentUser>>;

export type { SettingsUser };
