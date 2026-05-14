import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "#/features/static/static-pages";

export const Route = createFileRoute("/about")({
	component: AboutPage,
});
