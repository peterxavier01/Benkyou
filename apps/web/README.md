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

## Boundaries

- Keep this app focused on routes, layouts, page composition, server functions,
  auth/session wiring, and environment wiring.
- Do not put schema or database client logic in `apps/web`; use `@benkyou/db`.
- Move reusable product logic to `@benkyou/core`.
- Move shared contracts to `@benkyou/types`.
- Move reusable React UI to `@benkyou/ui`.
