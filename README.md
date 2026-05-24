# Benkyou

![Benkyou banner](./apps/web/public/banner.png)

Benkyou turns long videos into focused study workspaces: chapters, notes,
bookmarks, progress, and resume state.

The Open Beta is a local-first learning workspace. The first screen is the app
itself: paste a YouTube URL, create or open a sample study workspace, and start
learning.

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
- pnpm `10.33.4`
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
- `PUBLIC_SITE_URL`: public canonical URL for SEO metadata, robots, and sitemap.
- `GENERATION_RATE_LIMIT_MAX`: optional course generation quota, default `5`.
- `GENERATION_RATE_LIMIT_WINDOW_HOURS`: optional quota window, default `24`.

AI provider values can stay blank while using creator timestamps or sample data.
Set `AI_PROVIDER=openai` and `AI_API_KEY` when AI chapter fallback is enabled.

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

## Self-hosting

Copy the root template and replace every placeholder secret:

```sh
cp .env.example .env
```

Do not commit `.env`. Set `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, and any
provider keys such as `AI_API_KEY` to real private values before production use.

Run Benkyou with Docker Compose:

```sh
docker compose up --build
```

The Compose stack starts Postgres, builds the web app, runs database migrations,
and serves Benkyou at `http://localhost:3000`. Only the web service publishes a
host port by default. Postgres stays on the internal Compose network and is
reached by the app as `db`.

Useful production checks:

```sh
curl http://localhost:3000/api/health
```

## Architecture

- Keep `apps/web` thin: routes, layouts, server functions, auth/session wiring,
  environment wiring, and page composition.
- Put reusable product logic in `packages/core`.
- Put shared public contracts in `packages/types`.
- Put reusable React UI in `packages/ui`.
- Put persistence and schema code in `packages/db`.

See [AGENTS.md](./AGENTS.md) for implementation rules and
[docs/mvp-implementation-checklist.md](./docs/mvp-implementation-checklist.md)
for the early execution plan.

## License

Benkyou is released under the [MIT License](./LICENSE).
