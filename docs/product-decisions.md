# Product Decisions

These decisions define the MVP baseline for Benkyou. Revisit them only when a
new implementation constraint or user insight makes the tradeoff clearly wrong.

## 1. Product Name

Decision: the MVP name is `Benkyou`.

Rationale: the repo, design system, and current app direction already use
Benkyou. Keeping the name avoids churn while the product foundation is still
forming.

Implementation:

- Use `Benkyou` in app metadata, README files, manifest, navigation, and UI
  copy.
- Remove remaining starter branding.

## 2. Core Promise

Decision: the core promise is "Turn a video into a structured course."

Rationale: the product is not a generic note app or video player. The value is
the structure layer: chapters, progress, notes, bookmarks, and resume state.

Implementation:

- The home screen should be the course creation workspace.
- Marketing-style hero pages are not part of the primary MVP app flow.

## 3. Anonymous and Local-First Use

Decision: anonymous/local-first use is required for the MVP learning loop.

Rationale: the OSS product should feel useful before account creation. Hosted
sync can be valuable later, but the first experience should not block learning
behind sign-in.

Implementation:

- Users can create or open a sample course without signing in.
- Progress, notes, bookmarks, and preferences should work for anonymous users.
- Anonymous learning data should use local storage first, with a versioned
  payload format.
- Hosted accounts can sync data after sign-in, but account sync is not required
  to prove the first learning loop.
- Server-created course and generation records may have a nullable owner until
  the user signs in.

## 4. Initial AI Generation Path

Decision: the first coded generation flow may ship with a sample/mock job path
while real transcript extraction and AI generation are integrated.

Rationale: the player, progress, notes, bookmarks, and routing can be built and
tested against stable generated course data before external transcript and AI
provider integration is ready.

Implementation:

- Provide a "Try sample course" path.
- Support a mock generation job that exercises queued, processing, completed,
  and failed UI states.
- Keep the database and server interfaces shaped like the real generation flow.
- Replace the mock internals without changing the player UI contract.

## 5. Supported Video Inputs

Decision: launch support is YouTube only.

Supported:

- `https://www.youtube.com/watch?v=...`
- `https://youtu.be/...`
- `https://www.youtube.com/embed/...`
- `https://www.youtube.com/shorts/...`

Deferred:

- YouTube playlists.
- YouTube channel ingestion.
- Vimeo.
- Loom.
- Uploaded files.

Implementation:

- Unsupported providers should show clear disabled messaging, not silent
  failure.
- URL parsing belongs in `packages/core`.

## 6. Completion Logic

Decision: a chapter is automatically complete at 90% watched, with manual
complete/incomplete override.

Rationale: automatic progress keeps the app useful without extra clicks, while
manual override lets learners correct edge cases.

Implementation:

- Store course resume position continuously.
- Store per-chapter completion separately from course-level progress.
- Course completion is derived from chapter completion percentage.
- Manual overrides take precedence over automatic completion.

## 7. Export Scope

Decision: MVP export is Markdown-only for notes and bookmarks. PDF export is
deferred.

Rationale: Markdown is simpler, transparent, self-hosting friendly, and already
matches the notes model. PDF adds formatting and rendering complexity that is
not necessary for the first release.

Implementation:

- Export one Markdown file per course.
- Include course title, source URL, chapters, notes, and bookmarks.
- Put export formatting logic in `packages/core`.
