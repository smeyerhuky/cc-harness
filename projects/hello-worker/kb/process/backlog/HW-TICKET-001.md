---
type: "Work Item"
title: "HW-TICKET-001: Record where the spec lives"
description: "Hello Worker's spec already exists as the repo's minimal-Worker deploy recipe, which was written from this project; record that in the project's CLAUDE.md, overview, and roadmap instead of writing a second spec."
resource: "../journal/2026-09-29-pdlc-retrofit.md"
tags: ["backlog", "workflow"]
timestamp: "2026-09-29"
state: "done"
milestone: "M0"
relationships:
  - type: DERIVED_FROM
    target: ../journal/2026-09-29-pdlc-retrofit.md
---

# HW-TICKET-001: Record where the spec lives

## Description

Every project's first item is its spec. This project was built before it had PDLC files, and its
spec already exists: the repo's
[minimal Worker recipe](../../../../../kb/platforms/cloudflare-workers-minimal.md) describes
exactly what it must do, because it was written from it. A second spec in `kb/product/` would
only drift from the recipe.

## Acceptance Criteria

- The PDLC table in the project's `CLAUDE.md` points the spec row at the recipe and the deploy
  lifecycle, and the design row says there is none beyond the two files.
- The overview says what the project is, for whom, and what is out of scope, and that its spec is
  the recipe.
- The roadmap records M0 as done, and the handoff says no work is open.
- The project gates pass on this bundle.

## Linked Artifacts

- [Minimal Worker recipe](../../../../../kb/platforms/cloudflare-workers-minimal.md) — the spec
- [Overview](../../overview/about.md) · [Roadmap](../roadmap.md)

## AI PDLC Prompt

Done — see Resolution.

## Resolution

Done 2026-09-29, when the project was brought under the PDLC layer: the `CLAUDE.md` PDLC table,
the overview, the roadmap (M0 done), and the handoff (no open work) record where the spec lives.
The project gates pass on `projects/hello-worker/kb/`.
