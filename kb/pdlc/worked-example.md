---
type: "Playbook"
title: "Worked Example — One Harness Change, End to End"
description: "A fictional walk-through of one change to the harness, adding a Vercel deploy recipe, from the owner's request to the milestone check-in: the roadmap entry, the work items, the next-item rule, gaps found while working, the running-journal entry, the rewritten handoff, and the gates."
resource: "index.md"
tags: ["workflow", "backlog", "journal", "handoff"]
timestamp: "2026-09-29"
---

# Worked Example — One Harness Change, End to End

> **Fictional.** Nothing below exists in this repo: the dates, IDs, commits, and files are
> illustrative. It shows the method in [`kb/pdlc/`](index.md) applied once, so a session in a
> fresh clone can see what each file looks like once it is filled in.

The harness's own records start blank: its [handoff](../process/handoff.md),
[roadmap](../process/roadmap.md), [backlog](../process/backlog/index.md), and
[running journal](../process/journal/index.md). This page shows them after one small change. A
project works the same way under `projects/<name>/kb/process/`, with its own prefix: the
[sample project](../../projects/sample-project/kb/process/handoff.md) is the blank starting point,
and [Hello Worker](../../projects/hello-worker/kb/process/handoff.md) is a finished one.

**How to read the examples.** Each record sits inside a fenced block, so no validator mistakes it
for a real one. In a real file, a work-item ID in a roadmap checkbox or a backlog-index line is a
relative link to the item's file — the backlog check follows those links. Here the IDs are shown
as `code` instead; the sample project's [roadmap](../../projects/sample-project/kb/process/roadmap.md)
and [backlog index](../../projects/sample-project/kb/process/backlog/index.md) show the link form.

## The request

The owner asks: *"Add a deploy recipe for Vercel, like the Cloudflare ones."*

## 1. Start cold

