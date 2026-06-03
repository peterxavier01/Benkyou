# MVP Implementation Checklist

This checklist turns the Benkyou MVP docs into an execution plan. It covers the
features, product logic, UI states, data model, and verification needed to ship
the first usable version: paste a YouTube URL, generate a structured course,
watch with chapters, take notes, save bookmarks, and resume progress.

## MVP Scope

The MVP is a learning workspace, not a marketing site. The first screen should
let a learner paste a video URL and start building a course.

Included:

- YouTube URL ingestion.
- Creator timestamps first, with AI-generated chapter fallback from transcript
  data.
- Course generation status screen.
- Course library.
- Course player with chapter navigation.
- Per-chapter Markdown notes.
- Progress and resume position.
- Bookmarks.
- Basic account/sign-in flow for hosted sync readiness.
- Static trust pages needed for launch.
- Self-hostable database and deployment foundation.

Deferred:

- Collections and multi-video courses.
- Creator marketplace and paid courses.
- Quizzes, flashcards, certificates, and spaced repetition.
- Teams, LMS, SSO, billing, and institutional analytics.
- Vimeo and Loom ingestion beyond disabled UI labels.
- Browser extension and public API.

## Phase 0: Product Foundation

Goal: replace starter defaults with a clear Benkyou baseline and remove
ambiguity before feature work accelerates.

### Product Decisions

- [x] Confirm the MVP name is `Benkyou` across metadata, UI copy, manifest, and
      README.
- [x] Confirm the core promise: "Turn a video into a structured course."
- [x] Decide whether anonymous/local-first use is required in the first coded
      slice or whether MVP starts with sign-in-required persistence.
- [x] Decide whether initial AI generation can ship with a sample/mock job path
      while real transcript extraction is integrated.
- [x] Define the supported input for launch: YouTube watch URLs, shortened
      YouTube URLs, and embedded YouTube URLs.
- [x] Define default completion logic: chapter complete at 90% watched or manual
      completion.
- [x] Define MVP export requirements: defer, Markdown-only, or notes plus
      bookmarks.

Decision record: see `docs/product-decisions.md`.

### Repo Baseline

- [x] Update root README from Turborepo starter text to Benkyou setup,
      development, and MVP overview.
- [x] Update `apps/web/README.md` with app-specific commands and env variables.
- [x] Rename starter page title from `TanStack Start Starter` to `Benkyou`.
- [x] Replace the placeholder home route with the new course entry flow.
- [x] Remove app-local DB/schema logic; all DB ownership lives in `packages/db`.
- [x] Document required environment variables in `.env.example`.
- [x] Confirm package boundaries between `apps/web`, `packages/core`,
      `packages/types`, `packages/db`, and `packages/ui`.

### Package Architecture & Extraction

- [x] Establish `packages/core` for framework-free product logic: URL parsing,
      course generation state, progress math, AI output validation, export
      formatting, and shared constants.
- [x] Establish `packages/types` for stable shared types and DTOs: courses,
      chapters, videos, generation jobs, notes, bookmarks, progress, settings,
      and API request/response shapes.
- [x] Keep `packages/ui` for reusable React UI: primitives, app shell pieces,
      course cards, chapter lists, player panels, notes editor, dialogs, badges,
      and empty states.
- [x] Keep `packages/db` for Drizzle schema, migrations, relations, seed data,
      and database helpers.
- [x] Keep `apps/web` thin: routes, layouts, TanStack Start server functions,
      auth/session wiring, environment wiring, and page composition.
- [x] Move reusable UI out of `apps/web/src/components` into `packages/ui`.
- [x] Move reusable domain logic out of route files into `packages/core`.
- [x] Move reusable public contracts out of app files into `packages/types`.
- [x] Keep route-specific composition in `apps/web`; do not force one-off page
      layout code into packages unless it becomes reusable.
- [x] Design package APIs so the later hosted/private cloud version can reuse
      OSS core packages without duplicating product logic.

### Design Baseline

