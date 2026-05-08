import { CORE_PROMISE, PRODUCT_NAME } from "@benkyou/core";
import { Button, Input } from "@benkyou/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	BookOpenCheck,
	ListChecks,
	PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<main className="min-h-dvh bg-[#f7f9fb] text-[#191c1e]">
			<section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
				<header className="flex items-center justify-between border-[#d8dadc] border-b py-3">
					<div className="flex items-center gap-2">
						<div className="flex size-8 items-center justify-center rounded-md bg-[#00694c] text-white">
							<BookOpenCheck className="size-4" aria-hidden="true" />
						</div>
						<span className="font-semibold text-lg">{PRODUCT_NAME}</span>
					</div>
					<Button variant="outline" size="sm">
						Sign in
					</Button>
				</header>

				<div className="grid flex-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
					<div className="max-w-3xl">
						<p className="mb-3 font-semibold text-[#00694c] text-sm">
							Local-first learning workspace
						</p>
						<h1 className="max-w-2xl font-semibold text-4xl tracking-normal sm:text-5xl">
							{CORE_PROMISE}
						</h1>
						<p className="mt-4 max-w-2xl text-[#3d4943] text-base leading-7">
							Paste a YouTube URL and Benkyou will prepare chapters, notes,
							bookmarks, and progress tracking for focused study.
						</p>

						<form className="mt-8 max-w-2xl rounded-lg border border-[#bccac1] bg-white p-3 shadow-sm">
							<label htmlFor="course-url" className="sr-only">
								YouTube URL
							</label>
							<div className="flex flex-col gap-3 sm:flex-row">
								<Input
									id="course-url"
									name="url"
									type="url"
									placeholder="Paste a YouTube URL"
									className="h-11 flex-1"
								/>
								<Button type="submit" className="h-11 bg-[#00694c] px-5">
									Generate course
									<ArrowRight className="size-4" aria-hidden="true" />
								</Button>
							</div>
						</form>

						<div className="mt-4 flex flex-wrap items-center gap-3 text-[#3d4943] text-sm">
							<Button type="button" variant="ghost" size="sm" className="px-0">
								<PlayCircle className="size-4" aria-hidden="true" />
								Try sample course
							</Button>
							<span>YouTube supported now. Vimeo and Loom are planned.</span>
						</div>
					</div>

					<aside className="rounded-lg border border-[#d8dadc] bg-white p-5">
						<div className="flex items-center gap-2">
							<ListChecks
								className="size-5 text-[#00694c]"
								aria-hidden="true"
							/>
							<h2 className="font-semibold text-base">MVP learning loop</h2>
						</div>
						<ul className="mt-5 space-y-4 text-[#3d4943] text-sm">
							<li>Generate a course outline from one YouTube video.</li>
							<li>Jump through chapters with a dense course sidebar.</li>
							<li>Write Markdown notes per chapter.</li>
							<li>Save bookmarks and resume where you left off.</li>
						</ul>
					</aside>
				</div>
			</section>
		</main>
	);
}
