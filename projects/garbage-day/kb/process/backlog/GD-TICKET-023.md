---
type: "Work Item"
title: "GD-TICKET-023: Build the ui commons: tokens, primitives, game widgets and hooks"
description: "Fill the ui package with the UI language's tokens (both themes, the collection-streams piece palette, pattern marks, the three self-hosted faces), the primitives, the game widgets, the layout slots and the hooks, with the token-contrast test."
resource: "../../design/ui-language.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../../design/ui-language.md
---

# GD-TICKET-023: Build the ui commons: tokens, primitives, game widgets and hooks

## Description

The first M2 todo on the [roadmap](../roadmap.md). Every M2 screen is built from the `ui`
package ([client architecture — packages](../../design/client-architecture.md#packages-and-folders)),
which today holds only the token stylesheet, the display font and `Kbd`. The
[UI language](../../design/ui-language.md) fixes the tokens, faces and widgets.

## Acceptance Criteria

- `tokens.ts` holds every colour token of the UI language in light and dark, and `tokens.css` is
  generated from it. Dark applies under `prefers-color-scheme: dark` and `[data-theme="dark"]`.
- The seven pieces use the collection-streams palette, each with its pattern mark; garbage is
  hatched and gems carry the white diamond. No piece uses its guideline colour.
- A unit test checks every token pair the UI relies on in both themes: each piece colour reaches
  at least 3:1 against `--well`, and text pairs reach 4.5:1.
- Big Shoulders Display, Public Sans and IBM Plex Mono are self-hosted from `@fontsource`, with the
  demo's fallback stacks and the type scale.
- The primitives, game widgets (`BoardCanvas`, `PieceGlyph`, `Meter`, `SpeedChip`, `HoldSlot`,
  `NextQueue`, `PowerSlot`, `Countdown`, `ShowdownBanner`, `Popup`, `AttackFlight`, `BoardCover`,
  `PresenceChip`, `PowerIcon`), `StageLayout` and the hooks listed in the client architecture
  exist. Each has a component test, and the widgets have stories of their states in a test page.
- UI code uses tokens only, never literal colours (definition of done, project item 2). The code
  gates pass.

## Linked Artifacts

- [UI language](../../design/ui-language.md) (colour tokens, type, the board and its widgets,
  motion), [client architecture](../../design/client-architecture.md)
- The proof of concept's canvas renderer in `spikes/proof-of-concept/`

## AI PDLC Prompt

Goal: build the `ui` commons. Read `kb/design/ui-language.md` in full and
`kb/design/client-architecture.md` ("Packages and folders", "Rendering", "Input"). Port the
canvas cell rendering (bevels, ghost, hatch, gem diamond, clear flash) from the proof of concept
in `spikes/proof-of-concept/`. Build `src/ui/src/tokens/` (`tokens.ts` plus a generator for
`tokens.css`), `primitives/`, `game/`, `layout/` and `hooks/`, each exported from `src/ui/src/index.ts`,
with component tests in happy-dom and the contrast test. Check each new dependency against the
npm registry (newest, at least a day old). Run the code gates. Done when the criteria hold, the KB
gates pass, this item is `done` with a Resolution, the backlog index and roadmap agree, and the
journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). The `ui` package now holds the
whole commons, exported from `src/ui/src/index.ts`, with 128 tests (it had 1):

- **Tokens.** `tokens.ts` is the one source: every colour in both themes, the collection-streams
  piece palette and pattern marks, power-up colours, the three faces, the type scale, motion
  durations and vibration lengths. `tokens.css` is generated from it
  (`pnpm --filter @garbage-day/ui tokens:update`), and a test fails if they differ. The contrast
  test checks 35 pairs in each theme: 4.5:1 for text, 3:1 for pieces, gems, garbage and status
  colours. It also checks that no piece uses a guideline colour.
- **Fonts.** Public Sans 400–700 and IBM Plex Mono 400–600 join Big Shoulders Display 800–900,
  all `@fontsource` 5.3.0, the newest release at least a day old.
- **Primitives:** `Button`, `IconButton`, `Chip`, `Card`, `Dialog` (native `<dialog>`, with the
  hazard band), `Sheet`, `Popover` (the Popover API), `Toggle` (a real switch), `Select`,
  `Slider`, `Stepper`, `Toast`, `Kbd` and `VisuallyHidden`, with one focus ring throughout.
- **Game widgets:** `BoardCanvas` draws each frame outside React through `draw.ts`, ported from
  the proof of concept's renderer: bevels, pattern marks, the hatched garbage sprite, pulsing gems,
  the ghost, the clear flash, the garbage rise and fog, each with its reduced-motion version. Also
  `PieceGlyph`, `PowerIcon`, `Meter`, `SpeedChip`, `PresenceChip`, `HoldSlot`, `NextQueue`,
  `PowerSlot`, `Countdown`, `ShowdownBanner`, `Popup`, `AttackFlight` and `BoardCover`.
- **Layout:** `StageLayout` (marked `data-stage`, with the feed at 1600 px), `ScreenFrame` and
  `ThumbZone`.
- **Hooks:** `useReducedMotion` (with the player's override), `usePageVisibility`, `useWakeLock`,
  `useHaptics`, `useResizeObserver`, `useAnimationFrame` and `useInterval`, plus
  `useColorScheme` and `useMediaQuery`.
- **Gallery:** `src/ui/src/gallery/Gallery.tsx` shows every token and widget in its states on
  the page and on a stage, with theme and motion switches. The app loads it lazily at `/gallery`.

Deviations and findings:

- **`useKeyBindings` and `useGestures` are not here.** The criteria asked for every hook in the
  client architecture, but [`GD-STORY-003`](GD-STORY-003.md) and [`GD-STORY-004`](GD-STORY-004.md)
  already build them with the input they serve. The client architecture now says so.
- **The stage's content colours.** Light-theme status colours fail on the always-dark cabinet
  (light `--bad` is 2.65:1). Inside `[data-stage]` the content colours take their dark values, and
  the UI language records the rule. The test checks the stage pairs on each theme's own cabinet.
- **Two tokens the UI language lacked:** `--well-ink` (from the demo) and `--accent-ink` (already
  in `tokens.css`) are now in its table.
- **Tree-shaking.** Importing `Kbd` pulled every widget into the shell's bundle (221 → 248 KB).
  The package now declares `"sideEffects": ["**/*.css"]`, the main bundle is 223 KB again, and the
  widgets load with the gallery.

Checks: the code gates pass (398 unit tests in all, 4 Worker tests, build). Screenshots of
`/gallery` from `vite preview` at phone portrait (390 × 844, light), phone landscape (844 × 390,
dark), 1280 × 900 (light) and 1920 × 1080 (dark) show the fonts, both themes, the stage in dark
content colours, and no page errors. They also led to one fix: the meter's count now sits above
the waiting rows. Keyboard and reduced-motion behaviour is covered by the tests. The board's size
on a phone stage is [`GD-STORY-005`](GD-STORY-005.md)'s job, and no physical-device check was
possible from the session; the owner can open `/gallery` on the next preview.
