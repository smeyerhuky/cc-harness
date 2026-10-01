---
type: "Work Item"
title: "GD-STORY-015: The bot as a second client in a Web Worker"
description: "A bot match runs through the Match DO like a human one, with the bot as a second client in a Web Worker, so the bot plays by the same server rules (US-03 online)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-10-01"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-011.md
  - type: DEPENDS_ON
    target: GD-TICKET-016.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-015: The bot as a second client in a Web Worker

## Description

The roadmap's M3 todo "The bot as a second client in a Web Worker (US-03 online)". In M2 the bot plays inside the local referee on the main thread ([`GD-STORY-006`](GD-STORY-006.md)). Online, the bot offer in quick match ([`GD-STORY-009`](GD-STORY-009.md)) needs a bot that joins the Match DO like a person.

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#getting-into-a-match), **US-03 Play a bot**:

- Given I choose **Play a bot**, then I can pick a preset (Rookie, Regular, Pro) or set **skill**
  and **speed** separately from 1 to 10, and my last choice is remembered on this device.
- Skill changes how well the bot places pieces; speed changes how fast it thinks and moves. At
  skill 10 and speed 10 the bot must beat skill 1 and speed 1 in at least 9 of 10 seeded test
  matches.
- A bot match runs through the same Match DO rules as a human match, including garbage, the
  speed-up, power-ups and showdowns.

Also: the bot's work never runs on the main thread, and the bot is labelled as a bot ([`GD-TICKET-016`](GD-TICKET-016.md)).

## Linked Artifacts

- [PRD — US-03](../../product/prd.md#getting-into-a-match), [client architecture](../../design/client-architecture.md)

## AI PDLC Prompt

Goal: the bot joins the Match DO from a Web Worker. Read `src/engine/src/bot.ts`. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md).

- **The match.** The Worker's `POST /api/bot-matches` opens a Match DO on the defaults with two
  join tokens and answers its id and both tokens (the protocol's `botMatch`). A bot match's id
  is `B-` and ten more. Each request counts against the address's 60 a minute, with its socket
  upgrades. Ids and tokens now come from `worker/ids.ts`, moved out of the Lobby DO.
- **The seats.** On mount, the match screen asks for a bot match (`client/bot/botMatch.ts`). It
  starts a Web Worker (`client/bot/bot.worker.ts`) and posts it the bot's socket URL, token, and
  skill and speed. The page's `OnlineSession` takes the other seat. If React runs the screen's
  effect twice, the second run takes the match the first asked for. A rematch asks for a new one.
- **The bot.** `runBot` steps the engine's `Bot` on a `MatchClient` at 60 Hz. `MatchClient` is
  new: the socket, `hello` and rejoin code taken out of `OnlineSession`. The bot therefore
  connects, says hello (with `bot`) and reconnects as a person's client does. It seeds its own
  choices from `Math.random`, since they need no secret.
- **The end.** Leaving, or the screen going, sends `leave`, so the referee ends the match and the
  DO's clock stops. The page stops the worker, which also stops itself at a result. A stranger
  paired while the player plays a bot ends the bot match the same way.
- **No match.** If the request fails, the screen says "Connection lost", as for a dropped match.
- **Changed from the plan.** The architecture had the Lobby DO make the match for "Play a bot
  while you wait". One Worker route serves both ways in, since the player's lobby socket stays
  open anyway. [Architecture — bots](../../design/architecture.md#bots) says so.
- **The local session stays.** The app no longer plays any match through `MatchSession` (the
  engine's `LocalMatch` on the page, its bot included). The component tests still drive screens
  through it, and [`GD-TICKET-027`](GD-TICKET-027.md) brings the client architecture in line.

The criteria:

- **Presets, or skill and speed, remembered:** unchanged from [`GD-STORY-006`](GD-STORY-006.md).
- **Skill 10, speed 10 beats skill 1, speed 1 in at least 9 of 10:** the engine's test, on the
  same `Bot` and referee. A new test also plays that pair through the wire, as two bot clients
  on a stand-in Match DO, to a top-out.
- **The same Match DO rules:** a bot match is an ordinary match on the Match DO.
- **Never on the main thread:** the page makes no `Bot`. The app test checks that the page's
  player is driven by its input controller. In the browsers, the bot's socket was the worker's.
- **Labelled as a bot:** its `hello` carries `bot`, and the screens say "Bot · Regular".

Checks:

- **New tests:**
  - Worker:
    - a bot match opens for a player and a bot, who both get `start`, with the player's naming
      the rival a bot;
    - only `POST` makes one;
    - making them counts against the address's upgrades.
  - Protocol: the `botMatch` shape.
  - The bot client: two bots play a whole match through the wire in fake time; both say they
    are bots, both lock pieces, the strong one wins by top-out, and both stop.
  - App:
    - a bot match seats the bot from its own worker, the page plays only its player, the bot's
      pieces arrive as the referee relays them, and leaving ends the match and the worker;
    - with no match to be had, the screen says the connection is lost.
- **Tests moved onto the stand-in.** The whole-app tests and the accessibility scan now play bot
  matches against `test/fakeServer.ts`, a stand-in for the Worker and a Match DO, with the
  `GD-TICKET-016` test among them.
- **Gates:** the code gates pass (644 unit tests, 35 Worker tests), and so does
  `pnpm test:browser`'s accessibility scan (23).
- **In real browsers,** on `vite preview` (workerd):
  - **Desktop and a Pixel 7 profile.** Play a bot made one `POST`. A `bot.worker` ran during
    play and closed after the result. The match had two sockets: the page's said hello as the
    player, and the worker's as a bot (skill 5, speed 5). The bot cleared lines and sent
    garbage. The result read "Bot · Regular wins". No page errors.
  - **Two browsers.** The desktop played a bot while waiting in quick match; the phone then
    joined quick match. The desktop's bot match closed both its sockets and its worker, and the
    two players were paired.
  - **Rematch.** A rematch made a second match and a second worker; the first worker had closed.

