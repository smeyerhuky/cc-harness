---
type: "Lesson"
title: "M1 — Print-in-Place Linkage Learnings"
description: "Two bugs (floating parts, non-linked rings) and the chosen 0.30 mm gap, all measured."
resource: "../../DESIGN_REPORT.md"
tags: ["print-in-place", "linking-number", "clearance", "lesson", "chainmail"]
timestamp: "2026-07-30"
---

# M1 — Print-in-Place Linkage Learnings

**Milestone gate:** a print-in-place linked pair that releases, articulates, and doesn't fuse →
pick the real design clearance `G`. **Result: PASSED physically.**

## Two bugs found and fixed

### Bug 1 — floating parts
An *isolated* print-in-place link floats: with sub-millimetre clearances **every ring is its own
island**, and any island not touching the bed cannot print (the slicer flags "floating parts").
**Learning: every ring must have its own bed-contact point.** (Spec §5.0.)

### Bug 2 — not actually interlinked
The first "fix" gave both rings the **same** tilt. **Two circles in parallel planes can never
link** — they were just two separate rings 0.4 mm apart. `check_fit.py` reported collision 0 and
gap 0.4, but **collision-free ≠ linked**. **Learning: non-collision does not prove a link;** you
must compute a **topological linking number**.

## The fix (both bugs)

Rings lean in **opposite** directions (+30° / −30°), offset diagonally. Opposite tilt → non-parallel
planes → the rings **genuinely interlink**, while each ring's low point rests on the bed. This is
how real European 4-in-1 alternates ring lean. Plate sits flat (z 0.000–6.400 mm); no support,
no floating.

## New verification tool: linking number

`projects/chain-mail/tools/linking_number.py` computes the discrete **Gauss linking integral**
over two ring centrelines. `|Lk| = 1` proves an interlink; `Lk = 0` means not linked. Now a
required gate beside `check_fit.py`. Sanity: same-tilt pair → **Lk 0.000**; opposite-tilt →
**Lk +1.000**.

## Measured tolerance ladder (tilt +30/−30, dy 3 mm)

| Target gap | dx | Measured clearance | Collision | Linking number |
|---|---|---|---|---|
| 0.30 (tight) | 3.7 | 0.306 mm | 0.000 mm³ | Lk +1.000 |
| 0.40 (nominal) | 3.4 | 0.403 mm | 0.000 mm³ | Lk +1.000 |
| 0.50 (safe) | 3.1 | ~0.51 mm | 0.000 mm³ | Lk +1.000 |

## Physical result & decision

All three printed on the P1S (0.4 nozzle / 0.2 layer): **every pair released and articulated,
none fused.** Chosen: **GAP = 0.30 mm (dx 3.7)** — locked in `config.scad`. The fusing floor is
at or below 0.30 mm for this machine/material/profile.

## Related

- [Weave tiling findings](weave-tiling.md) · [Geometry & configuration](../design/geometry-and-config.md)
- Reusable recipe: [Print-in-place chainmail cookbook](../../../../kb/additive-engineering/scad-cookbook/print-in-place-chainmail.md)
