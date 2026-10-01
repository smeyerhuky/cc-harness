---
type: "Work Item"
title: "GD-TICKET-016: Label bots as bots everywhere"
description: "Make every place a bot appears (quick-match offer, lobby, match screen, result) say it is a bot and its level, as the PRD's assumed answer to open question 5 requires."
resource: "../coverage-audit.md"
tags: ["backlog", "UI"]
timestamp: "2026-09-30"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-016: Label bots as bots everywhere

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the PRD's answer to open
question 5, "a bot is always labelled as a bot", was carried by nothing.

## Acceptance Criteria

- A bot opponent's name reads "Bot · <preset or skill/speed>" on the offer, the match screen and
  the result; the protocol marks a bot client so the other side cannot be fooled.
- An end-to-end test of "Play a bot while you wait" asserts the label on each screen.

## Linked Artifacts

- [PRD open questions](../../product/prd.md#open-questions), [UI language — voice and copy](../../design/ui-language.md#voice-and-copy)

## AI PDLC Prompt

Goal: label bots everywhere. Read `kb/product/prd.md` (US-01, US-03, open questions) and
`kb/design/architecture.md` ("Bots", "Messages"). Add a bot flag to `hello` in the protocol
package, carry it through the Match DO to the opponent, and render the label in the client. Done
when the criteria hold, the code and KB gates pass, this item is `done` with a Resolution, the
backlog index and roadmap agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). M2 already named local bots
"Bot · <preset>" on the match screen and the result.

- **The name.** A bot whose skill is a preset reads "Bot · Rookie", "Bot · Regular" or
  "Bot · Pro". Any other bot now reads "Bot · skill 7, speed 4", as its setup button does. It used
  to leave out the speed.
- **The offer.** "Nobody has turned up yet. Bot · Regular can play you meanwhile." The offer used
  to say "a bot" without saying which.
- **The protocol mark.** A bot client says so in its `hello`, with its skill and speed (`bot`, new
  and optional). The Match DO keeps that on the seat, and the other player's `start` carries it as
  `rivalBot`. Their client renames the rival from it (`RIVAL_BOT` in the app machine), whatever
  name the rival came with. A person can't pass for a bot either way: a handle is two words and a
  number, so "Bot · …" is never one. [`GD-STORY-015`](GD-STORY-015.md)'s Web Worker bot will say
  `bot` in its `hello`.
- **What the mark can't stop:** a modified client running a bot without saying so. Telling those
  apart is fair-play work beyond v1's checks.

Checks:

- **The whole app, through "Play a bot while you wait"** (`client/App.test.tsx`): Quick match
  with nobody else waiting, then the offer at 20 s. The test checks the bot's name on the offer,
  the match screen's header and rival panel, and the result after the bot leaves. The Playwright
  suite these will join is [`GD-TICKET-029`](GD-TICKET-029.md)'s.
- **Unit and Worker tests:**
  - the name with skill and speed;
  - the offer's line;
  - the machine renaming a marked rival, and not for a mark out of range;
  - the session passing the mark on;
  - the protocol taking a mark in range, and refusing "Bot · Pro" as a handle;
  - the Match DO telling only the bot's opponent.
- The code gates pass: 640 unit tests, 32 Worker tests, the build.
- **In a real browser on the production build**, on a desktop and a Pixel 7 profile (dark, reduced
  motion). Quick match with nobody else waiting, then the bot offered at 20 s. Both read "Bot ·
  Regular" on the offer, "YOU VS BOT · REGULAR" in the header, and "BOT · REGULAR WINS" on the
  result after topping out, with no page errors.
