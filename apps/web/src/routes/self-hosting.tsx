import { createFileRoute } from "@tanstack/react-router";
import { SelfHostingPage } from "#/features/static/static-pages";

export const Route = createFileRoute("/self-hosting")({
	component: SelfHostingPage,
});
