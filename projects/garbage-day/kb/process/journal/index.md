# Running Journal — Garbage Day

What happened on this project, one entry per working session, **newest first**: what landed
(commits, work-item IDs), what broke and why, decisions made with the owner, and what's next.
Entries are appended, never rewritten; the current state lives in [`handoff.md`](../handoff.md).
Each entry follows the [running-journal entry template](../../../../../kb/pdlc/templates/running-journal-entry.md).

* [2026-10-22 — Garbage Day: a clean dependency audit again](2026-10-22-audit-deps.md) — new
  advisories turned `audit` red on every pull request; Vite 8.3.4, Wrangler 4.151.0 with its
  matched plugins, Vitest 4.1.12 and `source-map-js` 1.2.2 cleared them; `GD-TICKET-034` done.
* [2026-10-21 — Garbage Day: the connection-quality indicator](2026-10-21-connection-quality.md)
  — the branch restarted from `main` after #16 and #17 closed `GD-STORY-014`; pongs timed against
  their pings; good, fair or poor beside the clock and "Slow connection" over the rival past 150 ms
  one way, checked in Chromium through a delaying proxy; `GD-TICKET-017` done.
* [2026-10-02 — Garbage Day: checking the rematch, and fixing what the check found](2026-10-02-rematch.md)
  — pull request #15 merged; `GD-STORY-014`'s criteria checked against it; four faults in the
  rematch found (an unpressed player stuck, a bot that never answers, a screen that closed its own
  match, a second match never announced) and fixed; played in two browsers; `GD-STORY-014` done.
* [2026-09-30 — Garbage Day M1: workspace, CI and the engine](2026-09-30-scaffold.md) — the
  owner's "Continue" closed M0 with every default kept; the pnpm workspace scaffolded
  (`GD-TICKET-006`); CI workflows green, with one required check (`GD-TICKET-007`); the engine
  core ported and checked against the proof of concept (`GD-TICKET-008`); referee, bot, local
  match and ten golden replays (`GD-TICKET-009`); the protocol package (`GD-TICKET-010`); the
  app shell and deploy jobs, verified locally (`GD-TICKET-011`, blocked on the owner); golden
  replays green in Chromium, Firefox and WebKit (`GD-TICKET-019`); `GD-TICKET-018` filed.
* [2026-09-30 — Garbage Day design and M0 exit](2026-09-30-design.md) — the proof of concept as
  `GD-SPIKE-001`; four design files (`GD-TICKET-002`–`005`); M1–M5 planned, M1 minted; coverage
  audit with six gaps filed (`GD-TICKET-012`–`017`).
* [2026-09-30 — Garbage Day spec written](2026-09-30-spec.md) — the PRD and three rules files in
  `kb/product/`; `GD-TICKET-001` done; design items `GD-TICKET-002` to `004` minted.
* [2026-09-30 — Garbage Day created](2026-09-30-project-created.md) — the project created and
  its prefix registered; first work item: `GD-TICKET-001`, write the spec.