- [x] Translate `DESIGN.md` colors into Tailwind/theme tokens.
- [x] Confirm Inter font loading and fallback behavior.
- [x] Establish app shell primitives: sidebar, top bar, content panel, empty
      state, status badge, progress bar, tabs, modal, toast.
- [x] Keep border radii disciplined: 4px standard, 8px large surfaces.
- [x] Use Hugeicons for navigation and action buttons.
- [x] Create responsive breakpoints for the player layout: desktop split view,
      tablet stacked view, mobile drawer-based chapters.
- [x] Define common loading, error, empty, and disabled states.

### Done When

- [x] A developer can understand the product and run the app from README alone.
- [x] Starter branding no longer appears in the browser shell or home route.
- [x] The design tokens match the expert, organized, focused direction in
      `DESIGN.md`.

## Phase 1: Data Model & Persistence

Goal: create the durable schema needed by the course creation and learning loop.

### Database Schema

- [x] Implement shared schema helpers: UUID id, created at, updated at, deleted
      at.
- [x] Implement enums: `video_provider`, `course_visibility`,
      `generation_job_status`, `transcript_source`.
- [x] Implement `videos` for canonical external video metadata.
- [x] Implement `courses` for the user's course wrapper around one video.
- [x] Implement `course_chapters` for ordered chapter navigation.
- [x] Implement `course_generation_jobs` for async processing state.
- [x] Implement `chapter_notes` for per-chapter Markdown notes.
- [x] Implement `course_progress` for resume position and completion percent.
- [x] Implement `chapter_progress` for per-chapter completion.
- [x] Implement `bookmarks` for saved timestamps.
- [x] Add relations for all core entities.
- [x] Generate and commit Drizzle migrations.
- [x] Add seed data for one sample course with chapters, notes, progress, and
      bookmarks.

### Data Access Logic

- [x] Add DB client conventions for server functions/routes.
- [x] Add course loader query: course, video, ordered chapters, progress, notes,
      bookmarks.
- [x] Add course library query with progress and latest generation status.
- [x] Add generation job query by id.
- [x] Add upsert logic for videos by provider and provider video id.
- [x] Add upsert logic for course progress by user/course.
- [x] Add upsert logic for chapter progress by user/chapter.
- [x] Add upsert logic for chapter notes by user/chapter.
- [x] Add create, update, and delete logic for bookmarks.

### Local-First Logic

- [x] Define local storage keys for anonymous courses, progress, notes, and
      bookmarks if local-first is in MVP.
- [x] Add migration/versioning for local storage payloads.
- [x] Add sync prompt logic for local data after sign-in.
- [x] Decide conflict behavior between local and server notes.

### Done When

- [x] The database can represent every MVP screen without ad hoc placeholder
      objects.
- [x] A seeded course renders from real schema data.
- [x] Progress, notes, and bookmarks can be saved and reloaded.

## Phase 2: Authentication & User State

Goal: make hosted persistence possible while keeping the course workflow
unblocked.

### Auth Logic

- [x] Configure Better Auth with the production database adapter.
- [x] Confirm email/password flow or switch to magic link/OAuth if preferred.
- [x] Add server-side session helper for loaders and server functions.
- [x] Add current-user query.
- [x] Add sign-out action and redirect behavior.
- [x] Add route guards for account-only routes.
- [x] Keep app entry usable for anonymous/local users if local-first remains in
      scope.

### Auth UI

- [x] Build `/sign-in` page.
- [x] Add email/password or magic-link form validation.
- [x] Add OAuth buttons only for providers actually configured.
- [x] Add "Continue locally" action if anonymous use is supported.
- [x] Add signed-in user menu in app shell.
- [x] Add signed-out sign-in affordance in app shell.
- [x] Add auth loading and failure states.

### Done When

- [x] A signed-in user can create and reopen their own courses.
- [x] A signed-out user has clear next steps.
- [x] Auth errors are shown as recoverable UI, not dead ends.

## Phase 3: New Course & Generation Pipeline

