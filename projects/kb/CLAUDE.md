# Projects Index KB — Working Rules for Claude Sessions

Governs `projects/kb/`, the **high-level index / governance KB of all projects** — one card per
project plus directory mapping. It is a navigation and governance layer, not project detail
(project detail lives in each `projects/<project-name>/kb/`).

For rules on working inside `projects/` generally, see [`/projects/CLAUDE.md`](../CLAUDE.md).

## What's here

- `index.md` — entry point (this bundle does **not** carry `okf_version`; only project `kb/`
  bundles do).
- `projects/index.md` — table of contents listing every project card.
- `projects/<name>.md` — one reference card per project (what it is, status, how to get started,
  links into that project's KB).

## Registering / updating a project card

When a project is created or changes materially:

1. Add or update `projects/kb/projects/<name>.md` (a card, following an existing one's shape).
2. Ensure it is linked from `projects/kb/projects/index.md`.
3. Keep the card's status/description in sync with the project's `version.json` and `kb/`.

**Do not** create `<Name>-KB-CLAUDE.md` companion files — a project is governed by its own
`projects/<name>/CLAUDE.md`.

## Conventions

- Cards use OKF frontmatter (`type/title/description/resource/tags/timestamp`) and relative links.
- Keep cards **high-level**; deep detail belongs in the project's own `kb/`.
- After edits, lint: `python3 .claude/skills/okf-wikify/scripts/lint_okf.py projects/kb/`.

## Related

- Repo-wide KB: [`/kb/index.md`](../../kb/index.md)
- A project's detail KB: `projects/<project-name>/kb/index.md`
