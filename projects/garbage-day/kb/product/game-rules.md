---
type: "Reference"
title: "Garbage Day — Game Rules"
description: "The v1 rulebook with its numbers: board, pieces and randomizer, movement and timing, the attack table, garbage delivery, the speed curve, power-ups, showdowns and top-out; proven in the proof-of-concept engine."
resource: "prd.md"
tags: ["spec", "product", "game-rules"]
timestamp: "2026-09-30"
relationships:
  - type: ELABORATES
    target: prd.md
---

# Garbage Day — Game Rules

The rules both clients and the Match DO implement. Every value here was run in the
proof-of-concept engine (two bots played hundreds of matches with them); a change to a value is a
spec change and lands here first.

## Board and pieces

| Rule | v1 value |
|---|---|
| Board | 10 columns × 20 visible rows, plus 4 hidden rows above |
| Pieces | The seven four-cell pieces I, O, T, S, Z, J, L |
| Randomizer | 7-bag: each bag holds all seven, shuffled; bags follow each other |
| Dealing | The Match DO keeps the seed and deals each player one bag at a time, the same bags to both |
| Spawn | Top two visible rows, centred; I and O one column further right as in the standard layout |
| Rotation | Clockwise and counter-clockwise, with the standard wall-kick tables (a separate table for I) |
| Hold | One piece; usable once per piece |
| Next queue | Own next 5 visible; the opponent's never shown |
| Ghost piece | Shows where the piece will land |

## Movement and timing

| Rule | v1 value |
|---|---|
| Simulation | 60 ticks a second, identical on every device |
| Auto-repeat delay (DAS) | 167 ms (10 ticks), adjustable |
| Auto-repeat rate (ARR) | 33 ms (2 ticks), adjustable |
| Soft drop | 20× gravity, at least half a row per tick |
| Lock delay | 0.5 s on the ground, reset by a move or rotation up to 15 times; reaching a new lowest row restores the resets |
| Line clear delay | 0.2 s, while the cleared rows flash |
| Spawn delay | 4 ticks after a lock |

## Attack table

Rows sent by a clear, before cancelling:

| Clear | Rows |
|---|---|
| Single · Double · Triple | 0 · 1 · 2 |
| Tetris (4 rows) | 4 |
| T-spin Single · Double · Triple | 2 · 4 · 6 |
| Back-to-back (a Tetris or T-spin right after another) | +1 |
| Combo (clears on consecutive pieces), by count 0–10+ | 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5 |
| Perfect clear (board empty afterwards) | at least 10 |

A T-spin is a T piece whose last move was a rotation and which has at least three of the four
cells diagonal to its centre filled or out of bounds. v1 does not treat mini T-spins separately.

## Garbage

1. **Cancel first.** A clear's rows first cancel rows waiting in my own meter, oldest first; only
   the rest is sent.
2. **The DO routes.** Sent rows go to the Match DO, which applies any showdown multiplier, gives
   the attack an id and delivers it to the opponent.
3. **The meter.** Arriving rows wait in the receiver's meter and become ready after 0.5 s.
4. **Landing.** Ready rows land when the receiver locks a piece without clearing a line, at most
   8 rows per lock; the rest wait for the next lock.
5. **Holes.** All rows of one attack share one hole column, drawn from the receiver's own seeded
   stream, so garbage never changes anyone's piece sequence.
6. **Reconnects.** The receiver acknowledges attack ids; after a reconnect the DO resends any it
   has not acknowledged.

## Speed curve

The level rises by one every 15 s of active play (the *speed-up* setting), up to level 15, on the
Match DO's clock, so both players speed up together and pauses do not count.

Time for a piece to fall one row at level *L*: `(0.8 − (L − 1) × 0.007) ^ (L − 1)` seconds. Level 1
is 1 s per row; level 15 is about 2.4 rows per tick. Sudden death and Rush add levels on top, up
to 20.

## Power-ups

About 1 piece in 6 carries a gem on one of its cells, decided by the DO when it deals, so both
players get the same gems. Clearing the gem's row banks the power-up in the single slot; a gem
cleared while the slot is full is lost. Firing sends the activation to the DO, which stamps a
time 0.2 s ahead and tells both clients to apply it then.

| Power-up | Effect |
|---|---|
| **Shield** | Wipes your meter and blocks every attack routed to you for 5 s |
| **Bomb** | Removes your bottom 3 rows, garbage included |
| **Fog** | Clouds the top three-quarters of your opponent's board for 6 s |
| **Rush** | Adds 4 speed levels to your opponent for 6 s |

Classic mode turns gems off.

## Showdowns

Announced to both players 5 s ahead. Classic mode turns them off.

| At (active play) | Showdown | Effect |
|---|---|---|
| 1:00 | Double garbage | Every routed attack is doubled for 15 s |
| 2:30 | Sudden death | +4 speed levels and doubled garbage until someone tops out |

## Top out

A player loses when a new piece cannot spawn, when a piece locks entirely above the visible
board, or when landing garbage pushes blocks beyond the hidden rows.
