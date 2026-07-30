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
├── CLAUDE.md       # governs THIS project (rules, conventions, kb navigation)
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

## Build projects and document as you go

Documentation is **maintained incrementally as the project is built** — it is not produced by one
big wikify pass at the end. As work lands:

- Keep `version.json` current (status, milestone).
- Update the project's `kb/` (findings, decisions, plan) in the same change that produces them.
- Keep the project `CLAUDE.md` and `README.md` accurate to the current state.
- Keep the project's card under `/projects/kb/projects/` in sync.

## Adding a new project

1. `mkdir -p projects/<name>/{src,kb}` and add `CLAUDE.md`, `README.md`, `version.json`.
2. Write `projects/<name>/CLAUDE.md` governing the project.
3. Start the project `kb/` as an OKF bundle (`kb/index.md` carries the only `okf_version`).
4. Register the project: add a card at `projects/kb/projects/<name>.md` and link it from
   `projects/kb/projects/index.md`.
5. Add the project to the tree in `/CLAUDE.md` and `/README.md`.

## Shared code

Use `projects/common/` for utilities shared across projects.

## Related

- Repo governance: [`/CLAUDE.md`](../CLAUDE.md)
- Projects index KB: [`projects/kb/index.md`](kb/index.md)
- Repo-wide KB: [`/kb/index.md`](../kb/index.md)