Goal: let a learner submit a YouTube URL and see course generation progress.

### Contract Versioning

- [x] Define Phase 3 request/response DTOs in `packages/types` as explicit v1
      contracts, such as `CreateCourseFromUrlRequestV1`,
      `CreateCourseFromUrlResponseV1`, `GenerationJobDetailV1`,
      `RetryGenerationJobRequestV1`, and `RetryGenerationJobResponseV1`.
- [x] Use the v1 DTOs from TanStack Start server functions and UI callers
      instead of route-local or feature-local wire shapes.
- [x] Keep v1 contract semantics stable after implementation; introduce v2 types
      for breaking wire-shape or meaning changes.
- [ ] If public HTTP API routes are added later, expose Phase 3 endpoints under
      `/api/v1/...` and reuse the same v1 DTOs.

### URL Input Logic

- [x] Parse supported YouTube URL formats.
- [x] Extract provider and provider video id.
- [x] Normalize to a canonical URL.
- [x] Reject malformed URLs with inline errors.
- [x] Reject unsupported providers with clear disabled messaging.
- [x] Prevent duplicate submissions while a job is being created.

### Course Creation Logic

- [x] Create server function or API route for `createCourseFromUrl`.
- [x] Upsert video metadata.
- [x] Create course with sensible initial title and private visibility.
- [x] Create queued generation job.
- [x] Redirect to `/courses/new/:jobId`.
- [x] Handle duplicate video submissions for the same user.
- [x] Add "Try sample course" path that creates or opens seeded sample data.

### Generation Worker

- [x] Decide execution model for MVP: inline async, scheduled worker, queue, or
      manual development worker.
- [x] Claim queued jobs safely.
- [x] Fetch video metadata.
- [x] Fetch transcript or captions.
- [x] Handle transcript unavailable state.
- [x] Parse creator-provided YouTube timestamps before AI generation.
- [x] Prefer creator timestamps when valid so normal timestamped videos do not
      consume AI credits.
- [x] Send transcript to AI provider for chapter JSON only when creator
      timestamps are unavailable or unusable.
- [x] Use duration-aware AI chapter policy, including coarse maps for 11+ hour
      videos without creator timestamps.
- [x] Validate AI output with Zod.
- [x] Insert ordered chapters.
- [x] Store summary/rationale/raw output where useful.
- [x] Mark job completed.
- [x] Store failure reason and retry eligibility on failure.
- [x] Add timeout and cancellation handling.

### Generation Status UI

- [x] Build `/courses/new/:jobId`.
- [x] Show detected video preview.
- [x] Show status badge: queued, processing, completed, failed, cancelled.
- [x] Show generation timeline: metadata, transcript, chapters, player prep.
- [x] Poll or revalidate job status.
- [x] Enable "Open course" only when completed.
- [x] Enable retry when failed.
- [x] Enable "Use another URL" on unrecoverable errors.
- [x] Enable "Keep working in background" to go to `/courses`.

### Done When

- [x] A valid YouTube URL creates a course and job.
- [x] The job screen accurately reflects the lifecycle.
- [x] Completed jobs open the course player with chapters.
- [x] Failed jobs explain what happened and offer a next action.

## Phase 4: Course Library

Goal: give learners a reliable place to resume, search, and manage courses.

### Library Logic

- [x] Load current user's courses or local courses.
- [x] Include video thumbnail, source, progress, chapter count, last watched
      time, and latest generation status.
- [x] Sort by last watched or creation date.
- [x] Filter by all, in progress, completed, processing, failed.
- [x] Search by course title and video/channel metadata.
- [x] Retry failed generation jobs.
- [x] Soft-delete courses.

### Library UI

- [x] Build `/courses`.
- [x] Add compact app header with create course action.
- [x] Add filter tabs.
- [x] Add search input.
- [x] Add course rows/cards with progress bars.
- [x] Add processing and failed visual states.
- [x] Add empty state with "Create course" and "Try sample course".
- [x] Add responsive mobile list layout.

### Done When

