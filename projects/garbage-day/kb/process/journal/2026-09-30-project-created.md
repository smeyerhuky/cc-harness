---
type: "Journal"
title: "2026-09-30 — Garbage Day created"
description: "The session that planned Garbage Day from a question to two proof-of-concept pages, then created the project; the owner asked for a spec, PRD, UI-language notes, tech stack and build/CI docs."
resource: "Working session 2026-09-30"
tags: ["journal"]
timestamp: "2026-09-30"
---

# 2026-09-30 — Garbage Day created

**Epic:** none · **Milestone:** M0 (active) · **Branch:** `ccr-a9d3b393-jvy3f5`

## What happened

1. The project was created by the repo's new-project steps (`projects/CLAUDE.md`, "Adding a new
   project"), and its work-item prefix `GD` was registered.
2. The owner's request, in their words: "Ok let's create the garbage Day project. Read the repo
   kb and start building the spec. This can be an established POC design and also needs a set of
   product documentation a prd and design notes for the UI language. The technological [stack],
   the build and CI pipeline etc. What's the first step". Before that, the same session had
   planned the game (a Cloudflare-only multiplayer falling-block game), explained garbage, and
   built two proof-of-concept pages: [Garbage Day](https://claude.ai/artifact/L5SGMhy2aj8qozrDVNSrkT)
   and [Garbage Day Live](https://claude.ai/artifact/VcuM8PLqvvcBjYD1n8EPja).
3. [`GD-TICKET-001`](../backlog/GD-TICKET-001.md) — write the spec — is the first work item.

## Decisions with the owner

Decided earlier in this session, before the project existed; the spec starts from these.

| Question | Owner's answer |
|---|---|
| Backend? | None to operate: Cloudflare Workers + Durable Objects (Wrangler). |
| How do matches start? | Join a random opponent or a pool of waiting players; same seed, same pieces. |
| Turns or live? | Live: both play at once; the game speeds up over time. |
| Extras? | Power-ups and showdowns; each player sees only their own next pieces. |
| Leaving the tab or closing it? | Both games pause; the other player gets a wait-or-leave popover with a 2:00 timer they can extend. |
| Leave while the other is away? | No contest (configurable). |
| Pause abuse? | A pause budget, except for a true connection loss; both boards hidden while paused. |
| Both players gone? | The session ends after a default timeout. |
| Mobile? | Yes. |
| Show time away on return? | Yes. |

## What landed

| Commit | Work item | What |
|---|---|---|
| this session's commit | [`GD-TICKET-001`](../backlog/GD-TICKET-001.md) | the project created; its first work item ready |

## Surprises and what they changed

None.

## Verification

Project gates on `projects/garbage-day/kb/` and `projects/kb/`, both exit 0:

```
OK: bundle is OKF-conformant, no warnings.
OK: no authority-control findings.
OK: 1 relationship edge(s) valid; 0 record(s) with status; 1 work item(s) with state.
OK: weeding policy satisfied; every record has provenance.
OK: backlog consistent — 1 work item(s), prefix GD; index, next-free IDs, roadmap, and journal index agree.
```

The leftovers check (`grep -rniE 'sample|smp|scaffold'`) prints nothing.

## Next

[`GD-TICKET-001`](../backlog/GD-TICKET-001.md) — write the spec with the owner.
