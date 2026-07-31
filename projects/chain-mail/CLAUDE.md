# Chain Mail — Working Rules for Claude Sessions

Governs the `chain-mail` project. A **parametric, print-in-place, folding European 4-in-1
chainmail** for the Bambu Lab P1S (0.4 mm nozzle, 0.2 mm layers, CMYK PLA via AMS 2), built with
the `scad-design-to-print` skill. Prints as one job, pre-folded, then unfolds into a wide maille
sheet. For dwarf/gnome cosplay.

## Structure

```
src/            OpenSCAD source — config.scad (single source of truth), ring.scad, coupon*.scad
spec/           SPEC.md (FROZEN) + fit_checks.json (automated clearance checks)
tools/          verification scripts incl. linking_number.py (Gauss linking-number gate)
stl/ renders/   exported meshes and iso/top/section PNGs
kb/             project knowledge base (OKF) — see navigation below
DESIGN_REPORT.md  measured engineering log, one section per milestone
README.md  version.json
```

## Knowledge base navigation

The `kb/` bundle is the place to understand where the project stands. Start at
[`kb/index.md`](kb/index.md), then:

- **[overview/](kb/overview/index.md)** — goal/task, what it is, current status
- **[design/](kb/design/index.md)** — geometry, weave, `config.scad` parameters, frozen-spec summary
- **[findings/](kb/findings/index.md)** — measured results and learnings per milestone
- **[process/](kb/process/index.md)** — milestones/plan (M0–M6) and how work is validated
- **[structure/](kb/structure/index.md)** — directory/file layout

## Start here

**[`HANDOFF.md`](HANDOFF.md)** is the full documented handoff — goal, every decision and measured
result, tooling, and current/future stages. Read it first to pick up the project cold.

## Authoritative sources (the KB digests these)

- `spec/SPEC.md` — frozen specification; **governs**. Post-freeze changes need a new signed-off revision.
- `src/config.scad` — single source of truth for every numeric parameter; edit here, not downstream.
- `DESIGN_REPORT.md` — measured results and decisions.

## Conventions

- **Measured, not asserted.** Every quantitative claim traces to `check_fit.py`, `check_mesh.py`,
  `verify.py`, or `tools/linking_number.py`. Collision-free is **not** the same as interlinked —
  prove interlink with the linking number (`|Lk| = 1`).
- **Document as you go.** Update `kb/`, `DESIGN_REPORT.md`, and `version.json` in the same change
  that produces the result; keep the card at `projects/kb/projects/chain-mail.md` in sync.
- **OKF hygiene:** `okf_version` only in `kb/index.md`; subdirectory `index.md` files are pure
  tables of contents. After editing the KB, lint:
  `python3 .claude/skills/okf-wikify/scripts/lint_okf.py projects/chain-mail/kb/`.

## Related

- Repo-wide 3D-print knowledge: [`/kb/additive-engineering/`](../../kb/additive-engineering/index.md)
  (see the print-in-place chainmail cookbook entry).
- Projects rules: [`/projects/CLAUDE.md`](../CLAUDE.md)
