# Chain Mail Knowledge Base (OKF Format)

This is an Open Knowledge Format (OKF) bundle documenting the **Chain Mail** project — a
parametric, print-in-place, folding European 4-in-1 chainmail for the Bambu Lab P1S. It captures
the project's goal, spec, configuration, findings/learnings, and plan so a future session can
resume with full context.

## About this bundle

Organized following the [OKF spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf).
Each content file has YAML frontmatter (type, title, description, resource, tags, timestamp)
followed by markdown. `okf_version` appears **only** in `kb/index.md`. Subdirectory `index.md`
files are pure tables of contents (no frontmatter).

## Sections

- **`overview/`** — goal/task, what it is, current status.
- **`design/`** — ring geometry, weave, the `config.scad` parameters, and the frozen spec summary.
- **`findings/`** — measured results and hard-won learnings per milestone (M1 linkage, M2 weave).
- **`process/`** — milestones/plan (M0–M6) and how work is validated.
- **`structure/`** — directory/file layout.

## Using this knowledge base

**Start:** `kb/index.md`. **Understand the design:** `design/`. **See what we learned and why the
geometry is what it is:** `findings/`. **Know what's next:** `process/milestones.md`.

## Authoritative sources (this KB digests them)

- `spec/SPEC.md` — frozen specification (governs).
- `src/config.scad` — single source of truth for all numbers.
- `DESIGN_REPORT.md` — measured engineering log per milestone.

## Conventions

- Frontmatter on every content file; relative markdown links; types in use: `Concept`,
  `Reference`, `Lesson`, `Playbook`.
- **Findings are measured, not asserted** — every quantitative claim traces to `check_fit.py`,
  `check_mesh.py`, `verify.py`, or `tools/linking_number.py`.
- After edits, lint: `python3 .claude/skills/okf-wikify/scripts/lint_okf.py projects/chain-mail/kb/`.

## Related knowledge bases

- Repo-wide 3D-print engineering: `/kb/additive-engineering/` (see the print-in-place chainmail
  cookbook entry).
- Projects navigation: `/projects/kb/`.
- Repository KB & git protocol: `/kb/`.
