---
type: "Reference"
title: "Sample Project"
description: "The scaffold every new project is copied from: a complete, validated PDLC project whose own files carry no template prose — every line a new project must write is marked SCAFFOLD:."
resource: "../../sample-project/CLAUDE.md"
tags: ["project"]
timestamp: "2026-09-29"
---

# Sample Project

**The scaffold every new project is copied from.** It is a real, validated project bundle — the
same gates pass on it as on any project — but its own files describe nothing: every line a new
project must write itself is marked `SCAFFOLD:`, so a copy that has been renamed and filled
contains no trace of the scaffold. This card, not the scaffold, is where it is described as a
template.

## What a copy starts with

```
projects/<name>/
├── src/                        # source code
├── kb/
│   ├── index.md                # KB entry point (the only okf_version)
│   ├── overview/about.md       # what it is, for whom, out of scope
│   └── process/
│       ├── handoff.md          # where it stands now — read first
│       ├── roadmap.md          # M0 — stand the project up
│       ├── backlog/            # the first item: <PREFIX>-TICKET-001, write the spec
│       ├── journal/            # the first entry: the session that created the project
│       └── definition-of-done.md
├── CLAUDE.md                   # governs the project, incl. its PDLC section and prefix
├── README.md
└── version.json                # status, milestone, updated
```

`kb/product/`, `kb/design/`, `kb/alignment/`, `spikes/`, and the coverage-audit file are created
when they are first needed.

## PDLC

| | |
|---|---|
| Prefix | `SMP` |
| Handoff — where it stands now | [`kb/process/handoff.md`](../../sample-project/kb/process/handoff.md) |
| Backlog | [`kb/process/backlog/`](../../sample-project/kb/process/backlog/index.md) |

Static fields only: current milestone and open work are read from the handoff and backlog, so
this block never goes stale.

## Creating a project from it

The steps — copy, choose and reserve a prefix in the [prefix registry](index.md#prefix-registry),
rename, rewrite the `SCAFFOLD:` lines, register, validate, and the leftovers check — live in one
place: [`projects/CLAUDE.md`](../../CLAUDE.md), "Adding a new project".
