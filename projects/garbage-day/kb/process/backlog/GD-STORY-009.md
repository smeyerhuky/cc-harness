---
type: "Work Item"
title: "GD-STORY-009: Quick match with a stranger"
description: "One button into the Lobby DO's waiting pool with a live count, pairing into a countdown within 2 s, the bot offer after 20 s, and Cancel (US-01)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-TICKET-028.md
  - type: DEPENDS_ON
    target: GD-STORY-011.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-009: Quick match with a stranger

## Description

The roadmap's M3 todo "Lobby DO quick match, waiting count, bot offer after 20 s (US-01)". Home's **Quick match** button, disabled in M2, comes alive; the app machine already has the searching and bot-offer states ([`GD-TICKET-014`](GD-TICKET-014.md)).

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#getting-into-a-match), **US-01 Quick match**:

- Given I open the game, when I press **Quick match**, then I join the waiting pool and see
  "Looking for an opponent" with a live count of players waiting.
- Given another player is waiting, when we are paired, then we both see each other's handle and
  a 3-second countdown starts within 2 s of pairing.
- Given nobody is paired within 20 s, when that time passes, then I am offered **Play a bot
  while you wait** and **Keep waiting**; choosing either keeps me in the pool unless I cancel.
- Given I am in the pool, when I press **Cancel**, then I leave the pool and return to the start.

## Linked Artifacts

- [PRD — US-01](../../product/prd.md#getting-into-a-match), [architecture — Lobby DO](../../design/architecture.md)

## AI PDLC Prompt

Goal: two strangers into one match. Read the architecture's Lobby DO section and `appMachine.ts`. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). **Quick match** on home now
puts the player in the Lobby DO's pool and pairs them into a match through the Match DO.
Built out of the index's order, before [`GD-TICKET-013`](GD-TICKET-013.md) and
[`GD-STORY-012`](GD-STORY-012.md), because
[`GD-STORY-011`](GD-STORY-011.md) needed a way into a match for its two-browser check.

- **The Lobby DO** (`src/app/worker/lobby.ts`), first come, first served.
  - **The pool:** a waiting player's handle and join time live on their socket, so the pool
    survives the DO hibernating while everyone waits.
  - **The count:** each join and leave tells everyone how many are waiting.
  - **Pairing:** the two who have waited longest are paired at once. The DO makes a match id
    (`Q-` and ten base-32 characters, apart from private codes) and two 32-character tokens.
    It opens the Match DO with them, picking another id if that one is taken. Each player is
    told `matched` (the match, their token, the other's handle), and their lobby socket closes.
    Both are out of the pool before the Match DO is asked, so nothing pairs them twice.
  - **Leaving:** `cancel`, or closing the socket, leaves the pool.
- **The client.**
  - **The machine:** it now carries the pool and the pairing (`queued`, `waiting`, `offered`,
    `matchId`, `token`). After 20 s of searching it offers a bot, once a search.
  - **Staying queued:** a bot game played while waiting stays queued. A pairing then ends the
    bot game and starts the real match, as the PRD's "keeps me in the pool" asks.
  - **The lobby link:** `QuickMatchLink` holds the lobby socket while the player is queued. It
    loads only then, so the first page grew by 0.3 KB.
  - **The screens:** `SearchingScreen` shows the count, the bot offer and Cancel. The match
    screen plays a quick match through an `OnlineSession`. Online, the result card offers only
    Home until a rematch needs both players ([`GD-STORY-014`](GD-STORY-014.md)).
- **Answering a close:** both DOs now answer a client's close. A socket a client closed never
  finished closing before, which the lobby tests found.
- **What the tests found:** messages a client sent after `cancel` reached a socket the DO had
  already closed, and the reply threw. The DO now ignores any socket that isn't open.

Checks:

- 3 Lobby DO tests: a pairing whose match then seats both tokens and starts; the count and
  leaving by `cancel` or by closing; the two longest waiting are paired and the third waits.
- 4 new machine tests: the 20 s offer made once, the count, pairing out of a bot game, and
  going home leaving the pool.
- 5 feature tests: the link queues with the handle, hears the count and the pairing, and
  cancels when it goes unpaired; the screen's counts, the offer's two choices, and Cancel.
- 1 result-card test: Home only, online.
- The searching screen joins the accessibility scan in both themes.
- The code gates pass: 601 unit tests, 28 Worker tests, and the build. The browser tests pass:
  10 golden replays and 23 scans.
- **Browser tests fixed:** the browser config now pre-bundles Zod. Found mid-run, it made Vite
  reload the page under the tests, leaving two copies of React.

The device check, in Chromium on the production build (`vite preview`):

- **Pairing:**
  - A desktop pressed Quick match and saw "You are the only one waiting."
  - A Pixel 7 profile (dark, reduced motion) pressed it next. Both were paired within 337 ms,
    and each header named the other's handle.
- **Bot offer:** a desktop waiting alone saw no offer at 19 s, then got it at 20 s.
  - It chose "Play a bot while you wait" and played "Bot · Regular".
  - A second desktop pressed Quick match, and the first left its bot game for the real match,
    "You vs Steady Godwit 51".
