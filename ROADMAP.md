# Roadmap

Benkyou is an open-source, self-hostable learning workspace for turning long
videos into structured study: chapters, notes, bookmarks, progress, and resume
state.

This roadmap describes the intended public product direction. It is not a
promise that every item will ship exactly as written, but it is the guide used
to decide which contributions fit the project.

Status markers: **Shipped**, **In progress**, **Planned**.

## Terminology

The app's interface uses learner-facing names. Code, docs, and issues may use
the older internal names.

| In the app | In code and older docs                     |
| ---------- | ------------------------------------------ |
| Notebook   | Course (one video with its chapters)       |
| Shelf      | Collection (an ordered group of notebooks) |

## Phase 1: Foundation

Goal: make the first complete learning loop reliable.

- **Shipped:** YouTube URL to chapter generation, with retry for failed jobs.
- **Shipped:** Notebook player with chapter navigation, keyboard shortcuts, and
  touch gestures.
- **Shipped:** Accounts, so learning data can sync across devices.
- **Shipped:** Saved notebooks, progress, notes, and bookmarks, with resume
  state.
- **Shipped:** Private learning without an account. Signed-out learners get
  their own notebooks and shelves, which move to their account when they sign up
  or sign in.
- **Shipped:** Per-chapter Markdown notes with autosave and a local draft
  fallback.
- **Shipped:** Markdown export of notes and bookmarks.
- **Shipped:** Self-hostable Docker deployment.
- **Shipped:** Public setup, self-hosting, security, support, and contribution
  docs.
- **In progress:** Responsive and accessibility polish across every app screen.
- **In progress:** Integration test coverage for course creation and route
  guards.

## Phase 2: Growth

Goal: make Benkyou useful for repeat study sessions and broader learning flows.

- **In progress:** Shelves for grouping notebooks into multi-video courses.
- **Planned:** Account lifecycle and sync polish.
- **Planned:** A learning dashboard with continue-learning and recent activity.
- **Planned:** Search across notebooks, chapters, notes, and bookmarks.
- **Planned:** A review queue for notes, bookmarks, and unfinished chapters.
- **Planned:** AI chapter summaries and quizzes.
- **Planned:** Better export, including chapters and shelves.
- **Planned:** Public notebook and shelf sharing, private by default.
- **Planned:** Creator publishing primitives.
- **Planned:** Community launch through GitHub Discussions and Issues.
- **Planned, after discussion:** Additional video providers.
- **Planned, after discussion:** Browser extension for quicker notebook
  creation.

## Phase 3: Sustainability

Goal: support long-term maintenance without weakening the self-hostable product.

- Optional hosted product improvements.
- Flashcards and spaced repetition.
- Certificates of completion.
- Embed widgets.
- Public API surfaces once the contracts are stable. Existing `/api/v1` routes
  serve the app itself and are not yet a supported public API.
- Team and institutional learning workflows.

## Contribution Focus

The best contributions improve the core learning workspace:

- Notebook creation.
- Chapter generation and editing.
- Playback and progress.
- Notes, bookmarks, and export.
- Shelves and organization.
- Accessibility and responsive behavior.
- Setup, self-hosting, and docs.
- Tests, reliability, and performance.

Please discuss large feature work before opening a pull request. Contributions
outside the current roadmap may be closed so maintainers can keep the project
focused.
