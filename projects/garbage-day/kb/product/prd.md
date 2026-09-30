---
type: "Reference"
title: "Garbage Day — Product Requirements (v1)"
description: "What Garbage Day v1 is, who it is for, its goals and success bar, the user stories with acceptance criteria that later work items quote, what is out of scope, and the open questions with the answers assumed until the owner says otherwise."
resource: "../process/journal/2026-09-30-spec.md"
tags: ["spec", "product", "prd"]
timestamp: "2026-09-30"
relationships:
  - type: DERIVED_FROM
    target: ../process/journal/2026-09-30-spec.md
  - type: ELABORATED_BY
    target: game-rules.md
  - type: ELABORATED_BY
    target: pause-and-presence.md
  - type: ELABORATED_BY
    target: controls-and-layout.md
---

# Garbage Day — Product Requirements (v1)

## What it is

Garbage Day is a two-player, real-time falling-block versus game. Two players get the same
pieces in the same order and play side by side at the same time, not in turns. Clearing lines
sends **garbage** (grey rows with one hole) into the opponent's board; the first player pushed
past the top loses. The game speeds up as the match goes on, and gem blocks carry power-ups.

It runs entirely on Cloudflare: static files and a Worker serve the game, and one Durable Object
per match deals the pieces, relays moves, routes garbage and referees pauses. There is no server
to operate. It has its own name and look and never uses the Tetris name or trade dress.

## Who it is for

| Player | Situation | What they need |
|---|---|---|
| **The quick-match player** | A few spare minutes, on desktop or phone | One tap into a live match against a stranger, no account |
| **The friend** | Wants to play someone specific | Create a game, send a link, play |
| **The solo player** | Nobody around, or wants to practise | A bot whose skill and speed they can set |
| **The phone player** | On a bus, one hand, interruptions | Gestures that feel native, and pauses that survive a phone call |

## Goals and success bar

1. Two strangers on different networks, one on a phone and one on a desktop, can finish a full
   match with every pause rule working.
2. The game feels instant: your own moves never wait on the network.
3. A match costs nothing on the Cloudflare free plan at hobby scale.
4. A new player understands garbage within their first match, without reading instructions.

## Product principles

- **Your board is yours.** It runs locally; the network carries only what the opponent needs.
- **Same pieces, fair pauses.** Both players get identical pieces and gems; nobody gains time
  or information from a pause.
- **One screen, no scrolling during play**, on any device.
- **Say what happened.** Every pause, forfeit and result tells both players why, in plain words.

## Match settings

Quick match always uses the defaults. A player who creates a game or plays a bot can change them.

| Setting | Default | Range |
|---|---|---|
| Mode | Standard (power-ups and showdowns on) | Standard · Classic (both off) |
| Speed-up every | 15 s of active play | 10 · 15 · 20 · 30 s |
| Pause budget | 2 per player | 0–3 |
| Pause timer | 2:00 | 1:00 · 2:00 · 3:00 |
| If the waiting player leaves | No contest | No contest · Counts as their win |
| Bot skill (bot games only) | 5 of 10 | 1–10, presets Rookie 2 · Regular 5 · Pro 8 |
| Bot speed (bot games only) | 5 of 10 | 1–10, independent of skill |

The numbers behind each setting are in [game rules](game-rules.md) and
[pause and presence rules](pause-and-presence.md).

## User stories

Each story's acceptance criteria are the ones a STORY work item quotes. Numbers such as timings
come from the linked rules files so that there is one place to change them.

### Getting into a match

**US-01 Quick match.** As a player, I want one button that puts me into a live match with a
stranger, so that I can play without setting anything up.

- Given I open the game, when I press **Quick match**, then I join the waiting pool and see
  "Looking for an opponent" with a live count of players waiting.
- Given another player is waiting, when we are paired, then we both see each other's handle and
  a 3-second countdown starts within 2 s of pairing.
- Given nobody is paired within 20 s, when that time passes, then I am offered **Play a bot
  while you wait** and **Keep waiting**; choosing either keeps me in the pool unless I cancel.
- Given I am in the pool, when I press **Cancel**, then I leave the pool and return to the start.

**US-02 Create a game and share a link.** As a player, I want to create a private game and send
a link, so that I can play a specific friend.

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

**US-03 Play a bot.** As a player, I want to play a bot whose skill and speed I set, so that I
can practise or play when nobody is around.

