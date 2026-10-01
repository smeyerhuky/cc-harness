---
type: "Work Item"
title: "GD-STORY-008: Accessible by default"
description: "Keyboard operability with visible focus everywhere, pieces, gems and garbage told apart by pattern and shape, reduced motion turning off shakes, flights and confetti, sound off until turned on, and an axe scan of every M2 screen (US-20)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-002.md
  - type: DEPENDS_ON
    target: GD-STORY-007.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-008: Accessible by default

## Description

The roadmap's M2 todo "Reduced motion, sound toggle, keyboard operability, axe scan (US-20); the developer overlay". The overlay is [`GD-TICKET-024`](GD-TICKET-024.md).

## Acceptance Criteria

Quoted verbatim. Also: an axe scan of every M2 screen reports no violations (roadmap M2; [stack and CI — tests](../../design/stack-and-ci.md#tests)).

From the [PRD](../../product/prd.md#across-the-whole-game), **US-20 Accessible by default**:

- Everything is operable by keyboard; focus is always visible.
- Garbage, gems and pieces are told apart by pattern and shape as well as colour.
- Reduced-motion settings turn off shakes, flying attacks and confetti; sound is off until the
  player turns it on.

## Linked Artifacts

- [PRD — US-20](../../product/prd.md#across-the-whole-game), [UI language](../../design/ui-language.md) (pattern marks, motion, sound)

## AI PDLC Prompt

Goal: accessibility across M2. Read the PRD's US-20 and `kb/design/ui-language.md` ("Colour tokens", "Motion", "Sound"). Audit every M2 screen for keyboard paths and focus styles, honour `prefers-reduced-motion` plus the in-app override, and keep sound off by default. Add a Playwright job step with `@axe-core/playwright` over each screen. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). Every M2 screen passes an axe
scan in both themes, every control works from the keyboard with a visible ring, and a screen
change now names the new screen.

- **The scan:** `axe-core` 4.13.0 runs inside Vitest's browser mode, in Chromium, with the WCAG
  2.0 and 2.1 A and AA rules. It renders the app's own routes with the real token CSS: home, Play
  a bot, settings, create a game, a game code, a bad code, an unknown page, a match and then its
  result, and a match on a phone (412 × 915) with the button pad. That is 9 screens in 2 themes:
  18 scans, no violations. A control test shows the scan does catch a nameless button and
  low-contrast text, so a clean result means something. It runs in the existing `test-browser`
  CI job (`pnpm test:browser`).
- **Deviation from this item's prompt:** it asked for `@axe-core/playwright` in a Playwright job.
  That package drives a Playwright end-to-end suite, which is M3's (two browsers against a real
  server). `axe-core` in browser mode needs no server and uses the existing job. M3's end-to-end
  suite can add `@axe-core/playwright` for the screens that need a server. Recorded in
  [stack and CI](../../design/stack-and-ci.md#tests).
- **What the scan found:** the accent as text was 4.35:1 on the light page, under AA's 4.5:1.
  This is the local player's name in the match header and on the result card. The light accent
  is now `#BE3A15`: 4.73:1 on the page and 5.22:1 on cards. Both pairs joined the token contrast
  tests ([UI language](../../design/ui-language.md)).
- **What the keyboard walkthrough found:**
  - The button pad and the power button worked only by pointer. Enter and Space now press them,
    one step per press, as a tap does.
  - They lacked the focus ring every other control has. They now have it.
- **Screen names:** the screens are routes in one page with one fixed title, so a screen change
  renamed nothing and a screen reader heard nothing. Each route now names its screen (`AppShell`,
  [client architecture](../../design/client-architecture.md)). The tab title follows ("Play a bot
  · Garbage Day"), and a polite live region says the new name.
- **Already in place, checked again:**
  - Pieces each carry a pattern mark, garbage is hatched, and a gem is a white diamond
    ([`GD-TICKET-023`](GD-TICKET-023.md)).
  - Reduced motion turns off shakes, attack flights, confetti and touch marks. This applies to
    the device setting and to the in-app Motion override.
  - Sound is off until the player turns it on ([`GD-STORY-007`](GD-STORY-007.md)).

Checks:

- Seven new unit tests:
  - the pad by keyboard;
  - screen titles and the announcement;
  - the unknown page's title;
  - the two accent pairs in both themes.
- The 19 browser scans.
- The code gates pass: 556 unit tests, 4 Worker tests, and the build. The browser tests pass: 10
  golden replays and 19 scans.

The device check, in Chromium on the production build:

- **Desktop, keyboard only (Tab and Enter):**
  - Home's first stops are New name, then Play a bot. Enter, Tab to Rookie, and Enter starts the
    match.
  - The arrows and Space play.
  - Tab reaches Leave, whose ring shows, and Space there still hard-drops rather than leaving.
  - At the result, focus is on the card. Tab reaches Rematch (ring shown), and Enter starts a new
    match.
  - Tab to Leave and Enter go home.
  - The tab's title follows: "Play a bot · Garbage Day", then "Match · Garbage Day", then
    "Garbage Day".
  - No stop lacked a ring.
- **Phone (Pixel 7 profile), dark, reduced motion, button pad on:**
  - Tab reaches Leave, then the pad keys in order, each with its ring, and Enter presses them.
  - No touch marks, and no running animations.
  - At the result: no confetti, and focus is on the card.
