import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { AppRecoveryScreen } from "#components/app-recovery-screen";
import { GlobalErrorScreen } from "#components/global-error-screen";
import { buildSeoHead } from "#lib/seo";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

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
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
