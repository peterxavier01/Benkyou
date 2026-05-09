import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "#/features/course-generation/components/home-screen";

export const Route = createFileRoute("/")({ component: HomeScreen });
