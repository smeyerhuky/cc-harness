---
type: "Journal"
title: "2026-10-21 — Garbage Day: the connection-quality indicator"
description: "Pull request #15 had merged, and #16 and #17 had finished its rematch; the session dropped its own unfinished copy of that work, started again from main, and built GD-TICKET-017: good, fair or poor beside the clock, and Slow connection over the rival's board past 150 ms one way."
resource: "Working session 2026-10-20 to 2026-10-21 on branch ccr-a9d3b393-jvy3f5"
tags: ["journal", "network"]
timestamp: "2026-10-21"
---

# 2026-10-21 — Garbage Day: the connection-quality indicator

**Epic:** [`GD-EPIC-001`](../backlog/GD-EPIC-001.md) · **Milestone:** M3 active · **Branch:** `ccr-a9d3b393-jvy3f5`

## What happened

1. The session resumed after a usage limit, with its own `GD-STORY-014` rematch work
   uncommitted. Pull request #15 had merged on 2026-10-02. Pull requests #16 and #17, from another
   session, had then fixed and closed `GD-STORY-014` (see [2026-10-02](2026-10-02-rematch.md)).
   The uncommitted copy was stashed, not committed, and the branch restarted from `main`
   (`54e2ff9`).
2. The next item by the backlog index was [`GD-TICKET-017`](../backlog/GD-TICKET-017.md). The link
   already pinged every second, so it now times each pong against its ping. A `QualityMeter`
   reads good, fair or poor from the round trips. The client shows it as three bars beside the
   clock, and as "Slow connection" over the rival's board when poor.
3. The model tests passed at once. A real-browser check (Chromium against `pnpm dev`, through a
   proxy that holds each chunk a set time each way) read 150 ms as poor. The round trips there
   were 300–304 ms: 5–6 ms of answering on top of the 300. The meter now takes 10 ms off a round
   trip before halving it, and the browser reads good, fair, poor and good again at 50, 150, 250
   and 50 ms.
4. The gates, the browser suites in CI's Playwright image, and a phone-profile check passed. The
   ticket was closed with a Resolution, and the design, index, roadmap and handoff brought in line.

## Decisions with the owner

| Question | Answer |
|---|---|
| Open a pull request for the work? | "continue, make a pull request" (#15, now merged); this work goes in a new one. |
| How much of a round trip is answering, not delay? | Not asked; 10 ms, from the measurement above. Recorded in `GD-TICKET-017`'s Resolution for the owner to revisit. |

## What landed

| Commit | Work item | What |
|---|---|---|
| this session's commit | `GD-TICKET-017` | the pong timing, `QualityMeter`, the quality chip, "Slow connection", their tests; the Resolution, design, index, roadmap, handoff, version and this entry |

## Surprises and what they changed

- **The work in hand was already done.** Another session had closed `GD-STORY-014` from `main`
  while this one was stopped at its usage limit. Reading `main`'s handoff before committing found
  it. The handoff names the branch each session works on, so a session resuming after a long
  stop should read `main`'s handoff before its own notes.
- **A 150 ms link is not 300 ms round trip.** The few ms the page and the Durable Object take to
  answer a ping put a link of exactly 150 ms past the PRD's bound. The model test missed it,
  because its pongs came back in exactly twice the delay.
- **This container's own browsers could not run the browser suite.** Playwright 1.63 wants newer
  builds than `/opt/pw-browsers` had, and WebKit's system libraries are missing here. CI's image,
  run in Docker, ran both suites. The engine suite's first run there ended in an error at
  browser launch, before any test ran; the second run passed.

## Verification

```
pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker && pnpm build   exit 0
pnpm test                 Test Files 56 passed (56) · Tests 674 passed (674)
pnpm test:worker          Test Files 6 passed (6)   · Tests 50 passed (50)
browser suites, in mcr.microsoft.com/playwright:v1.63.0-noble (pinned digest):
  engine                  3 files, 30 tests passed (Chromium, WebKit, Firefox)
  app a11y                1 file, 27 tests passed
Chromium against pnpm dev through a delaying proxy, a bot match:
  desktop  50 ms good · 150 ms fair · 250 ms poor + "Slow connection" · 50 ms good again
  Pixel 7  250 ms poor + "Slow connection", no sideways overflow
```

The project's KB gates (`lint_okf`, `lint_authority`, `relationships`, `weeding`, `backlog`) all
pass on `projects/garbage-day/kb/`.

## Next

The rest of M3 in the backlog index's order: [`GD-TICKET-029`](../backlog/GD-TICKET-029.md), then
[`GD-TICKET-027`](../backlog/GD-TICKET-027.md), then M3's exit. The handoff says where things stand.
