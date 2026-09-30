---
type: "Work Item"
title: "GD-TICKET-001: Write the spec"
description: "Write Garbage Day's spec with the owner — what it is, for whom, what is out of scope, and user stories with acceptance criteria — so the design and the first build milestone can be planned from it."
resource: "../journal/2026-09-30-project-created.md"
tags: ["backlog", "workflow"]
timestamp: "2026-09-30"
state: "done"
milestone: "M0"
relationships:
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-project-created.md
---

# GD-TICKET-001: Write the spec

## Description

Every project's first work item. The project exists, but nothing yet says what it must do. It is
a TICKET, not a STORY: a story quotes its acceptance criteria from the spec, and there is no spec
yet. It traces to the running-journal entry of the session that created the project, which
records what the owner asked for.

## Acceptance Criteria

- `kb/product/` holds the spec, written with the owner: what the project is, for whom, what is out
  of scope, and user stories, each with acceptance criteria the owner has agreed to.
- Questions raised while writing it are answered in the spec file, not left in chat.
- `kb/product/` is linked from `kb/index.md`, and the spec row of the PDLC table in the project's
  `CLAUDE.md` points at it.
- The project gates pass on this bundle.

## Linked Artifacts

- [Pipeline — stage 1, spec](../../../../../kb/pdlc/pipeline.md)
- [Roadmap — M0](../roadmap.md)
- [The journal entry this traces to](../journal/2026-09-30-project-created.md)

## AI PDLC Prompt

Goal: write this project's spec with the owner. Read the project's `CLAUDE.md`, the
running-journal entry this item derives from (what the owner asked for, in their words), and
`/kb/pdlc/pipeline.md` (stage 1, and the check-in shape). Ask the owner what is not yet clear —
lead with the questions, each with the answer you would assume. Write `kb/product/index.md` (a
pure table of contents) and a spec file with OKF frontmatter: what the project is, for whom, what
is out of scope, and user stories with acceptance criteria. Link it from `kb/index.md` and the
PDLC table in `CLAUDE.md`. Do not start the design here — that is the next M0 todo. Done when the
acceptance criteria hold, the project gates pass
(`/kb/pdlc/definition-of-done.md`, "Gates"), this item is `done` with a Resolution, the backlog
index and roadmap agree, and the session's running-journal entry records it.

## Resolution

Done in the spec session (see [its journal entry](../journal/2026-09-30-spec.md)). `kb/product/`
holds the spec: [the PRD](../../product/prd.md) (what it is, for whom, goals, match settings,
user stories US-01 to US-20 with acceptance criteria, non-functional requirements, out of scope,
open questions with assumed answers), and the three files its criteria cite:
[game rules](../../product/game-rules.md), [pause and presence rules](../../product/pause-and-presence.md)
and [controls and layout](../../product/controls-and-layout.md). Linked from `kb/index.md` and
the PDLC table in `CLAUDE.md`.

Deviation from the criteria: the owner agreed to the decisions and defaults the stories are
built from ("go, accept everything", plus four notes, all written in), but has not yet read the
stories' detailed wording. It goes to the owner at this session's check-in; any change is a spec
edit, not a new item. The design the owner also asked for (architecture, UI language, stack and
CI) was deliberately not started here and is minted as GD-TICKET-002 to 004.