- [x] A learner can find and resume a course in two clicks.
- [x] Processing and failed courses are visible and recoverable.
- [x] Empty library state pushes users back into the course creation loop.

## Phase 5: Course Player

Goal: deliver the main learning experience: video, chapters, notes, bookmarks,
and progress in one focused workspace.

### Player Logic

- [x] Load course player data from course id.
- [x] Resolve selected chapter from URL, progress, or first chapter.
- [x] Embed YouTube player.
- [x] Seek to selected chapter start.
- [x] Update selected chapter based on playback time.
- [x] Track current playback time.
- [x] Persist course resume position on an interval and on pause/unload.
- [x] Persist chapter progress.
- [x] Mark chapter complete automatically based on completion threshold.
- [x] Support manual chapter complete/incomplete toggle.
- [x] Handle transcript/chapter gaps gracefully.
- [x] Handle private/deleted/missing course states.

### Player UI

- [x] Build `/courses/:courseId`.
- [x] Add course header with title, source metadata, progress, and manage link.
- [x] Add video player region with stable aspect ratio.
- [x] Add chapter sidebar with: title, time range, completion state, active
      state, progress.
- [x] Add tabs for Notes, Summary, and Bookmarks.
- [x] Add per-chapter summary display.
- [x] Add keyboard-accessible chapter selection.
- [x] Add mobile chapter drawer.
- [x] Add loading skeleton.
- [x] Add no-chapters fallback with retry/regenerate action.
- [x] Add save failure toast or inline recovery.

### Done When

- [x] A learner can watch, jump chapters, leave, and resume.
- [x] The sidebar always reflects current chapter and completion state.
- [x] The player is usable on desktop, tablet, and mobile.

## Phase 6: Notes

Goal: make per-chapter notes useful and trustworthy.

### Notes Logic

- [x] Load notes for the selected chapter.
- [x] Autosave Markdown after debounce.
- [x] Save immediately on chapter switch.
- [x] Save immediately before unload where possible.
- [x] Show saved, saving, and failed states.
- [x] Prevent overwriting newer notes with stale responses.
- [x] Add local draft fallback if server save fails.
- [x] Add basic Markdown preview if included in MVP.

### Notes UI

- [x] Add dense textarea/editor in Notes tab.
- [x] Add note status indicator.
- [x] Add "copy Markdown" action for save recovery.
- [x] Add empty note placeholder.
- [x] Keep editor height responsive beside the video.
- [x] Skip monospaced option for MVP to keep the notes workflow focused.

### Done When

- [x] Notes follow the selected chapter.
- [x] Notes survive refresh and route navigation.
- [x] Save failures do not cause silent data loss.

## Phase 7: Bookmarks

Goal: let learners capture and revisit important timestamps.

### Bookmark Logic

- [x] Create bookmark at current playback timestamp.
- [x] Infer chapter id from timestamp when possible.
- [x] Add optional bookmark title and note.
- [x] Edit bookmark title/note.
- [x] Delete bookmark.
- [x] Jump to bookmark timestamp from player.
- [x] Load all bookmarks for a course.
- [x] Load all bookmarks across courses for the library view.

### Bookmark UI

- [x] Add "Add bookmark" action near player controls.
- [x] Add add/edit bookmark modal.
- [x] Add Bookmarks tab in course player.
- [x] Show timestamp, title, note, chapter, and jump action.
- [x] Build `/bookmarks`.
- [x] Add bookmarks search.
- [x] Add course filter.
- [x] Add empty and no-results states.

### Done When

- [x] A learner can save a moment and return to it later.
- [x] Bookmarks work both inside a course and from the global library.

## Phase 8: Course Management & Settings

Goal: provide the minimum controls needed to correct generated content and
manage learner data.

### Course Management Logic

- [x] Load course metadata and chapters.
- [x] Update course title and description.
- [x] Keep visibility private for MVP, with disabled unlisted/public options if
      needed.
