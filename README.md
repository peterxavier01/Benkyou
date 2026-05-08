# Benkyou

Benkyou turns video into a structured course: chapters, notes, bookmarks,
progress, and resume state.

The MVP is a local-first learning workspace. The first screen is the app itself:
paste a YouTube URL, generate or open a sample course, and start learning.

## Workspace

```txt
apps/
  web/          TanStack Start web app

packages/
  core/         Framework-free product logic
  db/           Drizzle schema, migrations, seeds, and DB helpers
  types/        Shared public types and API contracts
  ui/           Reusable React UI components

docs/           Public product and implementation docs
core-docs/      Private/internal planning docs
```

## Requirements

- Node.js `>=20.19`
- pnpm `9.15.9`
- Postgres connection string for database-backed development

## Setup

```sh
pnpm install
cp apps/web/.env.example apps/web/.env.local
```

Fill in the values in `apps/web/.env.local`. For the first local run, set:

- `DATABASE_URL`: Postgres connection string for the app database.
- `BETTER_AUTH_SECRET`: secret used by Better Auth.
- `BETTER_AUTH_URL`: local app URL, usually `http://localhost:3000`.

AI provider values can stay blank until the real generation worker replaces the
sample/mock path.

## Development

Run the full workspace:

```sh
pnpm dev
```

Run only the web app:

```sh
pnpm --filter @benkyou/web dev
```

Open `http://localhost:3000`.

## Checks

```sh
pnpm check
pnpm check-types
pnpm build
```

Package-specific checks can be run with `pnpm --filter <package> <script>`.

## Architecture

- Keep `apps/web` thin: routes, layouts, server functions, auth/session wiring,
  environment wiring, and page composition.
- Put reusable product logic in `packages/core`.
- Put shared public contracts in `packages/types`.
- Put reusable React UI in `packages/ui`.
- Put persistence and schema code in `packages/db`.

See [AGENTS.md](./AGENTS.md) for implementation rules and
[docs/mvp-implementation-checklist.md](./docs/mvp-implementation-checklist.md)
for the MVP execution plan.
