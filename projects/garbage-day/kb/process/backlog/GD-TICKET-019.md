---
type: "Work Item"
title: "GD-TICKET-019: Run the golden replays in real browsers"
description: "Run the engine's golden replays in Chromium, Firefox and WebKit through Vitest's browser mode, locally and as a CI job inside garbage-day-ok, so M1's exit check covers the browser engines as well as Node."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "engine", "ci"]
timestamp: "2026-09-30"
state: "open"
milestone: "M1"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-scaffold.md
  - type: DEPENDS_ON
    target: GD-TICKET-009.md
---

# GD-TICKET-019: Run the golden replays in real browsers

## Description

Found while closing [`GD-TICKET-009`](GD-TICKET-009.md): M1's exit criterion says the golden
replays give identical hashes "in Node and the browser", but no item carried the browser half;
`009` replays them twice in Node. Chromium runs the same V8 engine as Node, so the check that
matters is Firefox (SpiderMonkey) and WebKit (JavaScriptCore): that the determinism contract
holds on every engine a player might use.

## Acceptance Criteria

- The golden replay test (`src/engine/src/golden.test.ts`) runs unchanged in Chromium, Firefox
  and WebKit through Vitest's browser mode with the Playwright provider, reading the same golden
  files, and passes in all three.
- A CI job runs it (installing only the browsers it needs) and is one of the jobs
  `garbage-day-ok` requires.
- New packages are at their newest versions at least a day old, or listed as exceptions in
  [stack and CI](../../design/stack-and-ci.md#exceptions-to-latest); Playwright's version is the
  one M3's end-to-end tests will use.
- `stack-and-ci.md` (tests table, pipeline) describes the job.

## Linked Artifacts

- [Architecture — determinism contract](../../design/architecture.md#determinism-contract),
  [stack and CI — tests](../../design/stack-and-ci.md#tests), [roadmap — M1 exit](../roadmap.md)

## AI PDLC Prompt

Goal: prove the golden replays are identical in browser engines. Read
`kb/design/stack-and-ci.md` ("Tests", "The pipeline", "Exceptions to latest"),
`src/engine/src/golden.test.ts` and `.github/workflows/garbage-day.yml`. Add Vitest's browser
mode with the Playwright provider for the engine's golden test (Chromium, Firefox, WebKit);
reading golden files in the browser may need the test to import them instead of
`toMatchFileSnapshot`. Add a `test-browser` CI job that `garbage-day-ok` needs. Run the code
gates. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution, the
backlog index and roadmap agree, and the journal records it.
