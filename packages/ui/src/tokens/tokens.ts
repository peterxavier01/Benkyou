/**
 * Benkyou design tokens — the single source of truth.
 *
 * Edit values here, then run `pnpm --filter @benkyou/ui tokens`.
 * That regenerates `src/styles/tokens.css` and the frontmatter of the root
 * `DESIGN.md`. `pnpm check` fails if either is stale or if a required
 * contrast pair drops below its WCAG minimum.
 *
 * Rules the values encode:
 * - Neutrals share one warm "paper" hue (85°). Never mix neutral hues.
 * - Teal (161°) marks action and the current moment only.
 * - Amber ("mark") is reserved for things the learner marked: bookmarks,
 *   highlights. Nothing else uses it.
 * - Status colors (success/warning/info/destructive) never appear without an
 *   icon; success sits close to teal in hue, so the icon carries the meaning.
 * - State is carried by shape (stamp, ring, playhead), not color alone.
 */

/** oklch lightness (0–1), chroma, hue (degrees). */
export type Oklch = readonly [l: number, c: number, h: number];

const PAPER_HUE = 85;
const TEAL_HUE = 161;

const n = (l: number, c = 0.008): Oklch => [l, c, PAPER_HUE];
const teal = (l: number, c: number): Oklch => [l, c, TEAL_HUE];

/** Role names follow shadcn so existing components keep working. */
export type ColorRole =
	| "background"
	| "foreground"
	| "card"
	| "card-foreground"
	| "popover"
	| "popover-foreground"
	| "primary"
	| "primary-foreground"
	| "secondary"
	| "secondary-foreground"
	| "muted"
	| "muted-foreground"
	| "accent"
	| "accent-foreground"
	| "destructive"
	| "destructive-foreground"
	| "border"
	| "input"
	| "ring"
	| "grid"
	| "mark"
	| "mark-foreground"
	| "mark-tint"
	| "mark-ink"
	| "success"
	| "warning"
	| "info"
	| "chart-1"
	| "chart-2"
	| "chart-3"
	| "chart-4"
	| "chart-5"
	| "sidebar"
	| "sidebar-foreground"
	| "sidebar-primary"
	| "sidebar-primary-foreground"
	| "sidebar-accent"
	| "sidebar-accent-foreground"
	| "sidebar-border"
	| "sidebar-ring";

export type Palette = Record<ColorRole, Oklch>;

const lightBase = {
	background: n(0.975, 0.006), // paper
	foreground: n(0.22, 0.01), // ink — also the completed-chapter stamp
	card: n(0.992, 0.003), // surface
	muted: n(0.948), // sunken: wells, chips, code
	"muted-foreground": n(0.48, 0.012),
	primary: teal(0.49, 0.112),
	"primary-foreground": [0.988, 0.012, 152],
	accent: teal(0.94, 0.03), // current chapter / selected nav
	"accent-foreground": teal(0.36, 0.08),
	destructive: [0.52, 0.19, 27],
	"destructive-foreground": [0.986, 0.008, 27],
	border: n(0.89), // decorative dividers only
	input: n(0.62, 0.01), // control boundaries: must stay ≥ 3:1
	grid: n(0.925, 0.01), // genkō grid lines (entry + empty states)
	mark: [0.8, 0.14, 75],
	"mark-tint": [0.95, 0.045, 85],
	"mark-ink": [0.48, 0.1, 65],
	success: [0.5, 0.12, 140],
	warning: [0.5, 0.11, 60],
	info: [0.5, 0.11, 245],
	sidebar: n(0.958),
} satisfies Partial<Palette>;

const darkBase = {
	background: n(0.19),
	foreground: n(0.93),
	card: n(0.23, 0.009),
	muted: n(0.27, 0.01),
	"muted-foreground": n(0.72, 0.01),
	primary: teal(0.72, 0.122),
	"primary-foreground": teal(0.18, 0.03),
	accent: teal(0.3, 0.045),
	"accent-foreground": teal(0.87, 0.047),
	destructive: [0.69, 0.145, 27],
	"destructive-foreground": [0.16, 0.028, 27],
	border: n(0.32, 0.01),
	input: n(0.56, 0.01),
	grid: n(0.25, 0.01),
	mark: [0.8, 0.14, 75],
	"mark-tint": [0.32, 0.05, 75],
	"mark-ink": [0.84, 0.1, 80],
	success: [0.72, 0.12, 140],
	warning: [0.78, 0.12, 70],
	info: [0.72, 0.1, 245],
	sidebar: n(0.21),
} satisfies Partial<Palette>;

