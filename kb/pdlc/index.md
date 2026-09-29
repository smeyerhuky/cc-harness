# PDLC — How Work Moves from Idea to Done

The project-management method every project in this repo follows, and the harness follows for
its own work: a four-stage pipeline, a markdown backlog of epics/stories/spikes/tickets, journals
written while the work happens, and a facilitator role that orchestrates the work — dispatching
work items and running review ceremonies. This section is
the **method**, written once and project-agnostic. The **instances** live where the work
happens: `projects/<name>/kb/process/` for a project, [`kb/process/`](../process/index.md) for
the harness itself.

* [Pipeline](pipeline.md) — the four stages (spec → plan → decomposition → checklists), where each
  one's files live, milestones and check-ins, loop-backs, and the "nothing skips a stage
  silently" rule.
* [Work Items](work-items.md) — epics, stories, spikes, and tickets: IDs, the frontmatter contract
  (`state`, `milestone`, typed edges), traceability, the five rules, and how an item closes.
* [Journals](journals.md) — the running journal every project keeps (one entry per session), spike
  journals for investigations, ceremony journals, the handoff, and the two-altitude rule.
* [Facilitator](facilitator.md) — the role the primary session plays when it orchestrates work:
  picking and dispatching work items and verifying what comes back; and running a review
  ceremony — lenses (not personas), briefing, rounds, fan-in and cross-checking, a decisions record
  without fabrication (transcripts optional), and the output boundary.
* [Ceremonies](ceremonies.md) — kickoff, alignment, triage, investigation: the question each
  answers, what triggers it, its rounds and outputs, and where those outputs live.
* [Coverage Audit](coverage-audit.md) — the sweep that finds design commitments nothing carries —
  no milestone, no work item, no code — and turns each into a work item.
* [Definition of Done](definition-of-done.md) — the three-tier checklist (every item, dependency
  changes, a milestone) each project specializes.
* [Templates](templates/index.md) — fill-in skeletons for the PDLC files.
* [Worked Example](worked-example.md) — one fictional harness change followed end to end: the
  roadmap entry, the work items, the next-item rule, gaps found while working, the journal entry,
  the handoff, and the milestone check-in.
