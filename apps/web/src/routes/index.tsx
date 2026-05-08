import { CORE_PROMISE, PRODUCT_NAME } from "@benkyou/core";
import {
	AppMain,
	AppShell,
	AppSidebar,
	AppSidebarHeader,
	AppSidebarNav,
	AppSidebarNavItem,
	AppTopBar,
	Button,
	ContentPanel,
	HugeIcon,
	Input,
	Progress,
	StatusBadge,
} from "@benkyou/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<AppShell>
			<AppSidebar>
				<AppSidebarHeader>
					<div className="flex items-center gap-2">
						<div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<HugeIcon name="bookOpenCheck" className="size-4" />
						</div>
						<div>
							<p className="font-semibold text-sm">{PRODUCT_NAME}</p>
							<p className="text-muted-foreground text-xs">
								Learning workspace
							</p>
						</div>
					</div>
				</AppSidebarHeader>
				<AppSidebarNav aria-label="Primary navigation">
					<AppSidebarNavItem href="/" active>
						<HugeIcon name="home" />
						Home
					</AppSidebarNavItem>
					<AppSidebarNavItem href="/courses">
						<HugeIcon name="library" />
						Courses
					</AppSidebarNavItem>
					<AppSidebarNavItem href="/bookmarks">
						<HugeIcon name="bookmark" />
						Bookmarks
					</AppSidebarNavItem>
					<AppSidebarNavItem href="/settings">
						<HugeIcon name="settings" />
						Settings
					</AppSidebarNavItem>
				</AppSidebarNav>
			</AppSidebar>

			<AppMain>
				<AppTopBar>
					<div className="flex min-w-0 items-center gap-2">
						<div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground md:hidden">
							<HugeIcon name="bookOpenCheck" className="size-4" />
						</div>
						<div className="min-w-0">
							<p className="truncate font-semibold text-sm">{PRODUCT_NAME}</p>
							<p className="hidden text-muted-foreground text-xs sm:block">
								Turn one video into a course you can return to.
							</p>
						</div>
					</div>
					<Button variant="outline" size="sm">
						Sign in
					</Button>
				</AppTopBar>

				<section className="mx-auto grid w-full max-w-7xl gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
					<ContentPanel className="flex min-h-[520px] flex-col justify-center p-5 sm:p-8">
						<div className="max-w-3xl">
							<StatusBadge tone="success">Local-first MVP</StatusBadge>
							<h1 className="mt-4 max-w-2xl font-semibold text-3xl tracking-normal sm:text-4xl">
								{CORE_PROMISE}
							</h1>
							<p className="mt-4 max-w-2xl text-muted-foreground text-base leading-7">
								Paste a YouTube URL and Benkyou will prepare chapters, notes,
								bookmarks, and progress tracking for focused study.
							</p>

							<form className="mt-8 max-w-2xl rounded-lg border border-border bg-background p-3">
								<label htmlFor="course-url" className="sr-only">
									YouTube URL
								</label>
								<div className="flex flex-col gap-3 sm:flex-row">
									<Input
										id="course-url"
										name="url"
										type="url"
										placeholder="Paste a YouTube URL"
										className="h-10 flex-1 bg-card"
									/>
									<Button type="submit" className="h-10 px-4">
										Generate course
										<HugeIcon name="arrowRight" className="size-4" />
									</Button>
								</div>
							</form>

							<div className="mt-4 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="px-0"
								>
									<HugeIcon name="playCircle" className="size-4" />
									Try sample course
								</Button>
								<span>YouTube supported now. Vimeo and Loom are planned.</span>
							</div>
						</div>
					</ContentPanel>

					<ContentPanel className="p-5">
						<div className="flex items-center gap-2">
							<HugeIcon name="list" className="size-5 text-primary" />
							<h2 className="font-semibold text-base">MVP learning loop</h2>
						</div>
						<div className="mt-5 space-y-4">
							<div>
								<div className="mb-2 flex items-center justify-between text-sm">
									<span className="font-medium">Sample course readiness</span>
									<span className="text-muted-foreground">64%</span>
								</div>
								<Progress value={64} />
							</div>
							<ul className="space-y-3 text-muted-foreground text-sm">
								<li className="flex gap-2">
									<HugeIcon
										name="clock"
										className="mt-0.5 size-4 shrink-0 text-primary"
									/>
									<span>Generate a course outline from one YouTube video.</span>
								</li>
								<li className="flex gap-2">
									<HugeIcon
										name="clock"
										className="mt-0.5 size-4 shrink-0 text-primary"
									/>
									<span>
										Jump through chapters with a dense course sidebar.
									</span>
								</li>
								<li className="flex gap-2">
									<HugeIcon
										name="clock"
										className="mt-0.5 size-4 shrink-0 text-primary"
									/>
									<span>Write Markdown notes per chapter.</span>
								</li>
								<li className="flex gap-2">
									<HugeIcon
										name="clock"
										className="mt-0.5 size-4 shrink-0 text-primary"
									/>
									<span>Save bookmarks and resume where you left off.</span>
								</li>
							</ul>
						</div>
					</ContentPanel>
				</section>
			</AppMain>
		</AppShell>
	);
}
