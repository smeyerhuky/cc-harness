---
type: "Reference"
title: "Garbage Day Coverage Audit"
description: "Sweeps of every commitment in the spec and design against the roadmap, the backlog and the code, newest first; each gap becomes a work item."
resource: "../../../../kb/pdlc/coverage-audit.md"
tags: ["backlog", "milestone", "verification"]
timestamp: "2026-09-30"
---

# Garbage Day Coverage Audit

The method: [coverage audit](../../../../kb/pdlc/coverage-audit.md). In the first sweep no code
existed yet, so its *In code?* column is "no" throughout; a commitment counted as carried only by
a work item's acceptance criteria or a roadmap todo that named it.

## Sweep — 2026-09-30 (trigger: M1 exit)

Sources read: the M0 sweep below; `kb/product/` and `kb/design/` again, including everything
`stack-and-ci.md` gained during M1; the done M1 items' Resolutions; the code under `src/`; the
workflows; and CI and deploy logs. This sweep lists the commitments M1 carried, with evidence, the
ones M1 added, and the gaps. **2 gaps found and filed** as GD-TICKET-021 and 022.

| Commitment | Source | Milestone? | Work item? | In code? | Verdict |
|---|---|---|---|---|---|
| Every game rule and value | game rules | M1 | GD-TICKET-008 | `src/engine/src/` (`pieces`, `bag`, `attack`, `garbage`, `speed`, `player`) and their tests | covered |
| Fixed-point gravity table, no runtime `Math.pow` | architecture | M1 | GD-TICKET-008 | `speed-table.ts`, `speed.ts`; the determinism rules in `eslint.config.js` | covered |
| Pause, presence and showdown rules in the referee, with snapshots | pause and presence; PRD US-11, US-12 | M1 (engine), M3–M4 (server) | GD-TICKET-009 | `referee.ts`, 47 tests in `referee.test.ts` | covered in the engine; the Match DO side deferred (M3, M4) |
| Bot skill test: 10/10 beats 1/1 in at least 9 of 10 seeded matches | PRD US-03 | M1 | GD-TICKET-009 | `bot.test.ts` | covered |
| Determinism tested in CI by replays, identical in Node and the browser | PRD NFR; architecture; M1 exit | M1 | GD-TICKET-009, 019, 020 | `golden.test.ts`, `test/golden/*.json`; CI `test` and `test-browser` (Chromium, Firefox, WebKit) | covered |
| Cost tracked in replays | PRD NFR | M1, M5 | GD-TICKET-009 | `messagesPerMinute` in every golden file (1229.6 in `bots-1234.json`) | covered; the budget check is M5 |
| A schema for every message, a protocol version, a board encoding under 200 bytes | architecture | M1 | GD-TICKET-010 | `src/protocol/src/schemas.ts`; `board-codec.ts` (161 bytes at most) | covered |
| Workspace, pinned stack, `minimumReleaseAge`, build allowlist, clean audit | stack and CI | M1 | GD-TICKET-006, 011 | `pnpm-workspace.yaml`, `package.json`; CI `audit` | covered |
| Held-back versions checked by Renovate until their blockers move | stack and CI, exceptions | M1 | GD-TICKET-006 | `renovate.json`; the app installed 2026-09-30 | covered |
| **The `undici` override is deleted once Wrangler 4.143.1 or later is in** | stack and CI, exceptions | no | no | the override in `pnpm-workspace.yaml` | **gap → GD-TICKET-021**: Renovate updates Wrangler but never deletes an override |
| CI with one required summary check, dependency review, CodeQL, SHA-pinned actions | stack and CI | M1 | GD-TICKET-007 | `.github/workflows/garbage-day*.yml`; the `main-protect` ruleset requires `garbage-day-ok` | covered |
| Browser replays that don't depend on the Ubuntu mirror; the image and `playwright` updated together | stack and CI (added in M1) | M1 | GD-TICKET-020 | `test-browser`'s `container`; `renovate.json`'s `playwright` group | covered |
| Static assets with an SPA fallback; `/api` and `/ws` to the Worker; both DO classes with a SQLite migration | architecture; stack and CI | M1 | GD-TICKET-011 | `src/app/wrangler.jsonc`, `worker/index.ts`, `worker/index.test.ts` | covered |
| A Worker Preview per pull request with its own DO storage, deleted when it closes | stack and CI (changed in M1) | M1 | GD-TICKET-011 | `deploy-preview`; `garbage-day-preview-cleanup.yml`, whose logs say previews `pr-10` and `pr-11` were "deleted successfully" | covered |
| Previews declare the same bindings and vars as production | stack and CI (added in M1) | M1 | GD-TICKET-011 | the `previews` block; `src/app/test/wrangler-config.test.ts` | covered |
| Production on `main`, in the `production` environment, whatever is skipped upstream | stack and CI | M1 | GD-TICKET-011 | `deploy-production`'s condition; version `8336d700` live, confirmed by the owner | covered |
| **The Cloudflare token is replaced before it expires on 2026-12-29** | `GD-TICKET-011`'s Progress; the handoff | no | no | no | **gap → GD-TICKET-022** |
| Self-hosted display font; colour tokens, palette, pattern marks | UI language | M1 (the font, for the shell), M2 | GD-TICKET-011; M2 | `src/ui/src/tokens/fonts.css`, `tokens.css` | covered in part; the rest is M2 (GD-TICKET-023) |
| The server rejects impossible attacks | PRD NFR; architecture | M1 (schema), M3 | GD-TICKET-010 | the `attack` refinement in `schemas.ts` | covered in the schema; the Match DO's enforcement is M3 |

Every deferred row of the M0 sweep below was checked again: each is still named by the milestone
it gives (M2 to M5), and that sweep's gaps, GD-TICKET-012 to 017, are open in M2 to M4. At this
exit M2's todos became work items, so its deferred rows are now carried by items too.

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
