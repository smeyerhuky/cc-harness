---
type: "Reference"
title: "Chain Mail"
description: "Parametric print-in-place folding European 4-in-1 chainmail for the Bambu P1S."
resource: "../../chain-mail/README.md"
tags: ["chain-mail", "chainmail", "print-in-place", "openscad", "project"]
timestamp: "2026-07-30"
---

# Chain Mail

A **parametric, print-in-place, folding European 4-in-1 chainmail** for the **Bambu Lab P1S**
(0.4 mm nozzle, 0.2 mm layers, CMYK PLA via AMS 2). It prints as one job, pre-folded into the
build volume, then unfolds into a wide flexible maille sheet. For dwarf/gnome cosplay. Built with
the `scad-design-to-print` skill; every geometric/kinematic claim is verified by measurement.

## Status

**M1 complete (physical)** — print-in-place linkage validated on the P1S; design clearance locked
at **G = 0.30 mm**. **M2** (woven E4-1 sheet) in progress.

## Highlights

- **Finer gauge:** WD 1.6 / ID 8 / OD 11.2 mm.
- **Engineered hinge folding** decouples fold radius from drape gauge (target ~15× area).
- **Image-to-surface color** preserved per-ring through the fold (`color_mode` off/band/image).
- **WebGPU physics twin** crossvalidates the fold kinematics.
- **Linking-number gate** (`tools/linking_number.py`) proves rings truly interlink — collision-free
  is not the same as linked.

## Getting started

1. **Goal & status:** `projects/chain-mail/README.md` and `kb/overview/about.md`.
2. **Design & config:** `kb/design/` and `src/config.scad` (single source of truth).
3. **Learnings:** `kb/findings/` (M1 linkage, M2 weave tiling).
4. **Plan:** `kb/process/milestones.md`.
5. **Spec (governs):** `spec/SPEC.md`. **Engineering log:** `DESIGN_REPORT.md`.

## Related

- Project KB entry point: `projects/chain-mail/kb/index.md`
- Repo-wide recipe: [Print-in-place chainmail cookbook](../../../kb/additive-engineering/scad-cookbook/print-in-place-chainmail.md)
