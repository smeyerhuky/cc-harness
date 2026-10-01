---
type: "Work Item"
title: "GD-TICKET-013: Client outbox and reconnect with backoff"
description: "Give the client socket an outbox that holds messages while offline and flushes them on reconnect, reconnect with jittered backoff, and self-freeze the board while disconnected."
resource: "../coverage-audit.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-013: Client outbox and reconnect with backoff

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the architecture commits the
client to an offline outbox and reconnects ("Garbage ledger and reconnects"), but nothing carried
it. The proof of concept's `Match.back` and `outbox` show the behaviour.

## Acceptance Criteria

- The client `Socket` queues outgoing game messages while disconnected (not `pos` or `ping`) and
  flushes them in order after `rejoin` succeeds.
- It reconnects with exponential backoff and jitter (0.5 s to 8 s), and shows "Reconnecting".
- The local board freezes itself as soon as the socket drops and resumes on the DO's `resume`.
- Tests drop and restore the connection mid-match against a local referee and show no lost or
  duplicated attacks.

## Linked Artifacts

- [Architecture — garbage ledger and reconnects](../../design/architecture.md#garbage-ledger-and-reconnects)
- Proof of concept: `spikes/proof-of-concept/live/live-engine.js` (`Match.back`, `outbox`)

## AI PDLC Prompt

Goal: build the client outbox and reconnect. Read `kb/design/architecture.md` ("Garbage ledger
and reconnects", "Messages") and `kb/design/client-architecture.md` ("Where state lives").
Implement `projects/garbage-day/src/app/client/net/Socket.ts` with tests. Done when the criteria
hold, the code and KB gates pass, this item is `done` with a Resolution, the backlog index and
roadmap agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). It took four pieces, of which
the socket is the smallest.

- **The socket** (`client/net/Socket.ts`).
  - It opens a link. When the link drops, it opens another after a wait that doubles from
    0.5 s to 8 s, each wait drawn between half and one and a half times that. The waits start
    from the shortest again once a new link is heard from.
  - A close the server meant (the protocol's new `CLOSE` codes: done, refused, replaced, bad
    token, gone) is final, and so is any close once the match has a result.
  - The link itself (`net/link.ts`) pings on opening and every second after. It gives up on a
    connection silent for 3 s, or when the browser goes `offline`, and reports the close at
    once, not when the socket gets round to closing.
- **The client's side** (`ClientMatch`).
  - `drop()` freezes the player at once and keeps the game messages they would send, not
    positions or heartbeats.
  - `rejoin(awayMs)` sends those in order, then `rejoin` with the last garbage received, and
    stays frozen until the referee says when play resumes. A bag asked for and never heard is
    asked for again.
  - `OnlineSession` says `hello` again on each new link, then rejoins. It shows the connection
    in its view: online, reconnecting, or lost.
  - The match banner shows a new `ConnectionNotice`: "Reconnecting…" with the presence chip's
    blinking dot, or "Connection lost" once the socket gives up.
- **The referee's side** (engine).
  - Every `rejoin` resends the garbage not yet acknowledged. Before, it did so only once the
    referee had noticed the player gone. A drop shorter than the 5 s of silence lost those rows
    for good.
  - It tells the rejoiner what they missed: the pause if there is one, else when play resumes
    (at go during the countdown, at once in play), or the result if the match ended.
  - `resume` now freezes until its tick. A player back from a lost connection or a closed tab
    never heard `paused`, and used to play through the other player's 3-second countdown. The
    interruptions golden replay recorded that head start and was regenerated in its own commit,
    as the definition of done asks. The rule didn't change; the engine follows it now
    (pause and presence, "The pause", item 6).
- **The Match DO's side.**
  - While a match runs, a 1-second clock ticks the referee between messages. Silence is then
    noticed even when nobody sends anything, as during a pause. The clock also keeps the DO,
    and the referee in its memory, from hibernating through a pause; a pause longer than about
    10 s would otherwise have lost the match.
  - A DO that restarted and lost its referee says the match is gone (`expired`, close `gone`)
    instead of dealing a second match over the first. Restoring it is M4's.

**Ordering.** The criteria say to flush the outbox "after rejoin succeeds". It is flushed once
the new socket has said hello, just before `rejoin`, as the proof of concept's `back` does; the
referee takes either order.

**Not covered**, filed as [`GD-TICKET-031`](GD-TICKET-031.md) (M4):

- what the client sent in the up to 3 s before it noticed the drop;
- broadcasts missed on a drop the referee never noticed (a power-up, a showdown);
- a bag whose reply was lost, asked for again, which skips one;
- a drop before `start`.

Checks:

- **Engine:** 10 new tests.
  - ClientMatch: the outbox, in order, before `rejoin`; frozen from the drop until the referee
    says go.
  - A short drop and a long one, each losing an attack on the wire, end with every row received
    once. Run against the old referee, the short drop lost the row.
  - Both players resume on the same tick after a missed pause; a player back after the end
    hears the result.
  - The referee's replies to a rejoin, in each state.
- **App:** 11 new tests.
  - The socket's backoff and its bounds; reconnecting, giving up on a final close, and closing
    for good.
  - The link's silence and offline watchdog.
  - Three OnlineSession tests over the real codec with a killable link: it freezes and says it
    is reconnecting, comes back on its own and loses no garbage; it resumes with the other
    player after a pause; a final close shows the connection lost.
  - The banner's notice.
- **UI and protocol:** one each, the notice's two states and which close codes are final.
- **Worker:** 2 new tests.
  - A player's new socket takes the seat mid-match, rejoins and hears `resume`, with no second
    `start`.
  - A DO that lost its referee says the match is gone.
- The code gates pass: 630 unit tests, 30 Worker tests, the build.
- **Two browsers on the production build** (`vite preview`), a desktop and a Pixel 7 profile
  with dark mode and reduced motion, paired by quick match. The phone went offline
  (Playwright's `setOffline`):
  - **for 2 s:** it showed "Reconnecting…" within 0.7 s and was back 0.6 s after coming
    online, with the desktop playing on;
  - **for 8 s:** the referee paused both. Back online, the phone reconnected on its next try,
    4.8 s later. Both screens counted down from 3 together and played on.
  - When the desktop left, the phone won.
