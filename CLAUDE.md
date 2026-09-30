# cc-harness

A template repository for multi-project development: clone it, then build your projects in it.

## Directory Structure

- **CLAUDE.md** - Root-level Claude configuration (this file)
- **kb/CLAUDE.md** - Governs the repo-wide knowledge base
- **projects/CLAUDE.md** - Governs the `projects/` directory (all projects)
- **projects/kb/CLAUDE.md** - Governs the projects index/governance KB
- **projects/<name>/CLAUDE.md** - Governs a specific project
- **README.md** - Repository overview
- **LICENSE** - Project license

- **.claude/** - Claude skill definitions
  - `skills/okf-wikify/` - OKF deep-wiki skill
  - `skills/scad-design-to-print/` - SCAD Design to Print skill



- **config/** - Root-level configuration files

- **kb/** - Repository-wide knowledge base (OKF bundle)
  - `pdlc/` - The PDLC method: pipeline, work items, journals, facilitator, ceremonies, coverage audit, definition of done, templates, a worked example
  - `process/` - Git/PR/commit discipline, plus the harness's own roadmap, backlog (`CCH-*`), running journal, and handoff — start at `process/handoff.md`
  - `alignment/` - The harness's review ceremonies, one folder each (created at the first ceremony)
  - `ai-sdlc/` - AI-native development principles and the phases the PDLC method implements
  - `library-science/` - The KB's library-science overlay: authority control, typed relationships, retrieval eval, weeding
  - `authority/` - The controlled vocabulary (`vocabulary.yaml`): types, tags, relationship types, work-item states
  - `architecture/` - Directory structure and KB organization docs
  - `additive-engineering/` - Additive Engineering concepts, and rulebooks
  - `concepts/` - Abstract concepts (deploy lifecycle, progressive disclosure, etc.)
  - `development/` - Shared-code guidance (its old workflow page is superseded by `pdlc/`)
  - `getting-started/` - Orientation and quick-start docs
  - `lessons/` - Lessons learned from real deploys
  - `platforms/` - Per-platform deploy recipes (Cloudflare Workers, etc.)
  - `index.md` - KB entry point

- **spikes/** - Repo-level spike journals (`spikes/<slug>/JOURNAL.md`) for time-boxed investigations of harness work (created at the first spike)

- **projects/** - All project containers — each with its own `kb/process/` (handoff, roadmap, backlog, running journal, definition of done) and, once it runs one, `kb/alignment/`
  - `common/` - Shared utilities and code used across projects
  - `garbage-day/` - A two-player, real-time falling-block versus game on Cloudflare Durable Objects (planning); prefix `GD`
  - `hello-worker/` - A minimal Cloudflare Worker (`src/`, `wrangler.jsonc`) — the deploy recipes' worked example; prefix `HW`
  - `sample-project/` - The scaffold every new project is copied from ([`projects/CLAUDE.md`](projects/CLAUDE.md), "Adding a new project")
  - `kb/` - Projects directory KB index

## Getting Started

This is a template: clone it, then start your first project by following [`projects/CLAUDE.md`](projects/CLAUDE.md), "Adding a new project". Work on the harness itself starts at [`kb/process/handoff.md`](kb/process/handoff.md).

## Documentation & CLAUDE.md governance

The repo works by **building out projects and updating their documentation as it goes** — docs are
maintained incrementally alongside the work, never as a single end-of-project dump.

**CLAUDE.md files** live at exactly these levels, each governing its directory and everything below:

| File | Governs |
|---|---|
| `/CLAUDE.md` | the whole repo |
| `/kb/CLAUDE.md` | the repo-wide knowledge base |
| `/projects/CLAUDE.md` | the `projects/` directory (all projects) |
| `/projects/kb/CLAUDE.md` | the projects index/governance KB |
| `/projects/<project-name>/CLAUDE.md` | one specific project |

A directory is governed by the nearest `CLAUDE.md` above it. **Never create
`<Name>-KB-CLAUDE.md` or any other renamed companion CLAUDE file** — a `kb/` bundle does not get
its own separate CLAUDE file; its guidance belongs in the governing `CLAUDE.md`.

**Knowledge-base layers** (three, distinct scopes):

| Location | Scope |
|---|---|
| `/kb/` | repo-wide knowledge (architecture, process, engineering references, lessons) |
| `/projects/kb/` | high-level index/governance of all projects (one card per project) |
| `/projects/<project-name>/kb/` | project-specific detail (design, findings, decisions, plan) |

See [`/projects/CLAUDE.md`](projects/CLAUDE.md) for the full project workflow.

## Development

Work on features and experiments within the project directories, following the structure outlined above,
and plan and record that work by the PDLC protocol below.

## PDLC protocol — how work is planned and recorded

Every project here, and the harness itself, plans and records work the same way — a spec, a
roadmap of milestones, a backlog of work items, a running journal, and a handoff that says where
things stand. The method is written once, in [`kb/pdlc/`](kb/pdlc/index.md); each rule lives in
one file, linked below.

- **Resuming work:** read the handoff first — a project's `projects/<name>/kb/process/handoff.md`,
  or the harness's [`kb/process/handoff.md`](kb/process/handoff.md) — then take the next work item
  by [the rule](kb/pdlc/work-items.md#which-item-is-next).
- **Every change traces to a work item** ([work items](kb/pdlc/work-items.md)); something found on
  the way is handled by [found while working](kb/pdlc/work-items.md#found-while-working).
- **Starting a project:** [`projects/CLAUDE.md`](projects/CLAUDE.md), "Adding a new project".
- **Before committing:** the [gates](kb/pdlc/definition-of-done.md#gates).
- **Ending a session that changed anything:** [closing a session](kb/pdlc/journals.md#closing-a-session).
- **At a milestone's exit:** the milestone tier of the
  [definition of done](kb/pdlc/definition-of-done.md), ending with an
  [owner check-in](kb/pdlc/pipeline.md#owner-check-ins).
- **Splitting work across subagents, or running a review:** the [facilitator](kb/pdlc/facilitator.md).

## Knowledge base — deploy protocol

Before deploying anything from this repo — Cloudflare Worker, Vercel site, Fly app, whatever — consult the deploy KB in `kb/`. It's an [OKF](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) bundle organized for progressive disclosure: load only the two or three files that answer your current question.

- **Start here**: [`kb/index.md`](kb/index.md) — one-paragraph orientation plus TOC.
- **Abstract lifecycle**: [`kb/concepts/deploy-lifecycle.md`](kb/concepts/deploy-lifecycle.md) — the six-stage flow every deploy follows.
- **Git protocol for this repo**: [`kb/process/`](kb/process/index.md) — designated branches, commit format, push/retry, PR discipline, merged-PR follow-ups.
- **Per-platform recipes**: [`kb/platforms/`](kb/platforms/index.md) — start with the file that matches your target (Cloudflare Workers so far).
- **Gotchas from real deploys**: [`kb/lessons/`](kb/lessons/index.md) — read the relevant one *before* you hit the wall.

### Conventions for the deploy KB

- Frontmatter fields: `type`, `title`, `description`, `resource`, `tags`, `timestamp`. Types in use: `Concept`, `Policy`, `Playbook`, `Reference`, `Lesson`.
- `okf_version: "0.1"` appears **only** in `kb/index.md` — nowhere else in `kb/`.
- Subdirectory `index.md` files have no frontmatter — they're pure tables of contents.
- Cross-link liberally with relative markdown links; cite file paths (`kb/lessons/wrangler-cache-pollution.md`) when answering deploy questions so claims stay verifiable.
- After changes, run the KB [gates](kb/pdlc/definition-of-done.md#gates) on `kb/` — all must pass; `lint_okf` reports no warnings.

### When adding new material

- **New platform** (e.g. adding Vercel): create `kb/platforms/vercel-*.md` files following the "minimal / credentials / local-verify" shape used by the Cloudflare set, and link them from `kb/platforms/index.md`.
- **New lesson** (something bit you): add a `kb/lessons/<slug>.md` with the concrete session context (dates, error codes, exact commands), then link from `kb/lessons/index.md` and cross-link to any relevant concept file.
- **New abstract concept**: add to `kb/concepts/` and cross-link from `deploy-lifecycle.md`.

Don't expand existing files past their single-concept scope; prefer a new file plus a cross-link.
