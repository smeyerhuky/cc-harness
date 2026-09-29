# Projects — Working Rules for Claude Sessions

This directory holds **all projects**. Each project is a self-contained container that carries
its own source, documentation, configuration, and metadata. This file governs how to work inside
`projects/`.

## Project anatomy

Every project under `projects/<project-name>/` has:

```
projects/<project-name>/
├── src/            # source code
├── kb/             # project-specific OKF knowledge base (detail)
│   ├── process/    # PDLC instances: handoff, roadmap, backlog/, journal/, definition of done
│   └── alignment/  # review ceremonies, one folder each (created at the first ceremony)
├── spikes/         # spike journals + throwaway code (created at the first spike)
├── CLAUDE.md       # governs THIS project (rules, conventions, kb navigation, PDLC prefix)
├── README.md       # human overview + quick start
└── version.json    # name, version, status, milestone, updated
```

Projects may add subdirectories as their type requires (e.g. `spec/`, `tools/`, `stl/` for a
3D-print project; `wrangler.jsonc` for a Worker).

## CLAUDE.md governance hierarchy

CLAUDE.md files exist at exactly these levels, each governing its directory and everything below:

| File | Governs |
|---|---|
| `/CLAUDE.md` | the whole repo |
| `/kb/CLAUDE.md` | the repo-wide knowledge base |
| `/projects/CLAUDE.md` | this directory (all projects) |
| `/projects/kb/CLAUDE.md` | the projects index/governance KB |
| `/projects/<project-name>/CLAUDE.md` | one specific project |

**Never create `<Name>-KB-CLAUDE.md` or any other renamed companion CLAUDE file.** A directory is
governed by the nearest `CLAUDE.md` above it. A KB bundle (`kb/`) does **not** get its own
separate `*-KB-CLAUDE.md`; its guidance lives in the governing `CLAUDE.md` at the level that owns
it.

## The three knowledge-base layers

| Location | Scope |
|---|---|
| `/kb/` | repo-wide knowledge — architecture, process, engineering references, lessons |
| `/projects/kb/` | high-level **index/governance** of all projects — one card per project, directory mapping |
| `/projects/<project-name>/kb/` | project-specific detail — design, findings, decisions, plan |

Put repo-general knowledge in `/kb/`; put project detail in that project's `kb/`; register every
project in `/projects/kb/`.

## The PDLC layer — every project plans and records work the same way

The method is written once in [`/kb/pdlc/`](../kb/pdlc/index.md) — pipeline, work items,
journals, facilitator, ceremonies, coverage audit, definition of done, templates, and a worked example. Each project
keeps its own instances under `kb/process/` and `kb/alignment/`, uses its own work-item prefix,
and says in its `CLAUDE.md` where each pipeline stage lives. The model to copy is
[`sample-project/CLAUDE.md`](sample-project/CLAUDE.md), section "PDLC".

## Build projects and document as you go

Documentation is **maintained incrementally as the project is built** — it is not produced by one
big wikify pass at the end. As work lands:

- Keep `version.json` current (status, milestone).
- End every working session that changed anything by
  [closing the session](../kb/pdlc/journals.md#closing-a-session) — the running journal holds the
  history, the handoff the current state.
- Update the project's `kb/` (findings, decisions, plan) in the same change that produces them.
- Keep the project `CLAUDE.md` and `README.md` accurate to the current state.
- Keep the project's card under `/projects/kb/projects/` accurate — its PDLC block holds only
  static fields (prefix, handoff and backlog links), so it changes only when those do.

## Adding a new project

`projects/sample-project/` is the scaffold every project is copied from. Every line a new project
must write itself is marked `SCAFFOLD:`; everything else is correct as copied once the names are
replaced.

1. `cp -r projects/sample-project projects/<name>` — the copy carries the OKF bundle
   (`kb/index.md` holds the only `okf_version`) and every PDLC file, including the first work item
   and the first journal entry.
2. **Choose a work-item prefix** — two to four uppercase letters, not already in the prefix
   registry in `projects/kb/projects/index.md`. Replace `SMP` with it throughout the copy's
   contents, and rename `kb/process/backlog/SMP-TICKET-001.md` to `<PREFIX>-TICKET-001.md`.
3. Replace `sample-project` and `Sample Project` with the project's name throughout the copy.
   Then rewrite every `SCAFFOLD:` line, which are in exactly these files: `CLAUDE.md`,
   `README.md`, `version.json` (also set `status`: `planning` until the first build milestone),
   `kb/index.md`, `kb/overview/about.md`, `kb/process/handoff.md`, and the first journal entry,
   `kb/process/journal/2026-09-29-project-created.md` — **this session's own entry**: rename it to
   today's date (file name, title, `timestamp`) and update the four links to it (the journal
   index, the handoff, and the first work item's `resource:` and `DERIVED_FROM`).
4. Check the copied `kb/process/roadmap.md` and handoff describe where the project actually starts
   (M0 active; next item `<PREFIX>-TICKET-001`, write the spec) — adjust if it starts elsewhere.
5. Register the project: add a card at `projects/kb/projects/<name>.md`, link it from
   `projects/kb/projects/index.md`, and **reserve the prefix** in that file's prefix registry.
6. Add the project to the tree in `/CLAUDE.md` and `/README.md`.
7. Validate: the project [gates](../kb/pdlc/definition-of-done.md#gates) on
   `projects/<name>/kb/` and on `projects/kb/` — all clean — and **the leftovers check** prints
   nothing:

   ```
   grep -rniE 'sample|smp|scaffold' projects/<name>/; find projects/<name>/ -iname '*smp*'
   ```

**What the scaffold ships, and what it doesn't.** It ships only what a fresh session must find:
`CLAUDE.md`, `README.md`, `version.json`, the KB entry and overview, and the process files — the
handoff, the roadmap, the backlog with its first item, the running journal with its first entry,
and the definition of done. Everything that exists only once something happens is created then:
`kb/product/` (the spec), `kb/design/`, `kb/alignment/` (at the first ceremony), `spikes/` (at the
first spike), and `kb/process/coverage-audit.md` (at the first sweep).

## The first session in a new project

- **It is the session that creates the project**, and its running-journal entry is the copied
  first entry, renamed and filled. Record what the owner asked for in their own words — the early
  work items trace to it.
- **The first item is the shipped `<PREFIX>-TICKET-001`, write the spec** — a TICKET, not a STORY:
  a story quotes its acceptance criteria from the spec, and the spec doesn't exist yet. Stories
  come once it does. An epic is optional until the plan has more than one milestone of work.
- **Gaps in the method go to the harness backlog.** A template that doesn't fit, a rule that's
  wrong, a step here that misled you: mint a `CCH` item in `/kb/process/backlog/`, tracing to this
  project's journal entry. A gap in the project itself goes to the project's own backlog.
- **The card is static.** Its PDLC block (prefix, handoff and backlog links) doesn't change as
  items are minted or closed.

## Shared code

Use `projects/common/` for utilities shared across projects.

## Related

- Repo governance: [`/CLAUDE.md`](../CLAUDE.md)
- Projects index KB: [`projects/kb/index.md`](kb/index.md)
- Repo-wide KB: [`/kb/index.md`](../kb/index.md)