- [x] Edit chapter title, summary, start time, and end time.
- [x] Validate chapter time ranges.
- [x] Regenerate chapters with confirmation.
- [x] Preserve notes/bookmarks where possible during regeneration.
- [x] Soft-delete course with confirmation.

### Course Management UI

- [x] Build `/courses/:courseId/manage`.
- [x] Add editable metadata form.
- [x] Add source video details.
- [x] Add chapter table.
- [x] Add edit chapter modal.
- [x] Add regenerate confirmation modal.
- [x] Add delete confirmation modal.
- [x] Add save, saving, saved, and failed states.

### Settings Logic

- [x] Build account profile loading.
- [x] Store learning preferences: playback speed, completion behavior, autoplay
      next chapter.
- [x] Add data export endpoint if export is in MVP.
- [x] Add local data reset if local-first is included.

### Settings UI

- [x] Build `/settings`.
- [x] Add profile summary.
- [x] Add learning preferences section.
- [x] Add data export section.
- [x] Add self-hosting link.
- [x] Build `/settings/profile`, `/settings/learning`, and `/settings/export`
      only if separate routes are needed.

### Done When

- [x] A learner can correct course metadata and generated chapters.
- [x] A learner can delete a course intentionally.
- [x] Settings covers account state, preferences, and data ownership basics.

## Phase 9: Static, Legal, and Error Pages

Goal: make the app feel complete and launch-ready.

### Static Pages

- [x] Build `/about`.
- [x] Build `/self-hosting`.
- [x] Build `/privacy`.
- [x] Build `/terms`.
- [x] Add 404 handling.
- [x] Add app error boundary UI.

### Static Page Content

- [x] About explains mission, open-source ethos, and learning focus.
- [x] Self-hosting includes requirements, Docker path, env vars, and database
      setup.
- [x] Privacy explains stored data, local-first behavior, AI processing, and
      external video provider handling.
- [x] Terms covers acceptable use, external video responsibility, and AI output
      caveats.

### Done When

- [x] Public visitors can understand trust and data handling.
- [x] Broken routes and app crashes recover to useful actions.

## Phase 10: Quality, Accessibility, and Launch Hardening

Goal: verify the MVP behaves like a serious learning tool before release.

### Validation

- [x] Validate all forms with Zod or equivalent schema validation.
- [x] Sanitize or safely render Markdown.
- [x] Enforce authorization on course, notes, progress, and bookmark mutations.
- [x] Rate-limit course generation.
- [x] Validate AI chapter output before writing to the database.
- [x] Add defensive handling for missing thumbnails, titles, transcripts, and
      durations.
- [x] Apply Biome formatting and import cleanup after feature changes.

### Accessibility

- [x] Ensure keyboard navigation for forms, tabs, chapter list, dialogs, and
      menus.
- [x] Add visible focus states.
- [x] Add accessible labels for icon buttons.
- [x] Ensure dialogs trap focus and restore focus on close.
- [x] Confirm color contrast for text, badges, progress bars, and errors.
- [x] Respect reduced motion preferences.

### Responsive QA

- [x] Verify `/` at mobile, tablet, and desktop sizes.
- [x] Verify `/courses` at mobile, tablet, and desktop sizes.
- [x] Verify `/courses/:courseId` at mobile, tablet, and desktop sizes.
- [x] Verify notes and bookmark modals on small screens.
- [x] Confirm text never overlaps controls or overflows buttons.

### Testing

- [x] Unit test YouTube URL parser.
- [x] Unit test chapter time range validation.
- [x] Unit test progress percentage calculation.
- [x] Unit test AI output validator.
- [ ] Integration test course creation server function.
- [x] Integration test notes autosave.
- [x] Integration test bookmark create/edit/delete.
- [ ] Integration test route guards.
- [x] Smoke test build with `pnpm build`.
- [x] Smoke test type checks with `pnpm check-types`.
- [x] Smoke test lint/check with `pnpm check`.

### Observability

- [x] Add optional PostHog analytics integration that is disabled when no public
      project key is configured.
