# Product

## Users

Benkyou is for self-directed learners, developers, students, and professionals
who use long-form video as a serious study source. They may be learning from a
tutorial, lecture, walkthrough, talk, or technical explanation, and they need a
workspace that turns passive watching into structured progress.

Users are often returning to dense material over multiple sessions. They need to
find the right chapter quickly, keep notes tied to the moment they are studying,
save important timestamps, and resume without rebuilding context.

## Product Purpose

Benkyou turns long videos into focused study workspaces: chapters, notes,
bookmarks, progress, and resume state.

The Open Beta proves a focused learning loop: paste a supported YouTube URL,
create or open a sample study workspace, study through chapter navigation, write
Markdown notes, save bookmarks, and return later with progress intact. The
product is local-first so the learning loop remains useful before account
creation, while hosted sync can layer on later.

Success looks like a learner moving from an unstructured video to a navigable,
recoverable study workspace in minutes, with every interaction supporting the
next study action.

## Non-Goals

Benkyou is not a general video hosting platform, LMS, social learning network,
or entertainment discovery app. The Open Beta should avoid broad course
marketplaces, instructor tooling, cohort management, public profiles, social
feeds, and content discovery features unless they directly support the focused
study loop.

## Self-Hosted Product Boundary

The public product should remain a complete, self-hostable learning workspace.
Hosted capabilities can layer on separately, but core learning flows should not
depend on hosted-only infrastructure.

Keep billing, hosted quotas, internal operations, hosted telemetry, managed
scaling, and SaaS growth flows out of the core product unless they have a
self-hosted equivalent.

## Brand Personality

Expert, organized, focused.

Benkyou should feel like a serious learning tool: calm, precise, trustworthy,
and efficient. The voice should be direct and helpful, with plain language that
keeps the learner oriented without over-explaining the interface. The product
should project professional confidence rather than entertainment energy.

## Anti-references

Benkyou should not feel like a marketing-first SaaS splash page, a casual
entertainment video app, or noisy gamified edtech.

Avoid oversized hero treatments inside the app, decorative gradients, playful
achievement loops, novelty animations, busy card grids, and vague AI-product
copy. The interface should not bury the learning workflow behind brand theater
or make learners hunt for primary actions.

## Design Principles

1. Start with the workspace. The first screen should make course creation and
   learning action immediately available.
2. Structure is the value. Chapters, notes, bookmarks, and progress should feel
   connected, not like separate tools.
3. Keep cognition on the material. Layout, copy, and controls should reduce
   context switching and visual noise.
4. Local-first means useful now. Anonymous use should feel complete enough to
   prove the core learning loop before sign-in.
5. Recover gracefully. Loading, empty, failed, offline, and save states should
   always explain what happened and offer a next action.

## Accessibility & Inclusion

Target WCAG AA for core app flows. Maintain keyboard access for forms, tabs,
chapter navigation, dialogs, drawers, menus, and player-adjacent controls.

Use visible focus states, accessible labels for icon buttons, color-blind-safe
status indicators, and text that remains legible at small sizes. Respect reduced
motion preferences and avoid motion that distracts from study. Error and save
failure states should be explicit enough to prevent silent data loss.
