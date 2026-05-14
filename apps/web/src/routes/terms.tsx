import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "#/features/static/static-pages";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
});