- [x] Track core learner events for auth, course creation, generation, playback,
      notes, bookmarks, course management, and settings.
- [x] Log generation job failures with job id and provider error category.
- [x] Add user-safe error messages.
- [ ] Track generation duration and failure rate.
- [x] Track autosave failures.
- [x] Add basic health check route if needed for deployment.

### Launch

- [x] Add MIT license if open-source launch is in MVP.
- [x] Add deployment docs.
- [x] Add Docker or self-hosting deployment path.
- [x] Confirm production env variables.
- [x] Confirm database migrations run in production.
- [x] Confirm app manifest and icons.
- [x] Confirm robots policy.

### Done When

- [x] The full happy path works from URL paste to generated course to resume.
- [x] The top failure paths are recoverable.
- [x] The app passes build, type check, lint/check, and responsive smoke tests.

## Route Implementation Checklist

- [x] `/` - new course entry.
- [x] `/sign-in` - sign-in and local continuation.
- [ ] `/sign-in/sent` - magic link confirmation if using magic links.
- [ ] `/auth/callback` - auth callback if required by provider setup.
- [x] `/courses` - course library.
- [x] `/courses/new/:jobId` - generation status.
- [x] `/courses/:courseId` - course player.
- [ ] `/courses/:courseId/focus` - distraction-free player if included in MVP.
- [x] `/courses/:courseId/manage` - course metadata and chapter management.
- [x] `/courses/:courseId/chapters/:chapterId` - chapter deep link.
- [x] `/courses/:courseId/bookmarks/:bookmarkId` - bookmark deep link.
- [x] `/bookmarks` - global bookmarks.
- [x] `/settings` - account, preferences, export.
- [x] `/about` - mission and project context.
- [x] `/self-hosting` - self-hosting guide.
- [x] `/privacy` - privacy page.
- [x] `/terms` - terms page.
- [x] `404` - unknown route recovery.
- [x] App error boundary - unrecoverable error recovery.

## UI Component Checklist

- [x] App shell.
- [x] Sidebar navigation.
- [x] Top bar.
- [x] User menu.
- [x] URL input form.
- [x] Status badge.
- [x] Progress bar.
- [x] Course card or course row.
- [x] Search input.
- [x] Filter tabs.
- [x] Empty state.
- [x] Loading skeleton.
- [x] YouTube player wrapper.
- [x] Chapter sidebar item.
- [x] Chapter drawer.
- [x] Notes editor.
- [x] Summary panel.
- [x] Bookmark list.
- [x] Add/edit bookmark dialog.
- [x] Confirm dialog.
- [x] Toast or inline alert.
- [x] Settings form controls.
- [x] Error page layout.

## API & Server Function Checklist

- [x] `createCourseFromUrl`.
- [x] `getGenerationJob`.
- [x] `retryGenerationJob`.
- [x] `getCourseLibrary`.
- [x] `getCoursePlayerData`.
- [x] `updateCourseMetadata`.
- [x] `updateChapter`.
- [x] `regenerateChapters`.
- [x] `deleteCourse`.
- [x] `upsertCourseProgress`.
- [x] `upsertChapterProgress`.
- [x] `upsertChapterNote`.
- [x] `createBookmark`.
- [x] `updateBookmark`.
- [x] `deleteBookmark`.
- [x] `getBookmarks`.
- [x] `updateLearningPreferences`.
- [x] `exportNotes` if included.

## MVP Release Gate

- [x] Paste a valid YouTube URL.
- [x] Create a course and generation job.
- [x] Complete or simulate chapter generation.
- [x] Open generated course.
- [x] Play video and select chapters.
- [x] Save progress.
- [x] Refresh and resume.
- [x] Write chapter notes.
- [x] Refresh and recover notes.
- [x] Add, edit, jump to, and delete bookmark.
- [x] Find course in library.
- [x] Manage course title and chapter title.
- [x] Delete course.
- [x] Sign in and sign out.
- [x] View privacy, terms, and self-hosting pages.
- [x] Pass build, type check, lint/check, and smoke tests.
