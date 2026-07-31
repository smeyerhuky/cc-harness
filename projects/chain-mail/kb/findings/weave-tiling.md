---
type: "Lesson"
title: "M2 — Weave Tiling Constraint"
description: "Linking rules for E4-1 and why a perfectly flat weave cannot tile at this ring gauge."
resource: "../../DESIGN_REPORT.md"
tags: ["european-4-in-1", "weave", "tiling", "collision", "lesson", "woven-height"]
timestamp: "2026-07-30"
---

# M2 — Weave Tiling Constraint

**Milestone:** the flat E4-1 swatch. **Status: in progress** — geometry characterized, approach
chosen, unit cell not yet built.

## Linking rules (opposite-tilt +T / −T rings), measured

- Pure **X** offset `(cx, 0)` → **no link** (Lk 0) at any tilt/spacing tested.
- Pure **Y** offset `(0, cy)` → **links** (Lk +1); clearance grows with `cy`.
- **Diagonal** `(dx, dy)` → **links** (Lk +1) — the M1 pair, and the real E4-1 link.

So E4-1 here = each ring threads its **4 diagonal neighbors** in the rows above/below, with tilt
**alternating per row**.

## The flat-tiling constraint

| Neighbor (same tilt) | Offset | Collision |
|---|---|---|
| same-row | (7.4, 0) | 0.00 mm³ ✓ |
| two rows apart | (0, 6.0) | 5.51 mm³ ✗ |
| two rows apart | (0, 12.0) | 0.00 mm³ ✓ |

The diagonal link needs `dy ≈ 3 mm`, so same-tilt rings repeat every `2·dy = 6 mm` and **collide**
(they don't clear until ~12 mm). **Conclusion: a perfectly flat E4-1 (all rings at one Z) cannot
tile at OD 11.2 mm** — the rings are too fat for the tight weave.

## Chosen approach: woven over-under

The real solution (used by both metal and printed maille): a **woven sheet ~2 wire-diameters
thick**, rings alternating in **Z** so same-tilt neighbors clear vertically. Still print-in-place —
elevated rings **rest on** lower rings (contact, printable), so nothing floats.

**Next step:** build the woven-height E4-1 unit cell and verify all-links-`Lk`=1 +
all-pairs-collision-free + every-ring-bed-or-rest-supported, then tile into a small swatch.

## Wide-sheet stress test (round vs square units) + new tools

Two fast tools were added to make this a measured search, not a guess:
- **`tools/collision_scan.py`** — whole-assembly gate via **FCL** (`trimesh.collision`): one query
  returns every fused pair, another the global min clearance. (The earlier boolean version was too
  slow at sheet scale.)
- **`tools/sheet_scan.py`** — instances **one exported link** across the lattice (no CGAL for the
  whole sheet, so it scales) and runs the gate; with `--flex-sweep` it re-checks across an
  articulation range = the **kinematic range-of-motion gate**.

**Kinematic ROM (articulate the verified interlinked pair):**
| Unit | rest clearance | collision-free flex range | note |
|---|---|---|---|
| round | 0.29 mm | ~ −8° … +20°+ | tighter |
| **square** | **0.71 mm** | ~ −12° … +20°+ | **~2.4× more slack → looser articulation** |

Square (box) links have far more articulation headroom — relevant to packing at varied angles.

**Wide 2D grid stress test (6×6):** both units **FUSE heavily** when rigidly tiled — fusion begins
at the 2×2 diamond (the same-tilt `(0,6)` collision), 65 fused pairs at 6×6. A **flat two-height**
weave (rings at alternating Z) is collision-free **but has `Lk = 0` — not interlinked** (it would
fall apart). So:

> **Definitive finding:** with *rigid* ring placement at this gauge you can get interlink **or**
> clearance, never both. Real maille achieves both only because rings are **loose and settle at
> varied angles**, so wires thread through each other's *holes* instead of colliding. A rigid
> lattice cannot represent that.

**Paths forward (from this + the NASA/Daraio research):**
1. **Relaxation/settling:** derive correct E4-1 ring *poses* (or run a physics relax — the planned
   XPBD visualizer) so wires interleave through holes; then freeze poses for print.
2. **3D-particle units** (octahedra / box-links, per NASA JPL space fabric & Wang–Daraio *Nature*
   2021): interlock by **3D capture**, sidestepping the parallel-plane constraint; proven foldable
   and printable-in-one-piece (though on powder-bed AM — on FDM the bed-contact/bridge constraints
   still apply).

## Related

- [M1 findings](m1-print-in-place.md) · [Milestones & plan](../process/milestones.md)

- [M1 findings](m1-print-in-place.md) · [Milestones & plan](../process/milestones.md)
