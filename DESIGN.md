---
name: Benkyou
colors:
  surface: "#f7f9fb"
  surface-dim: "#d8dadc"
  surface-bright: "#f7f9fb"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f2f4f6"
  surface-container: "#eceef0"
  surface-container-high: "#e6e8ea"
  surface-container-highest: "#e0e3e5"
  on-surface: "#191c1e"
  on-surface-variant: "#3d4943"
  inverse-surface: "#2d3133"
  inverse-on-surface: "#eff1f3"
  outline: "#6d7a73"
  outline-variant: "#bccac1"
  surface-tint: "#006c4e"
  primary: "#00694c"
  on-primary: "#ffffff"
  primary-container: "#008560"
  on-primary-container: "#f5fff7"
  inverse-primary: "#68dbae"
  secondary: "#545f73"
  on-secondary: "#ffffff"
  secondary-container: "#d5e0f8"
  on-secondary-container: "#586377"
  tertiary: "#993f3a"
  on-tertiary: "#ffffff"
  tertiary-container: "#b85751"
  on-tertiary-container: "#fffbff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#86f8c9"
  primary-fixed-dim: "#68dbae"
  on-primary-fixed: "#002115"
  on-primary-fixed-variant: "#00513a"
  secondary-fixed: "#d8e3fb"
  secondary-fixed-dim: "#bcc7de"
  on-secondary-fixed: "#111c2d"
  on-secondary-fixed-variant: "#3c475a"
  tertiary-fixed: "#ffdad6"
  tertiary-fixed-dim: "#ffb3ad"
  on-tertiary-fixed: "#410003"
  on-tertiary-fixed-variant: "#7e2a27"
  background: "#f7f9fb"
  on-background: "#191c1e"
  surface-variant: "#e0e3e5"
typography:
  h1:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "600"
    lineHeight: "1.4"
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.6"
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: 0em
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: "1.2"
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "700"
    lineHeight: "1"
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max-width: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The brand personality is **Expert, Organized, and Focused**. The design system
is built to minimize cognitive load, allowing learners to enter a state of "deep
work." It prioritizes information density over decorative flair, ensuring every
element on the screen serves a functional purpose.

The visual style is **Corporate / Modern** with a strong leaning toward
**Minimalism**. It uses a "utilitarian-premium" aesthetic—high-quality
typography and precise spacing that suggests a professional tool rather than a
casual entertainment app. The UI is quiet and predictable, instilling confidence
in the user that the platform is a serious environment for skill acquisition.

## Colors

The palette is anchored by a **Confident Teal** (#1D9E75) used exclusively for
primary actions and progress indicators. This color symbolizes growth and
professional competence.

The background strategy utilizes **Calm Neutrals**. A crisp white (#FFFFFF) is
used for the main content area, while a very light Slate-Gray (#F8FAFC)
distinguishes sidebars and navigation panels. **Dark Slate** (#0F172A and
#1E293B) provides high-contrast legibility for headings and body text, ensuring
a serious and readable interface. Semantic colors (reds/yellows) should be used
sparingly, reserved only for critical errors or urgent warnings.

## Typography

This design system uses **Inter** for all text levels to leverage its
exceptional readability and systematic feel. The hierarchy is established
through intentional weight shifts rather than excessive size variations.

- **Headlines:** Use Bold (700) or Semi-Bold (600) weights with slightly tight
  letter spacing to create a compact, authoritative look.
- **Body:** Use Regular (400) weight for maximum legibility in long-form lesson
  content.
- **Metadata:** Smaller labels use Medium (500) or Semi-Bold (600) to ensure
  they stand out even at 11px or 12px.
- **Interactive Elements:** Buttons and navigation links use Semi-Bold to
  distinguish them from static text.

## Layout & Spacing

The layout follows a **Fixed Grid** model for the main dashboard (max 1280px) to
prevent line lengths from becoming unreadable on ultra-wide monitors. It employs
a rigorous **4px baseline grid**.

Information density is high but clear. We use a "Sidebar + Header + Content"
structure. The sidebar and main content area are separated by clean, 1px borders
rather than wide gaps. Internal component spacing (padding) is tight (8px-16px)
to allow more content to be visible above the fold, facilitating better
cross-referencing of notes and video content.

## Elevation & Depth

This design system avoids heavy shadows and skeuomorphism. Depth is communicated
through **Tonal Layers** and **Low-contrast Outlines**.

- **Level 0 (Background):** White (#FFFFFF) for the primary workspace.
- **Level 1 (Secondary Surface):** Very light gray (#F8FAFC) for navigation bars
  and side panels.
- **Level 2 (Interactive Cards):** White surfaces with a 1px border (#E2E8F0).
- **Shadows:** Use only one "soft" shadow for floating elements like dropdowns
  or active modals: `0px 4px 12px rgba(15, 23, 42, 0.08)`. For standard cards,
  no shadow is required—use the border for definition.

## Shapes

The shape language is disciplined and geometric. We use a **Soft (0.25rem /
4px)** base roundedness.

- **Standard (4px):** Buttons, Input fields, Checkboxes.
- **Large (8px):** Course cards, Video player containers, Modals.
- **Pill:** Reserved exclusively for "In Progress" or "Status" tags to
  distinguish them from actionable buttons.

Corners should never be fully sharp (0px) to avoid a "harsh" institutional feel,
but they should never be overly rounded (2+) to maintain the serious,
productivity-focused aesthetic.

## Components

- **Buttons:** Primary buttons are solid Teal (#1D9E75) with white text.
  Secondary buttons use a Slate-Gray outline. No gradients.
- **Cards:** Subtle 1px border (#E2E8F0), 8px corner radius, and 16px internal
  padding. Cards are used to group chapters or resource links.
- **Inputs:** Clean 1px borders. Focus state uses a 1px Teal border and a 2px
  soft Teal glow.
- **Functional Icons:** Use a consistent 1.5pt stroke weight. Icons (Video,
  Document, Note, Check) must be monochrome slate unless active, where they take
  on the Teal accent.
- **Progress Bars:** Thin 4px tracks. The filled portion is the confident Teal,
  while the track is a light gray (#E2E8F0).
- **Navigation:** Vertical navigation in the sidebar is preferred for course
  structures. Active items are indicated by a subtle background tint (#F1F5F9)
  and a 3px Teal left-border "indicator."
- **Notes Component:** A dedicated, dense text area with a monospaced font
  option for code snippets or technical definitions.
