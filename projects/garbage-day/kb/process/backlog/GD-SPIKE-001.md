---
type: "Work Item"
title: "GD-SPIKE-001: Prove the no-backend multiplayer design"
description: "Record the proof of concept built during planning: can a live two-player game run on one Durable Object per match, with identical pieces, fair pauses and deterministic replays? Resolved yes; the code and evidence are in spikes/proof-of-concept/."
resource: "../journal/2026-09-30-project-created.md"
tags: ["backlog", "spike"]
timestamp: "2026-09-30"
state: "done"
milestone: "M0"
relationships:
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-project-created.md
---

# GD-SPIKE-001: Prove the no-backend multiplayer design

## Description

The owner's first question was what a live multiplayer version needs "without a backend
service". Before the project existed, the planning session answered it by building two
proof-of-concept pages. This item records that investigation after the fact so its code and
evidence live in the repo, where the build can port them.

## Acceptance Criteria

- The unknown is resolved and documented: whether one Durable Object per match, plus each browser
  running its own deterministic board, can deliver live play with identical pieces, garbage
  routing, the owner's pause rules and deterministic replays, within the free plan.
- The code that ran is in `spikes/proof-of-concept/` and still passes its own checks.

## Linked Artifacts

- [Spike journal](../../../spikes/proof-of-concept/JOURNAL.md)
- [Garbage Day](https://claude.ai/artifact/L5SGMhy2aj8qozrDVNSrkT) and
  [Garbage Day Live](https://claude.ai/artifact/VcuM8PLqvvcBjYD1n8EPja)

## Proposed Resolution

Yes. Build v1 on exactly this shape: a Lobby DO for pairing and private games, one Match DO per
match, and a shared deterministic TypeScript engine ported from `live-engine.js`, used by the
client, the Match DO and the bot.

## AI PDLC Prompt

Done; nothing to execute. To re-check the evidence: from
`projects/garbage-day/spikes/proof-of-concept/`, run `node replay/check.js` (expects
`ALL CHECKS PASS`), `node live/test-live.js` (expects `deterministic: true`), and
`python3 live/build.py` (rebuilds `live/garbage-day-live.html`).

## Resolution

Resolved yes, as proposed. Evidence in the [spike journal](../../../spikes/proof-of-concept/JOURNAL.md);
the code was committed in the design session (see
[its journal entry](../journal/2026-09-30-design.md)) and re-verified there: the rebuilt page is
byte-identical, `ALL CHECKS PASS`, `deterministic: true`. The answer became
[`kb/design/architecture.md`](../../design/architecture.md).
