# AGENTS.md

## Project Shape

- `apps/web`: TanStack Start app only. Keep routes, layouts, server functions,
  auth/session wiring, environment wiring, and page composition here.
- `packages/core`: framework-free product logic. No React, DOM, TanStack, or DB
  imports. Put URL parsing, validators, progress math, generation state, export
  logic, and shared constants here.
- `packages/types`: stable shared types, DTOs, enums, and API contracts.
- `packages/ui`: reusable React UI components. Keep components presentational;
  pass data and callbacks in.
- `packages/db`: Drizzle schema, relations, migrations, seeds, and DB helpers.
- Add new packages only when they create a real boundary, such as `ai`, `auth`,
  `billing`, `cloud`, or `telemetry`.

## Architecture Rules

- Keep `apps/web` thin. Move reusable UI to `packages/ui`, domain logic to
  `packages/core`, public contracts to `packages/types`, and persistence to
  `packages/db`.
- Never add schema files, Drizzle config, migrations, seed SQL, or database
  client logic under `apps/web`.
- Route files should compose screens, load data, and connect actions. They
  should not contain large components, schemas, parsers, or business rules.
- Use TanStack Start patterns: `createServerFn` for server mutations/queries,
  validated inputs, auth checks inside protected server functions, and
  `beforeLoad` for protected routes.
- Separate server/client code. Prefer colocated `.functions.ts` files for route
  server functions and shared validation schemas from `packages/core` or
  `packages/types`.
- Keep secrets server-side. Do not expose provider keys, DB URLs, auth secrets,
  or private hosted/cloud logic to client bundles.

## File & Component Rules

- Prefer small files with one clear responsibility.
- Split components into separate files once they are reused, become complex, or
  make a file hard to scan.
- One-off subcomponents may stay in the same file only when the file remains
  short and readable.
- Avoid long files. If a file grows past roughly 250 lines, look for a natural
  split before adding more.
- Avoid giant component props. Extract typed view models or smaller child
  components when props become noisy.
- Keep tests close to the logic they protect when the repo pattern allows it.

## UI Rules

- Follow `DESIGN.md`: expert, organized, focused, dense, minimal, border-led UI.
- Use `packages/ui` and existing shadcn-style primitives before creating new
  local controls.
- Use lucide icons for icon buttons and provide accessible labels.
- Build real app screens, not marketing pages, unless the route is explicitly
  static/public.
- Ensure mobile, tablet, and desktop states are designed for every app screen.

## Quality Rules

- Validate user input with schemas before mutations.
- Sanitize or safely render Markdown.
- Enforce ownership/authorization for courses, notes, progress, and bookmarks.
- Handle loading, empty, error, saving, and failed states intentionally.
- Run the narrowest useful checks after changes: type check, lint/check, tests,
  or build depending on the touched surface.

## Skills

- Use `tanstack-start-best-practices` for TanStack Start routes, server
  functions, auth, SSR, middleware, or deployment work.
- Use `tanstack-router-best-practices` for routing, loaders, search params, and
  navigation.
- Use `tanstack-query-best-practices` for server-state fetching, caching, and
  mutations.
- Use `react-doctor` after React changes.
- Use UI/design skills when changing visual design or reviewing UX.
