---
type: "Reference"
title: "Spec Summary"
description: "Key decisions and subsystems of the frozen chain-mail specification."
resource: "../../spec/SPEC.md"
tags: ["spec", "requirements", "decisions", "folding", "color", "visualizer"]
timestamp: "2026-07-30"
---

# Spec Summary

The authoritative specification is **`projects/chain-mail/spec/SPEC.md`** (FROZEN 2026-07-30,
user sign-off). This is a navigable digest; the SPEC governs.

## Resolved decisions

1. **Ring gauge** — finer: WD 1.6 / ID 8 / OD 11.2 mm.
2. **Primary output** — one large drape strip, maximized via engineered fold.
3. **Color** — image-to-surface mapping is a core feature (`color_mode` off/band/image);
   prototypes default to `off`.
4. **Fold aggressiveness** — engineer the crease/"edge" links so fold radius is decoupled from
   drape gauge; target hinge `Rmin ≈ 8 mm` (~15× area).
5. **WebGPU physics visualizer** — in scope; a cloth-fidelity digital twin sharing the SCAD data
   contract and crossvalidating the analytic fold kinematics.

## Subsystems (spec sections)

- **§3–4 Ring & weave** — torus geometry, European 4-in-1, computed tilt verified by collision test.
- **§5 Folding** — accordion packing; **dedicated hinge crease rows** fold tight. Honest scope:
  ~15× ≈ **~17k rings** → multi-day prints; strip length stays a dial.
- **§5.0 Floating-islands rule** — every ring needs its own bed-contact point (learned at M1).
- **§6 Validation gates** — manifold, clearance, weave closure, articulation ROM, fold
  collapse/expand, crease integrity, no-support, color-map fidelity. Green only when `verify.py` passes.
- **§7 Color** — image → `(u,v)` → AMS-palette per-ring color, preserved through the fold.
- **§8 WebGPU visualizer** — XPBD physics twin; emergent fold radius must match analytic `Rmin`.

## Milestones

M0 spec freeze → M1 link coupon → M2 flat swatch + color → M3 hinge-fold coupon → M4 multi-fold
panel → M5 full strip → M6 seam/join doc. Status and detail: [Milestones & plan](../process/milestones.md).

## Risks (tracked in spec §10.1)

Finer-wire fragility · scale explosion (~17k rings) · hinge strain · palette posterization ·
viz-vs-reality gap.

## Related

- [Geometry & configuration](geometry-and-config.md) · [Findings](../findings/index.md)
