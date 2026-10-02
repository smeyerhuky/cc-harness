---
type: "Work Item"
title: "GD-STORY-014: Result and rematch over the network"
description: "Both players see the same result, reason and stats, and Rematch starts a new match with a new seed when both press it within 30 s (US-15 online)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-10-02"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-011.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-014: Result and rematch over the network

## Description

The roadmap's M3 todo "Results and rematch over the network (US-15)". The result card and stats exist ([`GD-STORY-002`](GD-STORY-002.md)); locally a rematch starts at once.

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#playing), **US-15 Result and rematch**:

- Both players see the same result and reason (topped out, forfeit, no contest, session ended),
  and a stats table: lines, garbage sent, Quads, T-spins, power-ups used, pieces per second.
- **Rematch** starts a new match with a new seed when both press it within 30 s; otherwise each
  player returns to the start.

## Linked Artifacts

- [PRD — US-15](../../product/prd.md#playing), [client architecture — `useOptimistic`](../../design/client-architecture.md#modern-react-used-on-purpose)

## AI PDLC Prompt

Goal: the same ending on both screens, and a rematch both agree to. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

## Resolution

Done in [the rematch session](../journal/2026-10-02-rematch.md), in two parts. The first was in
pull request #15: the rematch request, the agreement and a new seed on the Match DO, with the
result card's button. Checking its criteria afterwards found four faults, fixed here.
[Architecture — messages](../../design/architecture.md#messages) describes the wire.

- **The result and the stats** were already the same on both screens: they come from the
  referee's `result` and each side's last `lock`, through the path [`GD-STORY-002`](GD-STORY-002.md)
  built. Checked in two browsers (below).
- **A rematch needs both, within 30 s.** The Match DO relays the first ask (`rematch`) to the
  other seat. With both asked it sends `agreed` and deals a new match on a new 128-bit seed. Each
  session then renews its match in place.
- **Otherwise each player returns to the start.** Pull request #15 timed this out on the page of
  the player who had pressed, and nowhere else: the other stayed on the result card for good.
  The Match DO now sends `lapsed` to both seats 30 s after the first ask, and both go home. The
  page's own timer is gone.
- **A bot answers.** The bot never asked, so Rematch against it waited 30 s and went home. The
  bot's worker now asks at each result, plays the next match if the player agrees, and stops
  itself (closing the worker) when the window lapses.
- **The screen stays mounted.** `MatchRoute` keyed `MatchScreen` on the machine's match counter,
  so an agreed rematch unmounted the screen that held the renewed match: a bot match sent `leave`
  on the match just started, and made a second bot match.
- **The second match announced nothing.** `OnlineSession` kept the flags that say play began and
  the match ended, so the renewed match never sent `GO` or `ENDED`. The app stayed in the
  countdown and the second match never showed a result. The flags, the last showdown and the rise
  are reset on renewal.
- **Checked** on a local dev server with Chromium (a desktop window against a Pixel 7 profile,
  keyboard play on both), driven by a throwaway Playwright script:
  1. Both press Rematch: both start a second match, and it ends in a result on both.
  2. Only one presses: the other's button reads "Rival wants a rematch", and after 30 s both
     are back at the start.
  3. Against a bot: Rematch starts a second match, and it ends in a result.

  The script is not in the repo. Making it one is [`GD-TICKET-029`](GD-TICKET-029.md). The phone
  profile was played by keyboard, not by touch.
- **Tests.** The Match DO's agreement and 30 s lapse (in real time: the suite waits 30 s for it,
  as the Durable Object's timer can't be faked from the test); the bot's rematch and lapse; the
  session announcing a second match's start and end; an app test that a bot rematch starts
  another match on the same screen; the machine's `REMATCH_TIMEOUT` from the result card.
- **Found while working.** The fake server's rematch did not restart its clock, so a second match
  never ticked; fixed with the rest. Pull request #15's tests passed without seeing any of the
  four faults, because none played a rematch through the real screen, session and bot together
  (definition of done, item 3).
