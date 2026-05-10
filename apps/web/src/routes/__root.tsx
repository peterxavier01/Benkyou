import { CORE_PROMISE, PRODUCT_NAME } from "@benkyou/core";
import { Button, ContentPanel, HugeIcon } from "@benkyou/ui";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { BrandLogo } from "#components/brand-logo";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: PRODUCT_NAME,
			},
			{
				name: "description",
				content: CORE_PROMISE,
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	notFoundComponent: NotFoundScreen,
	shellComponent: RootDocument,
});

function NotFoundScreen() {
	return (
		<main className="min-h-dvh bg-background text-foreground">
			<div className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-4 py-8">
				<ContentPanel className="w-full p-5 sm:p-7">
					<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
							<HugeIcon name="alertCircle" className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<BrandLogo subtitle={null} />
							<h1 className="mt-2 font-semibold text-2xl tracking-normal">
								Page not found
							</h1>
							<p className="mt-2 max-w-xl text-muted-foreground text-sm leading-6">
								This route does not point to a Benkyou workspace screen. Return
								to your library or start from the course entry flow.
							</p>
							<div className="mt-5 flex flex-wrap gap-2">
								<Button asChild>
									<Link to="/courses" search={{ q: "", filter: "all" }}>
										Open library
									</Link>
								</Button>
								<Button asChild variant="outline">
									<Link to="/">{CORE_PROMISE}</Link>
								</Button>
							</div>
						</div>
					</div>
				</ContentPanel>
			</div>
		</main>
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
