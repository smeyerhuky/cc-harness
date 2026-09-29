# Hello Worker — Working Rules for Claude Sessions

Governs `projects/hello-worker/`.

A minimal Cloudflare Worker — one `fetch` handler that returns a one-line greeting — and the
worked example the repo's deploy KB was written from. It is for anyone deploying a first Worker
from this repo, and it is the known-good fixture for checking the deploy recipes still work. It
deliberately has no bindings, routes, secrets, or build step.

## Structure

```
src/            source code (`index.js`: the Worker's `fetch` handler)
wrangler.jsonc  the Worker's configuration — name, entry point, compatibility date
.gitignore      keeps `wrangler dev`'s `.wrangler/` cache out of git
kb/             project-specific OKF knowledge base — see navigation below
  overview/     what the project is, for whom, what is out of scope
  process/      handoff, roadmap, backlog/, journal/, definition of done  (the PDLC instances)
  product/      the spec — created when it is written
  design/       architecture, contracts, technology choices — created when first sketched
  alignment/    review ceremonies, one folder each — created at the first ceremony
spikes/         spike journals + throwaway code — created at the first spike
CLAUDE.md       this file (governs the project)
README.md       overview and setup
version.json    project metadata (status, current milestone, updated)
```

## Knowledge base navigation

Start at [`kb/index.md`](kb/index.md):

- **[overview/](kb/overview/index.md)** — what the project is, for whom, and what is out of scope
- **[process/](kb/process/index.md)** — handoff, roadmap, backlog, running journal, definition of done

## PDLC — how work is planned and recorded here

This project follows the repo's PDLC layer — the method lives in [`/kb/pdlc/`](../../kb/pdlc/index.md);
the files below are this project's instances of it.

**Work-item prefix: `HW`** — items are `HW-<KIND>-<NNN>`, registered in
[`/projects/kb/projects/index.md`](../kb/projects/index.md).

| Pipeline stage | Lives here |
|---|---|
| Spec (what, for whom, out of scope, acceptance criteria) | The repo's deploy KB, which this project is the worked example for: [`/kb/platforms/cloudflare-workers-minimal.md`](../../kb/platforms/cloudflare-workers-minimal.md) and [`/kb/concepts/deploy-lifecycle.md`](../../kb/concepts/deploy-lifecycle.md); `kb/product/` if the project ever outgrows them |
| Design (architecture, contracts, technology choices) | None beyond the two files above; `kb/design/` if that changes |
| Roadmap (milestones, todos, exit criteria) | [`kb/process/roadmap.md`](kb/process/roadmap.md) |
| Backlog (epics, stories, spikes, tickets) | [`kb/process/backlog/`](kb/process/backlog/index.md) |
| Running journal (one entry per working session) | [`kb/process/journal/`](kb/process/journal/index.md) |
| Handoff (where things stand now) | [`kb/process/handoff.md`](kb/process/handoff.md) |
| Definition of done | [`kb/process/definition-of-done.md`](kb/process/definition-of-done.md) |
| Review ceremonies | `kb/alignment/` — created at the first ceremony |
| Spike journals | `spikes/<slug>/JOURNAL.md` — created at the first spike |
| Coverage-audit sweeps | `kb/process/coverage-audit.md` — created at the first sweep |

**Starting a session:** read the [handoff](kb/process/handoff.md), then the
[roadmap](kb/process/roadmap.md), then the next work item's *AI PDLC Prompt*
([which one](../../kb/pdlc/work-items.md#which-item-is-next)).
**Ending one that changed anything:** follow
[closing a session](../../kb/pdlc/journals.md#closing-a-session). **At a milestone exit:** apply
the milestone tier of the [definition of done](kb/process/definition-of-done.md) (which extends
the repo's), ending with the owner check-in. **Found a gap in the method itself** (not in this
project)? It goes to the harness backlog — see
[the first session in a new project](../CLAUDE.md#the-first-session-in-a-new-project).

## Conventions

- **OKF hygiene:** `okf_version` only in `kb/index.md`; subdirectory `index.md` files are pure
  tables of contents; every content file has `type/title/description/resource/tags/timestamp`
  frontmatter. Validate `projects/hello-worker/kb/` with the project
  [gates](../../kb/pdlc/definition-of-done.md#gates).
- **Document as you go.** Keep `kb/`, `README.md`, and `version.json` current as the project
  evolves.
- **Before any deploy:** read [`/kb/lessons/`](../../kb/lessons/index.md) and verify locally first
  ([local verify](../../kb/platforms/cloudflare-local-verify.md)); the deploy protocol is in the
  root [`CLAUDE.md`](../../CLAUDE.md).

## Related

- Rules for every project, including how this one was created: [`/projects/CLAUDE.md`](../CLAUDE.md)
- Projects index KB: [`/projects/kb/index.md`](../kb/index.md)