/** Derive the aliased roles so they can never drift from their source. */
function complete(b: Record<keyof typeof lightBase, Oklch>): Palette {
	return {
		...b,
		"card-foreground": b.foreground,
		popover: b.card,
		"popover-foreground": b.foreground,
		secondary: b.muted,
		"secondary-foreground": b.foreground,
		ring: b.primary,
		"mark-foreground": lightBase.foreground, // ink on amber in both themes
		"chart-1": b.primary,
		"chart-2": b.info,
		"chart-3": b.mark,
		"chart-4": [b.primary[0], 0.09, 196],
		"chart-5": b.destructive,
		"sidebar-foreground": b.foreground,
		"sidebar-primary": b.primary,
		"sidebar-primary-foreground": b["primary-foreground"],
		"sidebar-accent": b.accent,
		"sidebar-accent-foreground": b["accent-foreground"],
		"sidebar-border": b.border,
		"sidebar-ring": b.primary,
	};
}

export const color = {
	light: complete(lightBase),
	dark: complete(darkBase),
} as const;

/**
 * Selectors that receive the dark palette. The fullscreen player reuses it
 * instead of hard-coding its own values.
 */
export const darkSelectors = [
	".dark",
	"[data-course-player-surface]:fullscreen",
	"[data-course-player-surface]:-webkit-full-screen",
] as const;

/** Pairs checked on every build: [text-ish role, behind role, min ratio]. */
export const contrastPairs: ReadonlyArray<
	readonly [ColorRole, ColorRole, number]
> = [
	["foreground", "background", 4.5],
	["foreground", "card", 4.5],
	["muted-foreground", "background", 4.5],
	["muted-foreground", "muted", 4.5],
	["primary", "background", 4.5], // links
	["primary-foreground", "primary", 4.5],
	["accent-foreground", "accent", 4.5],
	["destructive", "background", 4.5],
	["destructive-foreground", "destructive", 4.5],
	["input", "background", 3], // WCAG 1.4.11 non-text contrast
	["ring", "background", 3],
	["mark-ink", "mark-tint", 4.5],
	["mark-foreground", "mark", 4.5],
	["success", "background", 4.5],
	["warning", "background", 4.5],
	["info", "background", 4.5],
];

export const radius = {
	sm: "0.125rem", // chips, timestamp tags
	md: "0.25rem", // controls
	lg: "0.5rem", // panels
	xl: "0.75rem", // page-level cards
} as const;

export const shadow = {
	raised: "0 4px 12px oklch(0.22 0.01 85 / 0.08)", // popovers, menus
	overlay: "0 16px 40px oklch(0.22 0.01 85 / 0.16)", // dialogs
} as const;

export const motion = {
	fast: "120ms", // hover, press
	base: "200ms", // panels, menus
	ease: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const zIndex = {
	sticky: 10,
	dropdown: 40,
	overlay: 50,
	toast: 60,
} as const;

export const font = {
	sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
	serif: '"Source Serif 4", "Iowan Old Style", Georgia, serif',
	mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
	jp: '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif',
} as const;

/** Becomes Tailwind `text-*` utilities, e.g. `text-display`, `text-prose`. */
export const type = {
	display: {
		size: "4rem",
		lineHeight: "1.02",
		tracking: "-0.02em",
		weight: 600,
		family: "serif",
	},
	title: {
		size: "2rem",
		lineHeight: "1.15",
		tracking: "-0.01em",
		weight: 600,
		family: "serif",
	},
	heading: {
		size: "1.125rem",
		lineHeight: "1.3",
		tracking: "0",
		weight: 600,
		family: "sans",
	},
	subheading: {
		size: "0.875rem",
		lineHeight: "1.4",
		tracking: "0",
		weight: 600,
		family: "sans",
	},
	body: {
		size: "0.875rem",
		lineHeight: "1.5",
		tracking: "0",
		weight: 400,
		family: "sans",
	},
	label: {
		size: "0.75rem",
		lineHeight: "1.3",
		tracking: "0",
		weight: 500,
		family: "sans",
	},
	prose: {
		size: "1.0625rem",
		lineHeight: "1.65",
		tracking: "0",
		weight: 400,
		family: "serif",
	},
} as const;

export const layout = {
	spacingUnit: "4px",
	pageMobile: "16px",
	pageDesktop: "24px",
	contentMax: "1280px",
	proseMeasure: "68ch",
} as const;
