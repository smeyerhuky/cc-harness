---
type: "Work Item"
title: "GD-TICKET-017: Show connection quality and degrade visibly above 150 ms"
description: "Measure round-trip time continuously and show a connection indicator; above 150 ms one way, say so on screen instead of letting the opponent view lag silently."
resource: "../coverage-audit.md"
tags: ["backlog", "network"]
timestamp: "2026-10-21"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-017: Show connection quality and degrade visibly above 150 ms

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the PRD's requirement that play
"degrades visibly, not silently" above 150 ms one way was carried by nothing.

## Acceptance Criteria

- The client measures round-trip time from its pings and shows a small indicator (good, fair,
  poor) beside the clock.
- Above 150 ms one way for more than 3 s, the opponent panel shows "Slow connection" and the
  indicator turns poor; it clears when the delay recovers.
- A test with the latency model at 50, 150 and 250 ms asserts the three states.

## Linked Artifacts

- [PRD non-functional requirements](../../product/prd.md#non-functional-requirements),
  [architecture — the match clock](../../design/architecture.md#time-the-match-clock)

## AI PDLC Prompt

Goal: show connection quality. Read `kb/product/prd.md` ("Non-functional requirements") and
`kb/design/architecture.md` ("Time: the match clock"). Implement in `src/app/client/net/clockSync.ts`
and the match feature's centre column, with tests using the engine's latency model. Done when the
criteria hold, the code and KB gates pass, this item is `done` with a Resolution, the backlog
index and roadmap agree, and the journal records it.

## Resolution

Done in [the connection-quality session](../journal/2026-10-21-connection-quality.md).
[Architecture — the match clock](../../design/architecture.md#time-the-match-clock) describes it.

- **Measured from the pings already sent.** `webSocketLink` times each pong against its ping
  (pongs come back in order, one each) and `Socket` passes the round trip up. `QualityMeter`
  (`src/app/client/net/quality.ts`, not the `clockSync.ts` the prompt named: pings carry no
  server time, so this is not clock sync) judges the middle of the last three round trips, less
  10 ms for answering, halved. Up to 100 ms one way is good, and up to 150 ms is fair. Past
  150 ms for 3 s it is poor; it clears at the first reading back under. A reconnect starts it
  again from good.
- **The 10 ms for answering is a decision made here.** In Chromium against `pnpm dev`, a
  proxy holding each chunk 150 ms each way measured round trips of 300–304 ms. With no delay
  they were 5–6 ms. Halved as they stand, a link of exactly 150 ms read as slow. The 10 ms is
  taken off the round trip before halving, so a link reads slow from about 155 ms one way.
- **On screen.** Three bars beside the clock (in the centre column, and in the header on a
  phone held upright): three green, two yellow or one red, labelled "Connection good",
  "fair" or "poor". While poor, "Slow connection" (`role="status"`) sits over the top of the
  rival's board. A local match shows neither.
- **Tests.** The meter at 50, 150 and 250 ms one way reads good, fair and poor. It turns poor
  only after 3 s, clears on recovery, ignores one late pong, and reads the measured 150 ms
  round trips as fair. The link times its pongs in order. The widget lights its bars. An app
  test plays a bot match against the fake server, with its pongs delayed 50, 150, 250, then
  50 ms each way. It checks the chip and the slow notice at each step.
- **Checked** in Chromium against `pnpm dev`, through a throwaway proxy that delays the socket
  each way. On a desktop window, 50 ms read good, 150 ms fair, and 250 ms poor with "Slow
  connection", then good again at 50 ms. On a Pixel 7 profile, 250 ms read poor, with the
  notice showing and no sideways overflow. The proxy and script are not in the repo.
