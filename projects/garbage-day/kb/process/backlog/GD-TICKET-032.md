---
type: "Work Item"
title: "GD-TICKET-032: Wait long enough in the app's tests for a loaded CI runner"
description: "The app's tests wait for screens with Testing Library's 1 s default, which a busy CI runner outlasts: the same commit's test job passed in one run and failed in the other."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "ci"]
timestamp: "2026-10-01"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-scaffold.md
---

# GD-TICKET-032: Wait long enough in the app's tests for a loaded CI runner

## Description

Found while building [`GD-STORY-012`](GD-STORY-012.md). At `7f34eee` the pull request's
`test` job passed and the push's failed on the same commit. The failing test was the developer
overlay's in `client/App.test.tsx`: its lazy chunk didn't appear within `findByRole`'s 1 s.
[`GD-STORY-008`](GD-STORY-008.md) met the same thing once before, with the tab title.

## Acceptance Criteria

- The cause is shown: the client tests fail under CPU load as they did in CI, and pass under the
  same load once fixed.
- The fix is in one place, not a timeout per test.

## Linked Artifacts

- `src/app/test/setup.ts`, `src/app/vitest.config.ts`, `src/app/client/App.test.tsx`

## AI PDLC Prompt

Goal: client tests that don't depend on the runner's speed. Reproduce under load, fix once in the
setup, and check under the same load. Done when the criteria hold and the code gates pass.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md).

- **Reproduced.** The client tests ran with twelve busy loops on four cores. A different App
  test failed, the screen-title one, after 1.6 s. The cause is shared: these tests render whole
  screens, some loaded lazily, and wait for them with Testing Library's 1 s default.
- **The fix:**
  - `test/setup.ts` sets the async wait to 4 s, so a wait fails only if what it waits for never comes;
  - `vitest.config.ts` gives each app test 15 s, for tests that wait several times;
  - the overlay test also loads its lazy chunk before pressing the key.
- **Checked:** the client tests passed twice under the same load (165 of 165), and the code gates
  pass.
