---
type: "Reference"
title: "Garbage Day"
description: "A two-player, real-time falling-block versus game with garbage attacks, matched and relayed by Cloudflare Durable Objects, built in React from a proven proof of concept."
resource: "../../garbage-day/CLAUDE.md"
tags: ["project", "cloudflare", "workers"]
timestamp: "2026-09-30"
---

# Garbage Day

A live, side-by-side falling-block game: two players get the same seeded pieces, clear lines to
send garbage to each other, and play through power-ups, showdowns and a speed-up until one tops
out. One Durable Object per match deals the pieces, relays moves, routes garbage and referees
pauses; there is no other server.

## PDLC

| | |
|---|---|
| Prefix | `GD` |
| Handoff — where it stands now | [`kb/process/handoff.md`](../../garbage-day/kb/process/handoff.md) |
| Backlog | [`kb/process/backlog/`](../../garbage-day/kb/process/backlog/index.md) |

Static fields only: current milestone and open work are read from the handoff and backlog.
