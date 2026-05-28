# Contributing to Benkyou

Thanks for helping make Benkyou better. Benkyou is an open-source, self-hostable
learning workspace for turning long videos into structured study: chapters,
notes, bookmarks, progress, and resume state.

Benkyou is roadmap-led. We welcome focused contributions that improve the core
learning workspace, but larger product changes need discussion before anyone
spends time implementing them.

## What We Welcome

Good contribution areas:

- Bug fixes with clear reproduction steps.
- Documentation, setup, and self-hosting improvements.
- Tests for existing behavior.
- Accessibility improvements.
- Performance improvements.
- Docker and local development polish.
- Small UI fixes that follow `DESIGN.md`.
- Provider-neutral improvements to course creation, playback, notes, bookmarks,
  progress, and export.

## Discuss First

Please open a GitHub Discussion or issue before working on:

- Major new features.
- New video providers.
- Auth, account, session, or ownership model changes.
- Database schema changes or migrations.
- AI provider, transcript, or generation pipeline changes.
- Public API or server-function contract changes.
- Large UI redesigns.
- Billing, hosted quotas, telemetry, admin tooling, private infrastructure, or
  hosted-only features.

Contributions should improve the self-hostable Benkyou learning workspace.
Hosted-only business operations, billing, private infrastructure, internal
analytics, and admin tooling are outside the scope of this repository.

Maintainers may close well-intentioned issues or pull requests that are outside
the current product direction. That is not a judgment on the quality of the
idea; it is how we keep the project focused.

## Local Setup

Requirements:

- Node.js `>=20.19`
- pnpm `10.33.4`
- Postgres for database-backed development

Install dependencies:

```sh
pnpm install
```

Create a local app environment file:

```sh
cp apps/web/.env.example apps/web/.env.local
```

Fill in the values described in `README.md`. AI provider keys can stay blank
when working on sample data, creator timestamp parsing, docs, UI, or tests that
do not require AI fallback.

Run the app:

```sh
pnpm dev
```

Open `http://localhost:3000`.

## Pull Requests

Before opening a pull request:

- Keep the change focused.
- Link the relevant issue or discussion when one exists.
- Include screenshots or short screen recordings for visible UI changes.
- Update docs when setup, behavior, or contribution expectations change.
- Avoid unrelated formatting or refactors.

Run the narrowest useful checks for your change. For most pull requests, run:

```sh
pnpm check
pnpm check-types
pnpm -r --if-present test
```

For release-sensitive or infrastructure changes, also run:

```sh
pnpm build
```

## Review Expectations

Maintainers review for product fit, correctness, maintainability, accessibility,
security, and consistency with the repo architecture in `AGENTS.md`.

Review may ask for smaller scope, stronger tests, clearer failure states, or a
discussion before continuing. Please keep the conversation practical and
respectful.
