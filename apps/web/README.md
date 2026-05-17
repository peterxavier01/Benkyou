# Benkyou Web

TanStack Start app for the Benkyou learning workspace.

## Commands

From the repo root:

```sh
pnpm --filter @benkyou/web dev
pnpm --filter @benkyou/web check
pnpm --filter @benkyou/web check-types
pnpm --filter @benkyou/web build
```

## Environment

Copy the example file:

```sh
cp apps/web/.env.example apps/web/.env.local
```

Required values:

- `DATABASE_URL`: Postgres connection string used by `@benkyou/db`.
- `BETTER_AUTH_SECRET`: secret used by Better Auth.
- `BETTER_AUTH_URL`: canonical app URL, for example `http://localhost:3000`.
- `AI_PROVIDER`: set to `openai` when AI chapter fallback is enabled.
- `AI_API_KEY`, `OPENAI_MODEL`, `YOUTUBE_API_KEY`: provider configuration.
- `GENERATION_RATE_LIMIT_MAX`: optional generation quota, default `5`.
- `GENERATION_RATE_LIMIT_WINDOW_HOURS`: optional quota window, default `24`.

## Deployment

From the repository root, copy the self-hosting template and replace the
placeholder secrets:

```sh
cp .env.example .env
```

The Docker Compose path builds the app, starts Postgres on the internal Compose
network, runs migrations, and serves the app on host port `3000`:

```sh
docker compose up --build
```

The health endpoint is available at `/api/health`. Keep real values for
`POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, and provider keys such as
`AI_API_KEY` in `.env`, not in Compose or source files.

## Boundaries

- Keep this app focused on routes, layouts, page composition, server functions,
  auth/session wiring, and environment wiring.
- Do not put schema or database client logic in `apps/web`; use `@benkyou/db`.
- Move reusable product logic to `@benkyou/core`.
- Move shared contracts to `@benkyou/types`.
- Move reusable React UI to `@benkyou/ui`.
