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
- `PUBLIC_SITE_URL`: public canonical URL for SEO metadata, robots, and sitemap.
- `AI_PROVIDER`: set to `openai` when AI chapter fallback is enabled.
- `AI_API_KEY`, `OPENAI_MODEL`, `YOUTUBE_API_KEY`: provider configuration.
- `YOUTUBE_TRANSCRIPT_PROVIDER`: optional transcript provider, default `auto`.
- `TRANSCRIPTAPI_API_KEY`: optional TranscriptAPI key for reliable hosted
  YouTube transcript fetching.
- `VITE_PUBLIC_POSTHOG_KEY`: optional PostHog project key; leave blank to
  disable analytics for self-hosting.
- `VITE_PUBLIC_POSTHOG_HOST`: optional PostHog host, default
  `https://us.i.posthog.com`.
- `GENERATION_RATE_LIMIT_MAX`: optional generation quota, default `5`.
- `GENERATION_RATE_LIMIT_WINDOW_HOURS`: optional quota window, default `24`.

`YOUTUBE_TRANSCRIPT_PROVIDER=auto` is self-hosting friendly: it uses
TranscriptAPI when `TRANSCRIPTAPI_API_KEY` is present, otherwise it falls back
to the free local `youtube-transcript` package. For hosted production, set
`YOUTUBE_TRANSCRIPT_PROVIDER=transcriptapi` and `TRANSCRIPTAPI_API_KEY` so the
app does not silently return to the local scraper path. Use
`YOUTUBE_TRANSCRIPT_PROVIDER=local` for development or self-hosted installs that
prefer the free local package.

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
