---
type: "Work Item"
title: "GD-TICKET-023: Build the ui commons: tokens, primitives, game widgets and hooks"
description: "Fill the ui package with the UI language's tokens (both themes, the collection-streams piece palette, pattern marks, the three self-hosted faces), the primitives, the game widgets, the layout slots and the hooks, with the token-contrast test."
resource: "../../design/ui-language.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "open"
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
