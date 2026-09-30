---
type: "Reference"
title: "Garbage Day Coverage Audit"
description: "Sweeps of every commitment in the spec and design against the roadmap, the backlog and the code, newest first; each gap becomes a work item."
resource: "../../../../kb/pdlc/coverage-audit.md"
tags: ["backlog", "milestone", "verification"]
timestamp: "2026-09-30"
---

# Garbage Day Coverage Audit

The method: [coverage audit](../../../../kb/pdlc/coverage-audit.md). No code exists yet, so the
*In code?* column is "no" throughout this first sweep; a commitment counts as carried only by a
work item's acceptance criteria or a roadmap todo that names it.

## Sweep — 2026-09-30 (trigger: M0 exit)

Sources read: `kb/product/` (PRD, game rules, pause and presence rules, controls and layout),
`kb/design/` (architecture, client architecture, UI language, stack and CI), the project's
`CLAUDE.md`. **6 gaps found and filed** as GD-TICKET-012 to 017.

| Commitment | Source | Milestone? | Work item? | In code? | Verdict |
|---|---|---|---|---|---|
| Quick match: pool, waiting count, pairing and countdown within 2 s, bot offer at 20 s, cancel | PRD US-01 | M3 (named) | no | no | deferred |
| Private games: code and link, Copy and Share, settings, ready lobby, full, 30 min expiry | PRD US-02; architecture | M3 (named) | no | no | deferred |
| Bot presets, separate skill and speed, remembered choice | PRD US-03 | M2 (named) | GD-TICKET-009 (mapping) | no | covered in part, rest deferred |
| Bot skill test: 10/10 beats 1/1 in 9 of 10 seeded matches | PRD US-03 | M1 | GD-TICKET-009 | no | covered |
| Bot as a second client in a Web Worker under the Match DO's rules | PRD US-03; architecture | M3 (named) | no | no | deferred |
| **Bots are always labelled as bots** | PRD open question 5 | no | no | no | **gap → GD-TICKET-016** |
| Generated handles, stored only on the device | PRD US-04 | M2 (named) | no | no | deferred |
| Every game rule and value | game rules | M1 | GD-TICKET-008 | no | covered |
| Own moves render in the same frame; simultaneous play | PRD US-05 | M2 (named) | no | no | deferred |
| Same bags and gems for both, dealt per bag, next hidden, seed server-only | PRD US-06; architecture | M3 (named) | no | no | deferred |
| Opponent view at ≥ 15 Hz up to 150 ms | PRD US-07 | M3 (named) | no | no | deferred |
| Garbage: routing with ids and the ledger, resend on rejoin | PRD US-08; architecture | M3 (named) | GD-TICKET-009 (referee rules) | no | covered in part, rest deferred |
| Garbage feedback: attack flight, shake, sound, vibration | PRD US-08; UI language | M2 (named) | no | no | deferred |
| Speed-up on the DO's active clock, visible level | PRD US-09; architecture | M3, M2 (named) | GD-TICKET-008 (table) | no | covered in part, rest deferred |
| Fixed-point gravity table, no runtime `Math.pow` | architecture | M1 | GD-TICKET-008 | no | covered |
| Power-ups: gems, one slot, effects, DO-stamped activation | PRD US-10; game rules | M1, M3 (named) | GD-TICKET-008 | no | covered in part, rest deferred |
| Showdowns: announcements, double garbage, sudden death | PRD US-11 | M1, M2, M3 (named) | GD-TICKET-009 | no | covered in part, rest deferred |
| Pause rules: detection, budget, free reconnects, grace, both away, hidden boards, countdown | PRD US-12; pause and presence | M4 (named) | GD-TICKET-009 (referee) | no | covered in part, rest deferred |
| Waiting player's popover, +1:00, Leave with configurable result | PRD US-13 | M4 (named) | no | no | deferred |
| Return note with time away and pauses left | PRD US-14 | M4 (named) | no | no | deferred |
| Result, stats table, rematch within 30 s | PRD US-15 | M2, M3 (named) | no | no | deferred |
| Keyboard defaults, rebinding, DAS/ARR settings | PRD US-16 | M2 (named) | no | no | deferred |
| Gesture table, sensitivity, pad, haptics | PRD US-17; controls | M2 (named) | no | no | deferred |
| **Touch visual feedback: axis arrow, flick streak, tap arc** | UI language | no | no | no | **gap → GD-TICKET-015** |
| Desktop layout with side panels, centre column, feed at ≥ 1600 px | PRD US-18 | M2 (named) | no | no | deferred |
| Phone portrait and landscape, no scroll or zoom, wake lock | PRD US-19 | M2 (named) | no | no | deferred |
| Keyboard operability, pattern marks, reduced motion, sound off by default | PRD US-20; UI language | M2 (named), M5 audit | no | no | deferred |
| Piece palette, tokens, token-contrast test, self-hosted fonts | UI language | M2 (named) | no | no | deferred |
| 60 fps on a mid-range phone | PRD NFR | M5 (named) | no | no | deferred |
| Playable up to 150 ms one way | PRD NFR | M5 (named) | no | no | deferred |
| **Degrades visibly above 150 ms** | PRD NFR | no | no | no | **gap → GD-TICKET-017** |
| Determinism tested in CI by replays | PRD NFR; architecture | M1 | GD-TICKET-009, GD-TICKET-007 | no | covered |
| Cost: a few hundred billed requests per match, tracked in replays | PRD NFR; architecture | M1, M5 | GD-TICKET-009 | no | covered |
| **A match's server state is deleted when its session ends** | PRD NFR (privacy) | no | no | no | **gap → GD-TICKET-012** |
| DO rejects impossible attacks, rate-limits messages; schemas on every message | PRD NFR; architecture | M1, M3 (named) | GD-TICKET-010 | no | covered in part, rest deferred |
| Message schemas, versioning, snapshot encoding under 200 bytes | architecture | M1 | GD-TICKET-010 | no | covered |
| Heartbeats by WebSocket auto-response; timers as DO alarms | architecture | M4 (named) | no | no | deferred |
| SQLite snapshots and restore after a deploy restart | architecture | M4 (named) | no | no | deferred |
| **Client outbox while offline, reconnect with backoff** | architecture | no | no | no | **gap → GD-TICKET-013** |
| Clock sync with the server | architecture | M3 (named) | no | no | deferred |
| **App flow as an XState actor, routes, narrow contexts, error boundaries, lazy routes** | client architecture | no | no | no | **gap → GD-TICKET-014** |
| `MatchSession` external store with selectors; canvas outside React renders | client architecture | M2 (named) | no | no | deferred |
| Developer overlay, off by default | architecture; UI language | M2 (named) | no | no | deferred |
| Workspace, pinned latest stack, Renovate, `minimumReleaseAge`, audit clean | stack and CI | M1 | GD-TICKET-006 | no | covered |
| CI jobs, required checks, dependency review, CodeQL | stack and CI | M1 | GD-TICKET-007 | no | covered |
| End-to-end job with two browsers and axe | stack and CI | M3, M2 (named) | no | no | deferred |
| Preview per PR, production on `main` with an environment | stack and CI | M1 | GD-TICKET-011 | no | covered |
| Durable Object tests in the Workers pool | stack and CI | M3 (named) | no | no | deferred |
