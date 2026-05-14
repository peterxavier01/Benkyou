import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "#/features/static/static-pages";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
});
