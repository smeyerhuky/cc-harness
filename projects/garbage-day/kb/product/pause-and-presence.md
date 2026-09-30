---
type: "Reference"
title: "Garbage Day — Pause and Presence Rules"
description: "What happens when a player switches tab, closes the tab, loses the connection, runs out of pauses, or both players leave: detection, the pause budget, free reconnects, the waiting player's popover, hidden boards, returns and session end."
resource: "prd.md"
tags: ["spec", "product", "presence"]
timestamp: "2026-09-30"
relationships:
  - type: ELABORATES
    target: prd.md
---

# Garbage Day — Pause and Presence Rules

The owner decided these rules in the planning session; the proof-of-concept Match DO runs all of
them. Timings marked *setting* are match settings from the [PRD](prd.md#match-settings).

## How the Match DO finds out

| What happened | How it is detected | Uses a pause? |
|---|---|---|
| Switched tab or app, locked the phone | The browser's `visibilitychange`; the client sends `away` at once | Yes |
| Stepped away (a button, for players who can't switch tabs) | The client sends `away` | Yes |
| Closed the tab | The WebSocket closes and the DO's close handler runs | Yes |
| Lost the connection, crashed, slept | No heartbeat for 5 s | No, up to 3 times per match |

A client that loses its own connection freezes itself at once and shows "Reconnecting"; the other
player keeps playing until the DO notices, at most 5 s later.

## The pause

1. **Both games freeze**, and **both boards are hidden**, so nobody gains time or information.
2. **The pause budget.** Each player has 2 pauses per match (*setting*, 0–3). A connection loss
   caught by heartbeats does not use one, up to 3 free reconnects per match; after those, a
   connection loss uses the budget like any other absence.
3. **The timer.** The DO sets an alarm for 2:00 (*setting*). Both screens show the DO's deadline.
4. **The waiting player's popover** says why the game is paused and offers:
   - **Wait**, which folds the popover into a small bar that keeps the timer and the other two
     buttons;
   - **+1:00**, at any time while waiting, which moves the DO's alarm;
   - **Leave**, which ends the match as **no contest**, or as the waiting player's win if the
     match settings say so.
5. **The timer runs out.** The absent player forfeits.
6. **Returning.** The DO starts a 3-second countdown on both screens; the boards reappear and
   play resumes on the same tick for both.

## No pauses left

Leaving with no pauses left does not pause the match. The match keeps running, the absent
player's board stands still, and they have **15 s** to return; after that they forfeit. Their
opponent sees "Away, no pauses left" and the time remaining.

## Both players away

If the waiting player also leaves, the DO starts a **5:00** session timer. Either player's return
cancels it and the pause continues, now waiting for the other player. If it runs out, the session
ends with no result and the DO deletes the match's stored state.

## Coming back

- The returning player sees how long they were away and how many pauses they have left, for
  example "You were away 0:47 · 1 pause left", before the countdown.
- A player who closed the tab rejoins by opening the same link; the browser keeps a join token.
  The DO sends back both boards and the meter, and resends any garbage the player had not
  acknowledged. The piece that was in their hand is dealt again.
- The other player sees the same line about the returning player.

## Phones

Switching apps, locking the screen and incoming calls all count as leaving. Heartbeats are the
source of truth, because a phone can suspend a page without any event reaching the server.
