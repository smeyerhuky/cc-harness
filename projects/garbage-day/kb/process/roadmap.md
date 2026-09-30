---
type: "Playbook"
title: "Garbage Day Roadmap"
description: "The project's milestones — each with its todos, an exit criterion, and an owner check-in — starting with M0, standing the project up."
resource: "../../../../kb/pdlc/pipeline.md"
tags: ["roadmap", "milestone"]
timestamp: "2026-09-30"
---

# Garbage Day Roadmap

Low-level planning (pipeline stage 2b) for this project: milestones in order, each closed by its
exit criterion and followed by an owner check-in. The current milestone is decomposed into work
items in the [backlog](backlog/index.md) before its work starts, and the next one is minted at its
exit; later ones stay as todos here until their turn.
The rules: [pipeline — milestones](../../../../kb/pdlc/pipeline.md#milestones-check-ins-and-just-in-time-decomposition).

## Milestones at a glance

| Milestone | Goal | State |
|---|---|---|
| **M0** — Stand the project up | The spec says what we're building; the plan says how, in which milestones | done |
| **M1** — Foundations | The workspace, CI and deploy pipeline run green, and the engine is ported with golden replays | active — `GD-TICKET-011` preview confirmed; production on the merge |
| **M2** — Play solo | A complete match against a local bot in the React client, on desktop and phone | planned |
| **M3** — Play online | Two people play each other through the Worker, Lobby DO and Match DO | planned |
| **M4** — Pauses and presence | Every pause and presence rule works over the real network, including deploy restarts | planned |
| **M5** — Launch | Verified on real devices and networks, within budget, deployed to production | planned |

## M0 — Stand the project up

- [x] Write the spec in `kb/product/` — what this is, for whom, out of scope, user stories with
  acceptance criteria (pipeline stage 1) — [`GD-TICKET-001`](backlog/GD-TICKET-001.md)
- [x] Record the proof of concept as a spike — [`GD-SPIKE-001`](backlog/GD-SPIKE-001.md)
- [x] Sketch the high-level design in `kb/design/` (pipeline stage 2a), in four parts:
  - [x] Architecture from the proof of concept — [`GD-TICKET-002`](backlog/GD-TICKET-002.md)
  - [x] UI language design notes — [`GD-TICKET-003`](backlog/GD-TICKET-003.md)
  - [x] Tech stack, build and CI pipeline — [`GD-TICKET-004`](backlog/GD-TICKET-004.md)
  - [x] React client architecture — [`GD-TICKET-005`](backlog/GD-TICKET-005.md)
- [x] Add the next milestones to this roadmap, and mint the first build milestone's work items
  (M1, under the v1 epic, GD-EPIC-001)
- [x] Decide whether the project warrants a kickoff ceremony
  ([ceremonies](../../../../kb/pdlc/ceremonies.md)): no. One owner, and every decision so far is
  recorded in the journal; offered to the owner at the M0 check-in
- [x] Run the coverage audit ([`coverage-audit.md`](coverage-audit.md), sweep 2026-09-30)

**Exit:** a fresh session could read the spec, the design sketch, and this roadmap and know what
to build first. → **Owner check-in** (held 2026-09-30: "Continue", every default kept).

## M1 — Foundations

- [x] Scaffold the pnpm workspace with the pinned stack, lint, format, typecheck, Knip, Renovate,
  `minimumReleaseAge` and a clean audit — [`GD-TICKET-006`](backlog/GD-TICKET-006.md)
- [x] The GitHub Actions workflow with the required checks, dependency review and CodeQL —
  [`GD-TICKET-007`](backlog/GD-TICKET-007.md)
- [x] Port the engine core to TypeScript with fixed-point gravity and unit tests —
  [`GD-TICKET-008`](backlog/GD-TICKET-008.md)
- [x] Port the referee, bot and local match, with golden replays and a messages-per-minute check —
  [`GD-TICKET-009`](backlog/GD-TICKET-009.md)
- [x] The protocol package with schemas and round-trip tests —
  [`GD-TICKET-010`](backlog/GD-TICKET-010.md)
- [ ] The app shell deployed: preview per pull request, production on `main` —
  [`GD-TICKET-011`](backlog/GD-TICKET-011.md)
- [x] The golden replays run in Chromium, Firefox and WebKit, in CI —
  [`GD-TICKET-019`](backlog/GD-TICKET-019.md)

**Exit:** a pull request runs every required check green; golden replays give identical hashes on
two runs and in Node and the browser; the shell is live on a preview URL and in production, opened
by the owner. → **Owner check-in.**

## M2 — Play solo

- [ ] The `ui` commons: tokens (UI language palette, pattern marks, self-hosted fonts), primitives,
  game widgets, hooks, and the token-contrast test
- [ ] `MatchSession` over a local referee, and the match screen: `BoardCanvas`, panels, centre
  column, meter, speed chip, showdown banner, clear labels, attack flight, results (US-05, US-08,
  US-09, US-10, US-11, US-15 locally)
- [ ] Keyboard controls with rebinding and DAS/ARR settings (US-16)
- [ ] Touch gestures per the gesture table, the optional button pad, haptics (US-17)
- [ ] Desktop layout including the match feed at ≥ 1600 px, phone portrait and landscape, no
  scrolling during a match, wake lock (US-18, US-19)
- [ ] Bot setup with presets and separate skill and speed, the skill test (US-03 locally)
- [ ] Home screen, generated handles, preferences store, settings sheet (US-04)
- [ ] Reduced motion, sound toggle, keyboard operability, axe scan (US-20); the developer overlay
- [ ] App flow machine, routes and contexts — [`GD-TICKET-014`](backlog/GD-TICKET-014.md)
- [ ] Touch visual feedback — [`GD-TICKET-015`](backlog/GD-TICKET-015.md)
- [ ] Name the four-row clear without the Tetris name — [`GD-TICKET-018`](backlog/GD-TICKET-018.md)

## M3 — Play online

- [ ] Worker routes, rate limits, static assets with SPA fallback
- [ ] Lobby DO quick match, waiting count, bot offer after 20 s (US-01)
- [ ] Private games: create, code and link, Copy and Share, ready lobby, full and expired states
  (US-02)
- [ ] Match DO: dealing bags with gems, relay at 15 Hz and per lock, hidden next pieces, garbage
  routing with the ledger and resend, showdown multiplier, power-up stamping, server-side message
  validation and attack limits (US-06, US-07, US-08, US-10, US-11)
- [ ] Clock sync and active-time speed levels across two clients (US-09)
- [ ] The bot as a second client in a Web Worker (US-03 online)
- [ ] Results and rematch over the network (US-15)
- [ ] Durable Object tests in the Workers pool; end-to-end quick match and private link with two
  browsers
- [ ] Client outbox and reconnect with backoff — [`GD-TICKET-013`](backlog/GD-TICKET-013.md)
- [ ] Label bots as bots everywhere — [`GD-TICKET-016`](backlog/GD-TICKET-016.md)
- [ ] Connection quality indicator, visible degradation above 150 ms — [`GD-TICKET-017`](backlog/GD-TICKET-017.md)

## M4 — Pauses and presence

- [ ] Away and back from `visibilitychange`/`pagehide`, Step away, the pause budget, hidden boards,
  the resume countdown (US-12)
- [ ] The waiting player's popover, wait bar, +1:00, Leave with the configurable result (US-13)
- [ ] Heartbeats by auto-response, free reconnects, the 15 s grace, both-away session end, all as
  DO alarms
- [ ] Rejoin after closing the tab, SQLite snapshots, restore after a deploy restart
- [ ] Return notes with time away and pauses left (US-14)
- [ ] End-to-end: a tab hidden and shown mid-match, a dropped connection, a closed and reopened tab
- [ ] Delete a match's stored state when its session ends — [`GD-TICKET-012`](backlog/GD-TICKET-012.md)

## M5 — Launch

- [ ] Real-device pass: a mid-range phone at 60 fps, desktop, cross-network play at up to 150 ms
- [ ] Cost check: billed requests per match against the PRD budget
- [ ] Accessibility audit of every screen
- [ ] Production deploy and the owner's playtest