- Given I choose **Play a bot**, then I can pick a preset (Rookie, Regular, Pro) or set **skill**
  and **speed** separately from 1 to 10, and my last choice is remembered on this device.
- Skill changes how well the bot places pieces; speed changes how fast it thinks and moves. At
  skill 10 and speed 10 the bot must beat skill 1 and speed 1 in at least 9 of 10 seeded test
  matches.
- A bot match runs through the same Match DO rules as a human match, including garbage, the
  speed-up, power-ups and showdowns.

**US-04 A handle without an account.** As a player, I want a name in the game without signing
up.

- Given I open the game for the first time, then I get a generated handle (an adjective, a bird
  and a number, for example `Brisk Heron 42`) that I can regenerate but not type freely in v1.
- My handle and settings are stored only on my device.

### Playing

**US-05 Live, simultaneous play.** As a player, I want to play at my own pace while my opponent
plays at theirs, so that the game is a race, not a turn-taking exercise.

- Both boards run at the same time from the moment the countdown ends; neither player ever waits
  for the other to move.
- My own moves render in the same frame as my input, whatever the network delay.
- The game follows the [game rules](game-rules.md): 7-bag pieces, rotation with wall kicks,
  hold, ghost piece, lock delay, line clears.

**US-06 Same pieces, hidden next.** As a player, I want to get exactly the pieces my opponent
gets, without seeing theirs ahead of time.

- Both players receive the same piece sequence, including the same gem blocks, dealt by the
  Match DO one bag of 7 at a time.
- I see my own next 5 pieces and my hold; I see my opponent's hold but never their next pieces.
- The seed never leaves the server, so reading network traffic cannot reveal future pieces.

**US-07 See my opponent live.** As a player, I want to watch my opponent's board while I play.

- My opponent's board, falling piece, incoming meter and hold update at least 15 times a second
  when the network delay is 150 ms one way or less.
- Their board is shown with the same colours as mine, next to mine on desktop and as a smaller
  board on a phone in portrait.

**US-08 Send and receive garbage.** As a player, I want clearing lines to attack my opponent and
theirs to attack me, so that the match is a fight.

- Clears send rows by the attack table in the [game rules](game-rules.md), including T-spins,
  back-to-back, combos and perfect clears.
- Incoming rows wait in a meter beside my board; my clears cancel them before anything is sent.
- Rows land when I lock a piece without clearing, after a 0.5 s delay from arriving, at most 8
  rows per lock, with one hole column per attack.
- Every sent attack shows where it came from and where it went, and every landing is felt (a
  short shake and sound, and a vibration on phones that support it).

**US-09 The game speeds up.** As a player, I want matches to build to an end.

- Speed rises one level every 15 s of active play (the setting), for both players at once, on
  the Match DO's clock; time spent paused does not count.
- My current speed level and the progress to the next are always visible.

**US-10 Power-ups.** As a player in Standard mode, I want gem blocks that give me power-ups.

- About 1 piece in 6 carries a gem. Clearing the row that holds it banks its power-up in my one
  slot; a gem cleared while the slot is full is lost.
- I fire a banked power-up with one key or gesture; it applies on both screens at the same moment,
  stamped by the Match DO.
