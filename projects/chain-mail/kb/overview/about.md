---
type: "Concept"
title: "About Chain Mail"
description: "Goal, scope, and status of the print-in-place folding European 4-in-1 chainmail project."
resource: "../../README.md"
tags: ["chain-mail", "overview", "goal", "print-in-place", "chainmail"]
timestamp: "2026-07-30"
---

# About Chain Mail

## Goal / task

Design a **single parametric OpenSCAD model** that prints as **one job, fully articulated, with
zero assembly** (print-in-place) and yields a **wide, flexible European 4-in-1 chainmail sheet**.
Because the unfolded sheet is larger than the printer's footprint, the part is printed
**pre-folded** (accordion / mountain-valley) to pack maximum unfolded area into the build volume,
then hand-expanded into the flat sheet. Target use: **dwarf / gnome cosplay** (chunky-to-fine
maille reads well and helps printability).

## Non-negotiables

- **Print-in-place is mandatory** — no post-print assembly of individual rings.
- **Controlled tolerance / gaps** so links articulate and never fuse.
- **Classic European 4-in-1** weave for authentic drape.
- **Math + kinematic validation as we go** — measured, never assumed.

## Target machine & material

Bambu Lab **P1S** + **AMS 2**, **CMYK PLA**. Build volume 256³ mm (usable ~230 × 230 × 236 mm
with buffer). **0.4 mm** nozzle, **0.2 mm** layers. See [Geometry & configuration](../design/geometry-and-config.md).

## Distinctive subsystems

- **Engineered hinge folding** — dedicated crease links fold tight, decoupling fold radius from
  drape gauge (target ~15× area per print). See the [spec summary](../design/spec-summary.md).
- **Image-to-surface color** — map any SVG/JPG/PNG onto the *unfolded* sheet, preserved per-ring
  through the fold (`color_mode` = off / band / image).
- **WebGPU physics visualizer** — a cloth-fidelity digital twin that crossvalidates the analytic
  fold kinematics.

## Current status

**M1 complete (physical).** Print-in-place linkage validated on the P1S; design clearance locked
at **G = 0.30 mm**. **M2** (woven E4-1 sheet) in progress. Full history:
[Findings](../findings/index.md) · [Milestones & plan](../process/milestones.md).

## Related

- [Design overview](../design/index.md) · [Frozen spec summary](../design/spec-summary.md)
- Source of truth for numbers: `projects/chain-mail/src/config.scad`
- Engineering log: `projects/chain-mail/DESIGN_REPORT.md`
- Repo-wide 3D-print knowledge: [Additive Engineering KB](../../../../kb/additive-engineering/index.md)
