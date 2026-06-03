import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AnalyticsProvider } from "#/integrations/posthog/analytics-provider";
import { AppRecoveryScreen } from "#components/app-recovery-screen";
import { GlobalErrorScreen } from "#components/global-error-screen";
import { buildSeoHead } from "#lib/seo";
import appCss from "../styles.css?url";

const AppDevtools = import.meta.env.DEV
	? lazy(() => import("../integrations/tanstack-query/devtools"))
	: null;

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => {
		const seo = buildSeoHead({ canonical: false });

		return {
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				...seo.meta,
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
				...seo.links,
			],
		};
	},
	errorComponent: GlobalErrorScreen,
	notFoundComponent: NotFoundScreen,
	shellComponent: RootDocument,
});

function NotFoundScreen() {
	return (
		<AppRecoveryScreen
			title="Page not found"
			description="This route does not point to a Benkyou screen. Return to your library, create a course, or review the project context."
		/>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<AnalyticsProvider>{children}</AnalyticsProvider>
				{AppDevtools ? (
					<Suspense fallback={null}>
						<AppDevtools />
					</Suspense>
				) : null}
				<Scripts />
			</body>
		</html>
	);
}
