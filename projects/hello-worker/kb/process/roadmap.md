---
type: "Playbook"
title: "Hello Worker Roadmap"
description: "The project's milestones — one, done: the minimal Worker deployed and verified, with its spec recorded as the repo's deploy recipe. New work starts a new milestone here."
resource: "../../../../kb/pdlc/pipeline.md"
tags: ["roadmap", "milestone"]
timestamp: "2026-09-29"
---

# Hello Worker Roadmap

Low-level planning (pipeline stage 2b) for this project: milestones in order, each closed by its
exit criterion and followed by an owner check-in. The current milestone is decomposed into work
items in the [backlog](backlog/index.md) before its work starts, and the next one is minted at its
exit; later ones stay as todos here until their turn.
The rules: [pipeline — milestones](../../../../kb/pdlc/pipeline.md#milestones-check-ins-and-just-in-time-decomposition).

## Milestones at a glance

| Milestone | Goal | State |
|---|---|---|
| **M0** — The minimal Worker, deployed and verified | The smallest Worker that deploys, verified locally and deployed; its spec recorded | done |
| **M1** — The greeting names the harness | The Worker's response names this repo | done |

## M0 — The minimal Worker, deployed and verified

Built and deployed before the project had PDLC files; recorded here so the roadmap tells the
truth about where the project is.

- [x] `src/index.js` and `wrangler.jsonc` — the two files of the
  [minimal Worker recipe](../../../../kb/platforms/cloudflare-workers-minimal.md)
- [x] `.gitignore` for `wrangler dev`'s cache, before the first local run
- [x] Verified locally with `wrangler dev`, then deployed
- [x] Record where the spec lives — [`HW-TICKET-001`](backlog/HW-TICKET-001.md)

**Exit:** a fresh session can read this project's `CLAUDE.md` and the recipe it links, run the
local verify, and deploy it. → Met.

## M1 — The greeting names the harness

- [x] `src/index.js` returns `hello world from cc-harness` — [`HW-TICKET-002`](backlog/HW-TICKET-002.md)

**Exit:** the handler returns the new greeting; the project gates pass. → Met. Not redeployed.

## Next

No further milestones: the project is deliberately minimal. New work — a change to the recipe it
demonstrates, say — starts a new milestone here with its first work item.
