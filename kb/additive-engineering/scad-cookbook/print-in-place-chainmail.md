---
type: "Code Example"
title: "Print-in-Place Interlinked Rings (Chainmail)"
description: "Two rings that print pre-linked with no support, and how to prove they actually interlink."
resource: "Project: projects/chain-mail"
tags: ['openscad', 'chainmail', 'print-in-place', 'clearance', 'linking-number', 'verification']
timestamp: "2026-07-30"
---

# Print-in-Place Interlinked Rings (Chainmail)

Reusable recipe distilled from the `projects/chain-mail` build. Two failure modes bite every
print-in-place interlink; both are avoidable.

## Failure mode 1 — floating parts

With deliberate clearances, **every ring is a separate island**. A slicer rejects any island that
does not touch the build plate ("floating parts"). So **every ring needs its own bed-contact
point**. An isolated pair where one ring is held up only by the other will float.

## Failure mode 2 — not actually linked

**Collision-free ≠ interlinked.** Two circles in **parallel planes can never link** — they can sit
0.3 mm apart with zero collision yet slide right apart. Rings interlink only when their planes are
**non-parallel**: adjacent rings must lean in **opposite** directions (+θ / −θ). A clearance check
alone will not catch this; you must compute a **topological linking number**.

## The pose that works

Opposite tilt (+θ / −θ), offset diagonally, each ring's low point lifted to rest on the bed:

```openscad
WD = 1.6; ID = 8.0;                 // wire dia, inner dia
tilt = 30; dx = 3.7; dy = 3.0;      // dx sets the crossing gap (measure it!)
R = (ID + WD)/2;
lift = R*sin(tilt) + WD/2;          // low point sits on z=0

module ring(wd=WD, id=ID)
    rotate_extrude($fn=48) translate([(id+wd)/2,0]) circle(d=wd, $fn=24);

translate([0,  0,  lift]) rotate([0,  tilt, 0]) ring();   // ring A  (+tilt)
translate([dx, dy, lift]) rotate([0, -tilt, 0]) ring();   // ring B  (-tilt), threads A
```

Shallow tilt (~30°) keeps the top arch an easy bridge; both feet touch the bed → no support, no
floating.

## Verify — trust the boolean, not the typed number

1. **Clearance / collision** — export each ring separately and run `check_fit.py`; want collision
   0 and min clearance = your target gap.
2. **Interlink** — compute the discrete **Gauss linking integral** over the two centrelines.
   `|Lk| = 1` proves a real link; `Lk = 0` means not linked. (Reference implementation:
   `projects/chain-mail/tools/linking_number.py`.) Sanity check it: same-tilt pair → `Lk 0`,
   opposite-tilt pair → `Lk +1`.
3. **Bed contact** — the assembly's `z_min` must be ≈ 0.

## Tuning the gap

At fixed tilt/`dy`, the crossing gap is monotonic in `dx` — sweep it and *measure*. On a Bambu
P1S (0.4 nozzle / 0.2 layer, PLA), gaps of 0.30/0.40/0.50 mm all released and articulated cleanly;
0.30 mm was usable. Find your own floor with a physical ladder before committing.

## Tiling to a sheet (caution)

European 4-in-1 = each ring threads its 4 **diagonal** neighbors (pure-X offsets don't link).
Naïvely tiling a flat grid **collides on same-tilt rings two rows apart** when the ring OD exceeds
the weave pitch. Real maille avoids this by being **woven over-under** (~2 wire-diameters thick,
rings at alternating Z) — still print-in-place, since elevated rings rest on lower ones.

## See also

- [Print-in-Place Hinge](print-in-place-hinge.md) — the other classic print-in-place clearance case.
- [Geometric validation](../agentic-design/geometric-validation.md) — measure, don't assume.
- Project findings: `projects/chain-mail/kb/findings/`.
