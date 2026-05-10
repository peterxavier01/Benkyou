---
name: Benkyou
colors:
  background: "#f7f9fb"
  foreground: "#191c1e"
  card: "#fbfcfd"
  muted: "#eef2f4"
  muted-foreground: "#53615a"
  border: "#d5dfd9"
  primary: "#007a58"
  primary-foreground: "#f5fff8"
  accent: "#e8f4ef"
  accent-foreground: "#143d30"
  destructive: "#ba1a1a"
typography:
  family: Inter
  h1: "32px / 1.15 / 650"
  h2: "22px / 1.25 / 650"
  h3: "16px / 1.35 / 600"
  body: "14px / 1.55 / 400"
  label: "12px / 1.2 / 600"
rounded:
  control: 4px
  surface: 8px
spacing:
  unit: 4px
  page-mobile: 12px
  page-desktop: 24px
  content-max: 1280px
---

## Brand Direction

Benkyou is a quiet, premium learning workspace. It should feel expert,
organized, focused, and useful immediately. The UI serves the study task. It
should not feel like a marketing SaaS page, a video entertainment app, or noisy
gamified edtech.

Use restrained color, precise spacing, strong text hierarchy, and familiar
product patterns. The surface should feel closer to Linear, Stripe, Notion, and
Raycast than to a landing page template.

## Layout Families

### Entry Workspace

The `/` route is the local-first course creation surface. It does not use the
persistent desktop sidebar. It should show the brand header, signed-in or
sign-in controls, the URL form as the dominant action, and a compact preview of
the learning loop.

Avoid a dashboard sidebar on this route. The user has not entered the library or
course workspace yet.

### Authenticated Workspace

Library, settings, generation status, and other inner app pages use one shared
workspace shell built from the shadcn/Radix sidebar primitives in
`packages/ui`. The sidebar owns global navigation and brand identity. The top
bar owns page title, short context, primary page action, save/status indicators,
and account controls.

Do not repeat the logo in both sidebar and top bar on desktop. Mobile may show a
sidebar trigger in the top bar.

### Course Player

The course player is a study workspace, not a generic content page. Keep the
video, chapter list, progress state, notes, summary, and bookmarks spatially
connected. Use the shared workspace shell, but allow the player body to be wider
and denser than normal pages.

### Auth Screens

Sign-in screens may use a simple public header and a focused two-column layout.
They should explain hosted sync as optional, not as a blocker for local study.

### Content And Prose

Only prose/content areas should receive default link styling. Links rendered as
buttons or sidebar menu items must keep their component colors.

## Components

Prefer existing shadcn/Radix-backed components from `packages/ui` before adding
new primitives. App-specific composition belongs in `apps/web`; reusable,
presentational primitives belong in `packages/ui`.

Use a reusable brand/logo component for the app mark. Do not hand-build the logo
inside screens.

Buttons must always show readable labels in default, hover, focus, disabled, and
loading states. Primary buttons are solid teal with light text. Secondary
buttons use subtle borders and neutral text. Icon-only buttons require
accessible labels and should use tooltips where the action is not obvious.

Navigation active state uses full-item treatment: subtle tinted background,
stronger text, and a fine inset outline when useful. Do not use thick left or
right color stripes as active indicators.

Cards and panels are for real containment: course rows, status blocks, dialogs,
and player-side tools. Do not wrap every page section in a bordered card.

## Visual Rules

Keep the palette restrained: tinted neutrals plus teal for primary action,
current state, progress, and success. Avoid decorative gradients, glass effects,
oversized hero treatments inside the app, and repeated identical card grids.

Use 8px rounded surfaces and 4px controls unless a shadcn component already
defines a better accessible shape. Prefer borders and tonal layers over shadows;
reserve shadows for floating elements.

Text hierarchy should be compact and confident. Use large type only on the entry
workspace and major empty states. Inner tool pages use smaller headings and
dense, scannable metadata.

Mobile, tablet, and desktop layouts must be intentional. The sidebar collapses
or becomes a sheet on small screens; content should never depend on hover to be
understood.