The session reads the harness handoff first. It says no harness work is in progress. The
[gates](definition-of-done.md#gates) run and exit 0. Nothing is `active`, so this is new work,
and it starts at stage 1 of the [pipeline](pipeline.md).

## 2. Spec and plan (stages 1–2)

- **Spec.** For the harness, stage 1 is the `CLAUDE.md` chain and the relevant `kb/` section. The
  root `CLAUDE.md` already says what a new platform needs: three files in `kb/platforms/`, in the
  *minimal / credentials / local-verify* shape of the Cloudflare set, linked from the platforms
  index. One thing is not settled — should the minimal recipe deploy a static site or a
  serverless function? — so the session asks. The owner says a static site. The answer goes into
  the work item's acceptance criteria and the journal's decisions table, not only into chat
  ([spec-driven development](../ai-sdlc/spec-driven-development.md)).
- **High-level plan.** No architecture change; `kb/architecture/` stays as it is.
- **Low-level plan.** One milestone in the roadmap:

````markdown
## Milestones at a glance

| Milestone | Goal | State |
|---|---|---|
| **M0** — Vercel deploy recipes | A session can deploy a minimal Vercel site from the KB alone | active |

## M0 — Vercel deploy recipes

- [ ] Minimal deploy recipe — `CCH-TICKET-001`
- [ ] Credentials recipe — `CCH-TICKET-002`
- [ ] Local-verify recipe — `CCH-TICKET-003`

**Exit:** the three recipes exist, each written from commands actually run, and are linked from
`kb/platforms/index.md`; the harness gates pass. → **Owner check-in.**
````

## 3. Decompose (stage 3)

Each todo becomes a ticket before its work starts. Every item needs a source
([traceability](work-items.md#traceability)); here it is the owner's request, which the session's
running-journal entry records, so the entry is started now and the items are `DERIVED_FROM` it.
Order goes in the edges, not in prose: the minimal recipe deploys with a token, so it
`DEPENDS_ON` the credentials recipe; the local-verify recipe checks the minimal site, so it
depends on that one.

The first ticket, filled in from the [work-item template](templates/work-item.md):

````markdown
---
type: "Work Item"
title: "CCH-TICKET-001: Minimal Vercel deploy recipe"
description: "Add kb/platforms/vercel-minimal.md: the smallest static site that deploys to Vercel, with the exact commands run and the output that shows success."
resource: "The owner's request, recorded in the 2026-10-05 running-journal entry"
tags: ["backlog", "deploy"]
timestamp: "2026-10-05"
state: "open"
milestone: "M0"
relationships:
  - type: DEPENDS_ON
    target: CCH-TICKET-002.md
  - type: DERIVED_FROM
    target: ../journal/2026-10-05-vercel-recipes.md
---

# CCH-TICKET-001: Minimal Vercel deploy recipe

## Description

The owner asked for Vercel deploy recipes alongside the Cloudflare set. This is the first of the
three files the root CLAUDE.md asks for when a platform is added: the smallest site that deploys.
The owner chose a static site over a serverless function.

## Acceptance Criteria

- `kb/platforms/vercel-minimal.md` exists in the shape of `cloudflare-workers-minimal.md`: the
  files, the exact deploy command, and the output that shows success — every step run, none
  recalled.
- It deploys a static site.
- It is linked from `kb/platforms/index.md`.
- The harness gates pass.

## Linked Artifacts

- `kb/platforms/cloudflare-workers-minimal.md` — the shape to follow
- Root `CLAUDE.md`, "When adding new material"

## AI PDLC Prompt

Goal: write kb/platforms/vercel-minimal.md. Read the root CLAUDE.md ("When adding new
material"), kb/platforms/cloudflare-workers-minimal.md (the shape), kb/platforms/vercel-credentials.md
(the token setup this recipe uses), and kb/concepts/deploy-lifecycle.md. In a scratch directory,
deploy a one-page static site with the Vercel CLI and record the exact commands and their output;
write no step you have not run. Link the file from kb/platforms/index.md. Done when the harness
gates pass, this item is `done` with a Resolution, the backlog index and the roadmap agree, and
the session's running-journal entry records it.
````

The backlog index after minting. The next-free-ID table moves in the same change:

````markdown
## Next free ID per kind

| Kind | Next number |
|---|---|
| `CCH-EPIC` | 001 |
| `CCH-STORY` | 001 |
| `CCH-SPIKE` | 001 |
| `CCH-TICKET` | 004 |

## Items

*M0 — Vercel deploy recipes:*

- `CCH-TICKET-001` — Minimal Vercel deploy recipe · open
- `CCH-TICKET-002` — Vercel credentials recipe · open
- `CCH-TICKET-003` — Vercel local-verify recipe · open
````

There is no epic: three tickets in one milestone don't need one. An epic earns its place when a
body of work spans milestones, or needs acceptance criteria that hold across its parts.

## 4. Pick the next item

[The rule](work-items.md#which-item-is-next): nothing is `active`, so take the first `open` item
in the current milestone, in index order, whose `DEPENDS_ON` targets are all `done`.
`CCH-TICKET-001` waits on `-002`, so it is skipped; **`CCH-TICKET-002` is next**.
`relationships.py kb/ --deps` agrees: it lists the items in dependency order, with `-002` the
only one ready. A prose note in the roadmap ("do the credentials first") would have been
invisible to the rule; the edge is what makes the order hold for any session.

The session sets `-002` to `active`, in the item and on its index line, and works it inline. It
is small, and the other two items wait on it, so nothing can run beside it
([orchestrating ordinary work](facilitator.md#orchestrating-ordinary-work)).

## 5. Found while working

Two gaps turn up, one on each side of the
[threshold](work-items.md#found-while-working):

- **Fixed inside the open item.** Adding the credentials recipe to `kb/platforms/index.md`, the
  session notices the index's intro still says "Cloudflare Workers so far". The item already
  changes that file, and its own change makes the sentence false, so it is fixed in place and
  recorded in `-002`'s Resolution and the journal's *Surprises*. No new item.
- **A new item.** Vercel is a new topic area, and `kb/CLAUDE.md` says to extend the retrieval
  eval set when one is added. The eval set is outside `-002`'s files and feeds a gate other work
  relies on, so it gets its own item **before** anything is changed: `CCH-TICKET-004`,
  `DERIVED_FROM` the journal entry that records how it was found, `DEPENDS_ON` `-001` (its gold
  files must exist first), milestone `M0`. The next-free-ID table moves to 005 in the same
  change, and the handoff is rewritten, because the milestone's remaining work changed.

## 6. Close the item

The item's `state` becomes `done` and it gains a Resolution; the roadmap checkbox is ticked and
the index line says `done`, all in the same commit
([an item's life](work-items.md#an-items-life)). The commit message names the ID
([commit etiquette](../process/commit-etiquette.md)).

````markdown
## Resolution

Done 2026-10-05 in `3f9c2e1`. `kb/platforms/vercel-credentials.md` covers creating a scoped
token, giving it to the CLI, and checking it without deploying; each command was run in this
session, with its output pasted. Also fixed in place: the platforms index's intro no longer
says "Cloudflare Workers so far" (this item's own change made it false). Found and minted
instead: `CCH-TICKET-004`, a retrieval-eval question for the new topic.
````

## 7. Close the session

[Closing a session](journals.md#closing-a-session): the items updated, the roadmap and index
current, the journal entry written and indexed, the handoff checked, the gates run, then commit
and push. The running-journal entry, from the [template](templates/running-journal-entry.md):

````markdown
---
type: "Journal"
title: "2026-10-05 — Vercel deploy recipes: credentials"
description: "The owner asked for Vercel deploy recipes; M0 planned and minted, the credentials recipe written, and one found item minted."
resource: "Working session 2026-10-05 on branch <the session's branch>"
tags: ["journal", "deploy"]
timestamp: "2026-10-05"
---

# 2026-10-05 — Vercel deploy recipes: credentials

**Epic:** none · **Milestone:** M0 — active · **Branch:** `<the session's branch>`

## What happened

1. The owner asked for Vercel deploy recipes like the Cloudflare set.
2. M0 added to the roadmap; `CCH-TICKET-001`–`-003` minted, ordered by `DEPENDS_ON`.
3. `CCH-TICKET-002` (credentials) picked by the next-item rule and closed.
4. `CCH-TICKET-004` minted, found while working.

## Decisions with the owner

| Question | Answer |
|---|---|
| Static site or serverless function for the minimal recipe? | A static site |

## What landed

| Commit | Work item | What |
|---|---|---|
| `8a41d07` | — | M0 planned; `CCH-TICKET-001`–`-003` minted |
| `c52b9aa` | CCH-TICKET-004 | minted: a retrieval-eval question for Vercel |
| `3f9c2e1` | CCH-TICKET-002 | the credentials recipe |

## Surprises and what they changed

- The platforms index still said "Cloudflare Workers so far"; fixed inside `-002`, whose change
  made it false.
- No eval question covers the new topic; minted `CCH-TICKET-004` rather than widening `-002`.

## Verification

```
<the gate output, pasted — not paraphrased>
```

## Next

`CCH-TICKET-001`, the minimal recipe; its one dependency is done.
````

And the handoff, rewritten in the same commits as the changes it describes
([keeping the handoff current](journals.md#keeping-the-handoff-current)):

````markdown
## Snapshot

- **Milestone:** M0 — Vercel deploy recipes — active (roadmap.md). No epic.
- **Landed:** `CCH-TICKET-002`, the credentials recipe; `CCH-TICKET-004` minted, found while
  working (journal entry 2026-10-05).
- **Gates:** clean on kb/ and on every project bundle.

## Immediate next step

`CCH-TICKET-001` — the minimal deploy recipe (a static site). Its one dependency, `-002`, is done.
````

## 8. The next session

It starts cold, like the first: the handoff names `CCH-TICKET-001`, and that item's AI PDLC
Prompt is enough on its own. Once `-001` is done, `-003` and `-004` both become ready, and they
touch different files (`kb/platforms/` and the eval set). The facilitator may do one inline and
dispatch the other to a subagent, with its AI PDLC Prompt as the brief. It then checks what comes
back against the acceptance criteria and runs the gates itself before writing the Resolution
([orchestrating ordinary work](facilitator.md#orchestrating-ordinary-work)).

## 9. The milestone's exit

When M0's last item closes, the milestone tier of the
[definition of done](definition-of-done.md) applies:

- The exit criterion is met in full.
- The [coverage audit](coverage-audit.md) sweeps what M0 committed to (three recipes, the index
  link, the eval question) against the items and files; any gap becomes a work item.
- The handoff, a journal entry, and the roadmap's milestone table (M0 → `done`) are current.
- The next milestone is minted, or the check-in says none is planned.
- The owner check-in, in [its shape](pipeline.md#owner-check-ins) — decisions first, each with
  its default and what saying no would cost:

````text
M0 — Vercel deploy recipes — is at its exit.

Decisions
1. Add `vercel` to the tag vocabulary? Default: yes — the three recipes use it.
   If no: it stays an unregistered tag that the authority report keeps listing.
2. Next milestone: none planned. Default: stop here. Preview deployments
   would be a new milestone.

Landed: CCH-TICKET-001–004, all done; -004 was found while working.
Audit: M0's commitments swept; no gaps.
````

## How the change meets the library-science overlay

The work items and journal entries are records like any other in the KB, so the
[library-science overlay](../library-science/index.md) checks them too:

- **Types and tags** come from the [controlled vocabulary](../authority/vocabulary.yaml): `Work
  Item` and `Journal` are registered types, and each tag is an authorized descriptor. A new term
  such as `vercel` is used once, then added to the vocabulary when it recurs — the check-in's
  first decision.
- **Typed edges** (`DERIVED_FROM`, `DEPENDS_ON`) are what `relationships.py` validates (no
  missing targets, no cycles) and what `--deps` and the next-item rule read.
- **Provenance:** every record's `resource:` names its source; the items trace to the journal
  entry that recorded the request.
- **Retrieval:** a new topic area gets an eval question (`CCH-TICKET-004`), so the retrieval gate
  covers it.
- **Weeding:** if a recipe is later replaced, the old file is superseded, not deleted
  ([weeding policy](../library-science/weeding-policy.md)).

## When a change needs a spike or a review

- **An unknown blocks the plan** — say, whether the Vercel CLI can reach its API under this
  sandbox's network policy. That is a spike (`CCH-SPIKE-001`) with its investigation in
  `spikes/<slug>/JOURNAL.md`, created at the first spike, and a concrete Proposed Resolution
  ([spike-journal template](templates/spike-journal.md)).
- **The owner wants the recipes reviewed** before anyone relies on them. That is a ceremony under
  `kb/alignment/<slug>/` ([ceremonies](ceremonies.md), [facilitator](facilitator.md)). Each raw
  review is saved verbatim inside a thin wrapper, like this:

````markdown
---
type: "Reference"
title: "Raw Output — Accuracy Lens"
description: "The accuracy lens was asked whether every command in the three Vercel recipes runs as written."
resource: "../facilitators-journal.md"
tags: ["ceremony", "facilitation"]
timestamp: "2026-10-07"
---

> Raw reviewer output, saved verbatim by the facilitator on arrival. Not edited; not yet cross-checked.

<the reviewer's output, exactly as returned>
````

## Related

- [Pipeline](pipeline.md), [work items](work-items.md), [journals](journals.md) — the rules this
  example follows.
- [Templates](templates/index.md) — the skeletons the example records were filled in from.
- [Definition of done](definition-of-done.md) — the per-item and per-milestone checklists, and the
  gates.
