# Sample Project — Working Rules for Claude Sessions

Governs the `sample-project`. This is the **template** project: a reference implementation of the
standard playground project structure. Copy it when starting a new project.

## Structure

```
src/            source code
kb/             project-specific OKF knowledge base — see navigation below
CLAUDE.md       this file (governs the project)
README.md       overview and setup
version.json    project metadata
```

## Knowledge base navigation

Start at [`kb/index.md`](kb/index.md):

- **[overview/](kb/overview/index.md)** — what this template project is and how to use it
- **[structure/](kb/structure/index.md)** — directory layout and how to organize a new project

## Conventions

- **OKF hygiene:** `okf_version` only in `kb/index.md`; subdirectory `index.md` files are pure
  tables of contents; every content file has `type/title/description/resource/tags/timestamp`
  frontmatter. Lint with
  `python3 .claude/skills/okf-wikify/scripts/lint_okf.py projects/sample-project/kb/`.
- **Document as you go.** Keep `kb/`, `README.md`, and `version.json` current as a project evolves.

## Using this as a template

1. Copy `projects/sample-project/` to `projects/<your-project>/`.
2. Rewrite `CLAUDE.md`, `README.md`, `version.json`, and the `kb/` for your project.
3. Register the project under `projects/kb/projects/` and in the root `CLAUDE.md`/`README.md`.

See [`/projects/CLAUDE.md`](../CLAUDE.md) for the full project rules and CLAUDE.md hierarchy.

## Related

- Project template reference: [`/kb/architecture/project-template.md`](../../kb/architecture/project-template.md)
- Projects index KB: [`/projects/kb/index.md`](../kb/index.md)
