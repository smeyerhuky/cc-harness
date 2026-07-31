---
type: "Playbook"
title: "Milestones & Plan"
description: "The staged de-risking plan (M0-M6) for chain-mail and current status."
resource: "../../spec/SPEC.md"
tags: ["plan", "milestones", "roadmap", "validation"]
timestamp: "2026-07-30"
---

# Milestones & Plan

Small milestones de-risk the hard parts (print-in-place release, engineered fold, color at scale)
before any large print. Each milestone runs `verify.py`; results attach to `DESIGN_REPORT.md`.

| # | Milestone | Gate | Status |
|---|---|---|---|
| M0 | Spec freeze | user sign-off | ✅ done (2026-07-30) |
| M1 | 2-ring link coupon (WD 1.6) | releases, no fuse, not fragile → pick `G` | ✅ done — **G = 0.30 mm** |
| M2 | Flat E4-1 swatch + color | weave closes/drapes; image-map reads | 🔄 in progress (woven-height approach) |
| M3 | Single hinge-fold coupon | prints & unfolds; pins hinge `Rmin`; crease survives | ⏳ pending |
| M4 | Multi-fold panel | full fold/expand kinematics; color-invariance | ⏳ pending |
| M5 | Full strip (~3 m unfolded) | `verify.py` all-pass; print-time/AMS budget accepted | ⏳ pending |
| M6 | Seam/jump-ring join doc | assembly guide for multi-strip garments | ⏳ pending |

The **WebGPU visualizer** (spec §8) is built alongside: a **VZ0** skeleton lands with M2; the
**XPBD physics + crossvalidation gate** matures with M3/M4.

## How work is validated ("trust the boolean")

- **Never trust typed numbers** — trust measured results from `check_fit.py` (clearance/collision),
  `check_mesh.py` (manifold), `tools/linking_number.py` (topological interlink), and `verify.py`
  (master orchestrator, exit 0 = green).
- A geometry change is not accepted until it renders correctly *and* passes verification.

## Immediate next step

Build the **woven-height E4-1 unit cell** (see [Weave tiling](../findings/weave-tiling.md)) and
verify it before tiling a printable swatch.

## Related

- [Spec summary](../design/spec-summary.md) · [Findings](../findings/index.md)
- Repo git protocol: [`kb/process`](../../../../kb/process/index.md)
