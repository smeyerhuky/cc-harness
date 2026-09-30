---
type: "Work Item"
title: "GD-STORY-003: Play with the keyboard, my way"
description: "Keyboard play on desktop with the default keys and timings from the controls page, every action rebindable, and the auto-repeat delay and rate adjustable, remembered on the device (US-16)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-001.md
  - type: DEPENDS_ON
    target: GD-STORY-007.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-003: Play with the keyboard, my way

## Description

The roadmap's M2 todo "Keyboard controls with rebinding and DAS/ARR settings (US-16)". [`GD-STORY-001`](GD-STORY-001.md) plays with the default keys; this story makes them configurable.

## Acceptance Criteria

Quoted verbatim; the defaults are the controls page's keyboard table.

From the [PRD](../../product/prd.md#controls-and-layout), **US-16 Keyboard play on desktop**:

- The default keys and timings are in [controls and layout](../../product/controls-and-layout.md#keyboard).
- I can rebind every action and change the auto-repeat delay and rate; my choices are remembered
  on this device.

## Linked Artifacts

- [PRD — US-16](../../product/prd.md#controls-and-layout), [controls and layout — keyboard](../../product/controls-and-layout.md#keyboard)
- [Client architecture — input](../../design/client-architecture.md#input)

## AI PDLC Prompt

Goal: configurable keyboard controls. Read `kb/product/controls-and-layout.md` ("Keyboard") and `kb/design/client-architecture.md` ("Input", "Where state lives"). Build `useKeyBindings` with DAS and ARR in engine ticks, a bindings editor in the settings sheet (conflicts refused, reset to defaults), and store them in the preferences store. Test repeat timing with fake timers. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). **Settings → Controls** lists
every action with its keys. A key can be added by pressing it, or removed; the auto-repeat delay
and rate each have a slider; and **Reset controls** puts it all back. The match, the power-up
hint and home's "Press Space to drop" all follow the player's choices, which are kept in this
browser.

- **The rules** (`client/input/bindings.ts`), shared by the settings and the stored preferences.
  A key another action uses is refused, naming that action ("Z is already Rotate
  counter-clockwise. Remove it there first."). Tab and Esc can't be bound. An action has one to
  three keys, so the last one can't be removed. Keys are stored by `KeyboardEvent.code` and named
  as a US keyboard prints them ("Left Ctrl", "←").
- **Capturing a key.** **Add key** listens for the next key press only, ahead of everything else
  on the page. A refused key keeps it listening; Esc stops it, and so does Tab or leaving the
  button. Held-key repeats are ignored. A message line (a live region) says what happened, and
  after a removal, focus goes back to the row's **Add key**.
- **Timings** are kept in milliseconds that are whole engine ticks: delay 50 to 333 ms (default
  167), rate 17 to 100 ms (default 33). `InputController.setTiming` takes them in the match. A
  session test drives frame times and checks that a held move repeats at 250 ms and then every
  100 ms. The session's clock is the animation frame, so the test drives frames rather than fake
  timers.
- **Stored preferences** gain `bindings`, `dasMs` and `arrMs`. A stored map that isn't complete
  and valid, or a timing out of range, falls back to the default.
- **Found on the way:** the timing helpers brought the whole engine onto the first page (112 →
  123 KB gzipped). `engine` and `protocol` now declare `"sideEffects": false`, which is true of
  both, since neither runs anything when loaded. The first page is 114 KB, and the engine loads
  with the match. The ui `Button` now takes a `ref` (React 19 props), and stacked sliders line
  up.

Checks: 22 new tests (bindings 8, controls 8, preferences 2, input 1, session 1, and 2 route
tests: home names the chosen drop key, and a match lets the page see Space but not a rebound
key), and the code gates pass (474 unit tests, 4 Worker tests, build). In Chromium, on the
production build:

- **Desktop, 1280 × 900, keyboard only.** Add key by Enter; Z refused as Rotate
  counter-clockwise's; J added to Hard drop; Hold's fourth key refused; Esc left Move left
  unchanged; Space removed, with focus back on Add key; delay down to 100 ms with the arrow keys.
  After a reload: J and 100 ms, and home said "Press J to drop". In a match, ten Space presses
  did nothing and didn't scroll the page, and J hard-dropped to a top-out in 21 presses. No page
  errors.
- **Phone, Pixel 7 profile, dark, reduced motion.** The rows stack, label above keys, with no
  sideways scroll.

Not in this item: **P** to step away (on the controls page) is bound when pausing arrives in
M4; there is no in-match settings sheet until then either. Key names follow a US layout rather
than the player's own, and the rate stops at one tick (no instant repeat).
