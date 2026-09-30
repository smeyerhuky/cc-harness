---
type: "Work Item"
title: "GD-STORY-007: Start from home with a handle and my settings"
description: "The home screen with Quick match, Create game and Play a bot; a generated handle (adjective, bird, number) that can be regenerated but not typed; the preferences store on the device; and the settings sheet (US-04)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-TICKET-023.md
  - type: DEPENDS_ON
    target: GD-TICKET-014.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-007: Start from home with a handle and my settings

## Description

The roadmap's M2 todo "Home screen, generated handles, preferences store, settings sheet (US-04)". In M2 only **Play a bot** leads to a match; Quick match and Create game arrive in M3.

## Acceptance Criteria

Quoted verbatim. Handles must also pass the protocol's `handle` schema (`src/protocol/src/schemas.ts`).

From the [PRD](../../product/prd.md#getting-into-a-match), **US-04 A handle without an account**:

- Given I open the game for the first time, then I get a generated handle (an adjective, a bird
  and a number, for example `Brisk Heron 42`) that I can regenerate but not type freely in v1.
- My handle and settings are stored only on my device.

## Linked Artifacts

- [PRD — US-04](../../product/prd.md#getting-into-a-match), [client architecture](../../design/client-architecture.md) ("Where state lives": the Zustand preferences store)
- [UI language — voice and copy](../../design/ui-language.md#voice-and-copy)

## AI PDLC Prompt

Goal: the home screen and preferences. Read `kb/design/client-architecture.md` ("Where state lives") and `kb/design/ui-language.md` ("Voice and copy"). Build the handle generator (word lists, a test that every output passes the protocol's `handle` schema), the persisted Zustand preferences store, the home feature, and the settings sheet's shell, which the control stories fill. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). Home now says **Playing as
Nimble Kestrel 21** with a **New name** button, and **Settings** has sound and motion; both are
kept in this browser and survive a reload.

- **Handles** (`client/state/handles.ts`): 40 adjectives, 40 birds and a number from 1 to 99,
  from `crypto.getRandomValues`: 158,400 names. Each pick is unbiased (`secureInt` keeps only
  the bits it needs and draws again when out of range), after CodeQL flagged the first version's
  scaled draw on pull request #13. A test runs every word pair with the longest
  number through the protocol's `handle` schema. There is no text field anywhere, so a handle
  can be regenerated but never typed.
- **The preferences store** (`client/state/prefs.ts`): Zustand 5.0.15 with `persist`, under
  `garbage-day:prefs`, versioned. On load each saved field is checked and an invalid one takes
  its default, so an edited or stale entry can't break the page. If the browser refuses storage
  (a private window, storage turned off), it falls back to memory: the game works and forgets on
  reload. Sound is off until turned on (US-20). The control stories add their own fields.
- **Motion.** The setting is "Follow my device" or "Reduce motion". `PrefsEffects` passes it to
  the `ui` widgets (`setMotionPreference`, new in `useReducedMotion`) and sets
  `data-motion="reduce"` on the root, which the generated `tokens.css` uses to stop CSS
  animations and transitions.
- **Settings** (`features/settings`): a `SettingsPanel` with the Sound and Motion sections, on
  its own page at `/settings` for now. The in-match sheet uses the same panel when pausing
  arrives, and `GD-STORY-003` adds the Controls section.
- **One found on the way:** checking a stored handle with the protocol's Zod schema put all of
  Zod on the first page (main bundle 111 → 148 KB gzipped). The protocol now has a Zod-free
  `@garbage-day/protocol/handle` (`isHandle`, and the pattern the schema is built from), with a
  test that it agrees with the schema. The main bundle is back to 112 KB.

Checks: 16 new tests (handles 4, preferences 6, the handle check 1, the `ui` motion preference 1,
and 4 route tests driving home and settings through the UI), and the code gates pass (452 unit tests, 4 Worker tests, build). In Chromium, on the production build:

- **Desktop, 1280 × 800.** New name gave a new valid handle. Sound on and Reduce motion set
  `data-motion`, and all three came back after a reload. With `localStorage` throwing, home still
  rendered and New name worked. No page errors.
- **Phone, Pixel 7 profile, dark, reduced motion on.** Home and settings fit with no sideways
  scroll, and the switch works by tap. Android's default tap highlight flashes over the switch's
  row; whether controls replace it with their own pressed state is left to `GD-STORY-004`'s
  phone pass.
