---
type: "Work Item"
title: "GD-STORY-010: Create a game and share a link"
description: "Private games: match settings, a code and link with Copy and Share, a ready lobby, the 30-minute expiry, and the full-game screen (US-02)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-10-01"
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

# GD-STORY-010: Create a game and share a link

## Description

The roadmap's M3 todo "Private games: create, code and link, Copy and Share, ready lobby, full and expired states (US-02)". `/new` and `/g/:code` exist as screens in M2 ([`GD-TICKET-014`](GD-TICKET-014.md)); the game code rule and the loader already check codes.

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#getting-into-a-match), **US-02 Create a game and share a link**:

- Given I press **Create game**, then I can change the match settings and I get a link and a
  short code (for example `GD-7KQ4`) with a **Copy link** button and a **Share** button where the
  device supports it.
- Given my friend opens the link or enters the code, when they arrive, then we both see a lobby
  with both handles, the settings, and a **Ready** button each; the countdown starts when both
  are ready.
- Given nobody joins, when 30 minutes pass without activity, then the game expires and the link
  says so if opened later.
- Given a third person opens a link whose game already has two players, then they see "This game
  is full" and a **Quick match** button.

## Linked Artifacts

- [PRD — US-02 and match settings](../../product/prd.md#match-settings), [architecture](../../design/architecture.md)

## AI PDLC Prompt

Goal: a friend joins by link. Read the PRD's match settings and the architecture's private-lobby section. Build the settings form so a bot game can use it too ([`GD-TICKET-026`](GD-TICKET-026.md)). Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md).
[Architecture — private games](../../design/architecture.md#private-games) describes the design.

- **The Worker.**
  - `POST /api/games` takes the host's settings and opens the Match DO under a fresh code. It
    draws again while a code is taken, live or expired. It answers the code and the host's
    token.
  - `POST /api/games/:code/join` hands out the guest's token, once. After that it answers full
    (409), expired (410) or unknown (404).
  - Both count against the address's 60 a minute, so nobody can try codes quickly.
- **The Match DO's lobby.**
  - A private game seats each `hello` and answers both players with `lobby`: their handles,
    the settings, who is ready.
  - Only the host changes the settings, and a change asks both to be ready again. A player who
    leaves the lobby is no longer ready.
  - With both there and ready, the referee starts on the game's settings. `start` now carries
    them, and the engine's `ClientMatch` takes its rules from them.
  - An alarm 30 minutes after the last thing that happened expires an unstarted game. The lobby
    hears `expired`; only a mark stays, so the link says so later and the code is never reused.
- **The protocol.** It gains the settings' choices and a Zod-free `isMatchSettings`
  (`@garbage-day/protocol/settings`), from which the schema is built. It also gains the game
  code and the create and join shapes. In `lobby`, either handle may be missing.
- **The client.**
  - Home's Create game opens `/new`, and a field takes a code, with or without its `GD-`.
  - `/new` offers the match settings, starting from the last game's. The form
    (`features/match-settings`) is the one [`GD-TICKET-026`](GD-TICKET-026.md) gives bot games.
  - `/g/:code` takes the browser's kept seat or joins. A refusal says why: full (with Quick
    match), expired, unknown, or the server can't be reached (with Try again).
  - The lobby shows the link with Copy link (and Share where the device has it), the code, both
    players and who is ready. The host gets the settings form and the guest a summary of them.
  - The lobby and its match run on one session: `MatchStage` is split out of `MatchScreen` to
    draw either.
  - The app machine enters the lobby by `JOIN`, the host's browser too. The unused
    `CREATE_GAME` and `LOBBY_ERROR` are gone.
- **Classic shows no power-up slots.** A Classic match deals none, so the match view gains
  `powerUps` and the panels leave the slots out. The button pad keeps its Power key, to keep its
  two rows of four.
- **Found while working.** A reload mid-match takes the seat again, but the new page has no match
  to rejoin and waits in the lobby: [`GD-TICKET-033`](GD-TICKET-033.md), in M4.

Checks:

- **New tests:**
  - Worker (12):
    - making a game on its settings;
    - the guest seat given once, then full;
    - unknown codes;
    - a quick or bot match is no private game;
    - bad settings, and anything but `POST`;
    - both handles to both, each told its seat;
    - only the host's settings, which reset Ready;
    - the start on the game's settings;
    - Ready forgotten on leaving;
    - the alarm 30 minutes out;
    - expiry heard and kept, its code never reused;
    - no expiry once started.
  - Engine: `ClientMatch` plays on `start`'s rules.
  - Protocol: the Zod-free check agrees with the schema on every choice; the create and join
    shapes.
  - App, against the stand-in server, which gained private games:
    - making a game and copying its link;
    - a friend joining, both ready, the match on a 30 s speed-up in Classic, with no power-up
      slots;
    - the guest's read-only settings;
    - a full game, with quick match;
    - an expired game, in its lobby and on its link;
    - a code from home.
  - Session and form: the lobby, Ready and settings messages, refusals; the form's choices and
    the guest's summary.
- **The accessibility scan** gains the lobby (host and guest) and the full and expired screens,
  in both themes.
- **Gates:** the code gates pass (658 unit tests, 47 Worker tests), and so does
  `pnpm test:browser` (27 scans), here and in CI's Playwright image.
- **In real browsers,** on `vite preview` (workerd):
  - **Making the game.** A desktop host made a Classic game with a 30 s speed-up. Copy link put
    the link on the clipboard.
  - **The friend.** A Pixel 7 profile opened the link and saw both players and the host's
    settings, read-only. Its Ready reached the host.
  - **A settings change.** The host changed Pauses to 1, which the phone saw, and both were
    "Not ready" again.
  - **A third visitor** got "This game is full" with Quick match.
  - **The match.** Both pressed Ready and the match started, each screen naming the other
    player. A rerun after hiding the slots showed none in Classic. No page errors.

