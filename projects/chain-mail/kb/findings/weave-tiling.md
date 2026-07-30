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

## Related

- [M1 findings](m1-print-in-place.md) · [Milestones & plan](../process/milestones.md)
