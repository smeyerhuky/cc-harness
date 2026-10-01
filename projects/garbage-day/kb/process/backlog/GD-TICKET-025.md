---
type: "Work Item"
title: "GD-TICKET-025: Take shadows, scrims and tints from tokens"
description: "Seventeen CSS rules in the ui commons and the match screen use literal translucent black or white for shadows, scrims and tints, against the definition of done's rule that colours come from tokens; give them tokens, or record why they are exempt."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "UI"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-scaffold.md
---

# GD-TICKET-025: Take shadows, scrims and tints from tokens

## Description

Found while building [`GD-TICKET-024`](GD-TICKET-024.md) ([the journal](../journal/2026-09-30-scaffold.md)).
The project's [definition of done](../definition-of-done.md) says UI code uses the UI language's
CSS custom properties, "never literal colours". The overlay's panel shadow copied the result
card's `rgb(0 0 0 / 0.4)`, and a search found 17 such rules:

- In the `ui` commons: the slots, the HUD, the game overlays (popups, the countdown), and the
  dialog, popover and toast primitives.
- In the match screen: the touch marks, the board cover, and the result card's shadow.

They are shadows, scrims and tints, each a translucent black or white, plus one `#fff`. None
fails a contrast check, but none changes with the theme, and the token tests can't see them. The
overlay's shadow was dropped instead, so this item adds no new rule.

## Acceptance Criteria

- Every shadow, scrim and tint in the CSS under `src/ui/src` and `src/app/client` comes from a
  token in `tokens.ts`, set for both themes, or the definition of done names the exception and
  why.
- `grep -rnE 'rgb\(|#[0-9a-fA-F]{3,8}\b' --include=*.css src/ui/src src/app/client` finds nothing
  outside the generated `tokens.css`, or only the named exceptions.
- The UI language's colour tokens list the new tokens. The token tests and the accessibility
  scan pass, and screenshots of a match, its result and the phone layout look the same in both
  themes.

## Linked Artifacts

- [UI language — colour tokens](../../design/ui-language.md#colour-tokens),
  [definition of done](../definition-of-done.md) (project item 2)

## AI PDLC Prompt

Goal: no literal colours in the CSS. Read the UI language's "Colour tokens" and the token
generator in `src/ui/src/tokens/tokens.ts`. List each literal and name what it is for (a shadow,
a scrim over a board, a tint on a slot), then add the fewest tokens that cover them, light and
dark. Regenerate `tokens.css` with `tokens:update`. Run the code gates and the browser tests, and
compare screenshots before and after. Done when the criteria hold, the KB gates pass, this item
is `done` with a Resolution, the backlog index and roadmap agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). The CSS under `src/ui/src`
and `src/app/client` has no literal colour left: the search in the criteria finds nothing outside
the generated `tokens.css`.

- **What the 17 literals became:**
  - **Seven effect tokens** (`EFFECTS` in `tokens.ts`, the same in both themes): `--shadow`, `--shadow-deep`, `--scrim`, `--tint`, `--tint-strong`, `--tint-line` and `--touch-mark` ([UI language](../../design/ui-language.md#colour-tokens)).
  - **Similar values merged into one:**
    - Shadows at 0.25 to 0.35 became `--shadow`.
    - Shadows at 0.4 to 0.6 became `--shadow-deep`.
    - The two scrims became `--scrim`.
    - The touch streak's gradient now ends at `--touch-mark` (0.55, from 0.45).
  - **The pause cover's hatch** uses `--well-grid` and `--well`, so it matches the board in each theme.
- **One was a colour, not an effect.** The sudden-death banner set `#fff` on `--bad`. On the stage, `--bad` is the dark theme's coral in both themes, so the banner read 3.24:1. That passes only as large text.
  - It now uses a new `--bad-ink`: white on the page's `--bad`, dark ink on the stage's coral, 5.88:1. It is listed with the other inks the stage darkens.
  - Its contrast pairs are tested on the page and on the stage.
- **What the scan caught:** at first `--tint` was 0.06, the HUD's value, up from the slots' 0.05. axe then failed the light theme's match: the rival's "hidden" caption, muted on the tinted cabinet, fell under 4.5:1. The tint is back at 0.05 (4.66:1).
  - A new token test blends the tint over the cabinet in both themes. It requires 4.6:1 for muted and ink text on it, a margin for the browser's own blending. The test would have failed at 0.06 (4.51:1).
- **The gallery** shows the effects next to the colours, each over the cabinet.

Checks:

- Seven new unit tests: the banner's pair on the page and on the stage, in both themes, and the blended-tint check.
- The code gates pass: 577 unit tests, 4 Worker tests, and the build.
- The browser tests pass: 10 golden replays and 21 scans in both themes.

The device check, in Chromium on the production build, before and after, in both themes, with reduced motion:

- **Screens shot:** the gallery, a match, its result, and a Pixel 7 match.
- **What looked the same:** the result card, the slots, the meter, the countdown and the dialogs.
- **What changed:** the shadows differ by a few hundredths of opacity, which can't be seen. The gallery grew by its effects row. The matches differ only by their random pieces.
