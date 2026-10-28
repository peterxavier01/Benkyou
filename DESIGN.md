---
# GENERATED from packages/ui/src/tokens/tokens.ts — do not edit by hand.
name: Benkyou
colors:
  light:
    background: "#f9f6f2" # oklch(0.975 0.006 85)
    foreground: "#1d1a15" # oklch(0.22 0.01 85)
    card: "#fdfcfa" # oklch(0.992 0.003 85)
    muted: "#f0ede8" # oklch(0.948 0.008 85)
    muted-foreground: "#615d56" # oklch(0.48 0.012 85)
    border: "#dddad5" # oklch(0.89 0.008 85)
    input: "#89867f" # oklch(0.62 0.01 85)
    primary: "#00734b" # oklch(0.49 0.112 161)
    primary-foreground: "#f5fef7" # oklch(0.988 0.012 152)
    accent: "#dbf2e5" # oklch(0.94 0.03 161)
    accent-foreground: "#004a2f" # oklch(0.36 0.08 161)
    mark: "#f2af48" # oklch(0.8 0.14 75)
    mark-tint: "#fcedcd" # oklch(0.95 0.045 85)
    mark-ink: "#845011" # oklch(0.48 0.1 65)
    success: "#3a732c" # oklch(0.5 0.12 140)
    warning: "#905211" # oklch(0.5 0.11 60)
    info: "#1f689d" # oklch(0.5 0.11 245)
    destructive: "#be2323" # oklch(0.52 0.19 27)
  dark:
    background: "#151410" # oklch(0.19 0.008 85)
    foreground: "#eae7e2" # oklch(0.93 0.008 85)
    card: "#1f1d18" # oklch(0.23 0.009 85)
    muted: "#292621" # oklch(0.27 0.01 85)
    muted-foreground: "#a7a49e" # oklch(0.72 0.01 85)
    border: "#35332d" # oklch(0.32 0.01 85)
    input: "#77746e" # oklch(0.56 0.01 85)
    primary: "#53bc8b" # oklch(0.72 0.122 161)
    primary-foreground: "#05160d" # oklch(0.18 0.03 161)
    accent: "#173526" # oklch(0.3 0.045 161)
    accent-foreground: "#badeca" # oklch(0.87 0.047 161)
    mark: "#f2af48" # oklch(0.8 0.14 75)
    mark-tint: "#422f13" # oklch(0.32 0.05 75)
    mark-ink: "#edc47d" # oklch(0.84 0.1 80)
    success: "#7bb76e" # oklch(0.72 0.12 140)
    warning: "#e8a95c" # oklch(0.78 0.12 70)
    info: "#6dabdf" # oklch(0.72 0.1 245)
    destructive: "#e77469" # oklch(0.69 0.145 27)
typography:
  sans: Inter
  serif: Source Serif 4
  jp: Noto Serif JP (mark and 済 stamp only)
  display: "serif 600 · 64px / 1.02"
  title: "serif 600 · 32px / 1.15"
  heading: "sans 600 · 18px / 1.3"
  subheading: "sans 600 · 14px / 1.4"
  body: "sans 400 · 14px / 1.5"
  label: "sans 500 · 12px / 1.3"
  prose: "serif 400 · 17px / 1.65"
rounded:
  sm: 2px
  md: 4px
  lg: 8px
  xl: 12px
motion:
  fast: 120ms
  base: 200ms
  ease: "cubic-bezier(0.16, 1, 0.3, 1)"
spacing:
  unit: 4px
  page-mobile: 16px
  page-desktop: 24px
  content-max: 1280px
  prose-measure: 68ch
---

## Brand Direction

Benkyou is a quiet, premium learning workspace. It should feel expert,
organized, focused, and useful immediately. The UI serves the study task. It
should not feel like a marketing SaaS page, a video entertainment app, or noisy
gamified edtech.

Benkyou feels like a well-kept study notebook: warm paper, ink, one teal for
what to do next, and amber for what the learner marked. Use restrained color,
precise spacing, strong text hierarchy, and familiar product patterns.

The user-facing noun is **notebook** (one per video); collections are
**shelves**. Avoid "workspace", "surface", "recoverable", and "local-first" in
UI copy; say "saved on this device" instead. Those terms belong on the
self-hosting page.

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

All values live in `packages/ui/src/tokens/tokens.ts`. The frontmatter above
and `packages/ui/src/styles/tokens.css` are generated from it; `pnpm check`
fails if they drift or if a contrast pair drops below WCAG AA.

**Color marks action and attention; shape marks state.**

- Neutrals use one warm hue. Never introduce a second neutral hue.
- Teal (`primary`) is for the one primary action per view, links, the
  playhead and played portion, and the current chapter (`accent` tint).
- Amber (`mark`) is only for things the learner marked: bookmarks and
  highlights.
- Chapter states are told apart by shape: empty circle (not started), partial
  ring (in progress), filled teal play disc (now playing), ink 済 stamp
  (completed). Completed is ink, not green.
- Status colors (`success`, `warning`, `info`, `destructive`) always ship
  with an icon. `success` is close to teal in hue, so the icon carries meaning.
- Control borders use `input` (≥ 3:1). `border` is for decorative dividers
  only. Focus is a solid `ring`, never translucent.
- Avoid decorative gradients, glass effects, oversized hero treatments inside
  the app, and repeated identical card grids. The genkō grid (`grid`) appears
  only on the entry page and empty states.

Radius: 2px chips, 4px controls, 8px panels, 12px page-level cards. Prefer
borders and tonal layers over shadows; `shadow-raised` for popovers and menus,
`shadow-overlay` for dialogs. Motion is 120ms (`--duration-fast`) or 200ms
(`--duration-base`) with `ease-out`, and zero under reduced motion.

## Typography

Inter (`font-sans`) runs the interface. Source Serif 4 (`font-serif`) carries
notes, the entry headline, notebook titles, and major empty states. Notes use
`text-prose` (17px / 1.65) capped at `--prose-measure` (68ch). Every time,
duration, and count uses `tabular-nums`. Noto Serif JP is loaded for three
glyphs only: 勉 in the mark, and 済 in the completed stamp.

Text hierarchy should be compact and confident. Use large type only on the entry
workspace and major empty states. Inner tool pages use smaller headings and
dense, scannable metadata.

Mobile, tablet, and desktop layouts must be intentional. The sidebar collapses
or becomes a sheet on small screens; content should never depend on hover to be
understood.