- The four power-ups are Shield, Bomb, Fog and Rush, as defined in the
  [game rules](game-rules.md#power-ups).

**US-11 Showdowns.** As a player in Standard mode, I want moments that raise the stakes.

- A showdown is announced on both screens 5 s before it starts.
- At 1:00 of play, **Double garbage** doubles every routed attack for 15 s.
- At 2:30 of play, **Sudden death** adds 4 speed levels and doubles garbage until someone tops out.

### Pauses and presence

**US-12 Leaving pauses the match fairly.** As a player, I want the game to freeze when either of
us leaves, so that nobody loses because of a phone call.

- Switching tab or app, closing the tab, or losing the connection behaves as described in
  [pause and presence rules](pause-and-presence.md), including the pause budget, free reconnects,
  the grace period with no pauses left, hidden boards while paused, and the 3-second resume
  countdown.

**US-13 Deciding whether to wait.** As the player who stayed, I want to choose what happens.

- I see a popover that says why the game is paused, shows the time left, and offers **Wait**,
  **+1:00** (available at any time while waiting) and **Leave**.
- **Leave** ends the match as no contest, or as my win if the match settings say so.

**US-14 Coming back.** As a returning player, I want to know what happened while I was gone.

- When I return, I see how long I was away and how many pauses I have left before the resume
  countdown.

### After the match

**US-15 Result and rematch.** As a player, I want a clear result and a quick way to play again.

- Both players see the same result and reason (topped out, forfeit, no contest, session ended),
  and a stats table: lines, garbage sent, Tetrises, T-spins, power-ups used, pieces per second.
- **Rematch** starts a new match with a new seed when both press it within 30 s; otherwise each
  player returns to the start.

### Controls and layout

**US-16 Keyboard play on desktop.** As a desktop player, I want responsive keyboard controls.

- The default keys and timings are in [controls and layout](controls-and-layout.md#keyboard).
- I can rebind every action and change the auto-repeat delay and rate; my choices are remembered
  on this device.

**US-17 Gestures on a phone.** As a phone player, I want to play with swipes and taps.

- Swipe left or right moves the piece, following my finger one column per step.
- Tap rotates.
- Dragging down slowly soft-drops the piece row by row with my finger; a quick downward flick
  hard-drops it.
- Swipe up holds. A power-up button stays within thumb reach.
- The full map, thresholds and sensitivity setting are in
  [controls and layout](controls-and-layout.md#touch-gestures).
- An on-screen button pad is available as a setting for players who prefer it.

**US-18 Desktop uses the space.** As a desktop player, I want a screen that feels made for a big
monitor.

- On wide screens both boards grow to fill the height of the window without scrolling, with
  side panels for hold, next pieces, power-up, stats and a live match feed, as described in
  [controls and layout](controls-and-layout.md#layout).

**US-19 Phone layout.** As a phone player, I want my board as large as possible.

- In portrait my board fills most of the screen and my opponent's is a smaller board beside it;
  in landscape they sit side by side. The page never scrolls, zooms or pulls to refresh during a
  match, and the screen stays awake.

### Across the whole game

**US-20 Accessible by default.**

- Everything is operable by keyboard; focus is always visible.
- Garbage, gems and pieces are told apart by pattern and shape as well as colour.
- Reduced-motion settings turn off shakes, flying attacks and confetti; sound is off until the
  player turns it on.

## Non-functional requirements

| Area | Requirement |
|---|---|
| Frame rate | 60 fps on a mid-range 2021 phone and any recent desktop |
| Input | Own moves appear in the same frame; no network round trip on the local board |
| Network | Fully playable up to 150 ms one way; degrades visibly, not silently, above that |
| Determinism | The same seed and the same inputs produce the same match, tested in CI by replays |
| Cost | A 3-minute match stays within a few hundred billed Durable Object requests |
| Privacy | No accounts or personal data; a match's server state is deleted when its session ends |
| Fair play | The DO rejects impossible attack values and rate-limits messages; full server-side replay checks come later |

## Out of scope for v1

- The Tetris name, logo or look.
- Accounts, rankings, match history, saved replays and spectating other people's matches.
- More than two players, chat, custom skins, payments.
- Free-text handles (generated handles only, which avoids moderation).
- Running any server outside Cloudflare Workers and Durable Objects.

## Open questions

Each has the answer assumed until the owner says otherwise.

| # | Question | Assumed answer |
|---|---|---|
| 1 | The owner wrote "top to rotate". Is that "tap to rotate"? | Yes: tap rotates clockwise, a tap on the left third of the board rotates counter-clockwise. |
| 2 | How long before quick match offers a bot? | 20 s. |
| 3 | How long does an unused private game stay open? | 30 minutes of no activity. |
| 4 | Is a friend's private game allowed to use Classic mode? | Yes, it is a match setting. |
| 5 | Should the bot pretend to be a person in quick match? | No. A bot is always labelled as a bot. |

## Sources

- The planning session and the owner's decisions:
  [project-created journal entry](../process/journal/2026-09-30-project-created.md) and
  [spec session entry](../process/journal/2026-09-30-spec.md).
- The proof-of-concept pages the numbers were proven on:
  [Garbage Day](https://claude.ai/artifact/L5SGMhy2aj8qozrDVNSrkT) and
  [Garbage Day Live](https://claude.ai/artifact/VcuM8PLqvvcBjYD1n8EPja).
