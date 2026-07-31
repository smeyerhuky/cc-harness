---
type: "Concept"
title: "Printed Foldable Fabrics (Space Fabric / Structured Fabrics)"
description: "One-piece printed interlocking fabrics that fold, pack, and deploy — and the FDM constraint the papers sidestep."
resource: "https://www.nature.com/articles/s41586-021-03698-7"
tags: ["metamaterials", "chainmail", "print-in-place", "foldable", "jamming", "4d-printing"]
timestamp: "2026-07-31"
---

# Printed Foldable Fabrics (Space Fabric / Structured Fabrics)

A family of **fabrics printed as a single interlocked piece** that drape like cloth, **fold and
pack into a volume**, and deploy back to a large 2D surface. Two demonstrated implementations
anchor the field; both matter for any print-in-place chainmail-style project.

## NASA JPL "space fabric" (Polit-Casillas et al.)

Metallic fabric that *resembles chain mail — small squares strung together* — **printed as one
unified piece**, not assembled. Framed as **"4D printing": print the geometry *and* the function**.
Four designed functions: **reflectivity, passive heat management, foldability, tensile strength**
(one face reflects, the other absorbs). Purpose-built for **folding / deployable** structures
(antennas, shielding). Made with **industrial metal powder-bed AM**.

## Caltech / NTU structured fabrics (Wang, Li, Hofmann, Andrade, Daraio — *Nature* 2021)

A fabric of **hollow interlocking particles printed already-interlocked in one piece**. Headline
unit is the **octahedron**; they also tried *rings, ovals, squares, cubes, pyramids*. Relaxed →
drapes like cloth; **vacuum-packed (jammed)** → **~25× stiffer**, holds ~50× its weight. Rigidity
comes from **packing increasing inter-particle contacts**. Printed in **nylon (powder-bed SLS)**
and **aluminum**.

## Why this matters — and the catch

- **Unit choice:** both efforts favor **interlocking 3D particles / tiles** over flat round rings.
  3D particles articulate in all directions, so the fabric is "loose in space" — rings/particles
  sit at **varying angles**, which is exactly what lets a loose fabric **collapse into a dense
  packed volume** and relax back flat.
- **One-piece printing:** the whole fabric emerges from the printer already interlocked
  (print-in-place). That part transfers directly.
- **The catch (process):** NASA used **metal powder-bed**, Daraio used **nylon SLS / aluminum** —
  **powder processes where un-sintered powder supports every overhang**, so arbitrary loosely-
  interlocked geometry prints trivially. **FDM (e.g. Bambu P1S) has no such support.** On FDM the
  single hardest problem is making a loose interlocked fabric print **without support and without
  fusing** — every element needs bed-reach or rest-contact, deliberate tolerance gaps everywhere,
  and fold creases realized as **bridge/living-hinge layers**. The papers prove the *vision* but
  sidestep *this* constraint.

## Design implications for an FDM print-in-place fabric

1. Prefer an **interlocking 3D particle** unit (box-link / octahedron / tile) over flat maille
   rings for pack density and articulation — but validate it prints supportless on FDM.
2. Keep **print-in-place** (one interlocked piece) and a measured **tolerance** on every contact
   so nothing fuses (see the [print-in-place chainmail cookbook](../scad-cookbook/print-in-place-chainmail.md)).
3. Realize folds as **precise tolerance/bridge layers** — planar gaps the fabric collapses along
   and reopens from.
4. Verify with measured tools, not intuition: manifold, collision-free, **topological interlink
   (linking number)**, and bed/rest support for every element.

## See also

- [Print-in-place chainmail cookbook](../scad-cookbook/print-in-place-chainmail.md) — the FDM interlink + linking-number technique.
- Project applying this: `projects/chain-mail/` (see its `HANDOFF.md`).

## Sources

- NASA JPL — *Space Fabric Links Fashion and Engineering*: https://www.jpl.nasa.gov/news/space-fabric-links-fashion-and-engineering/
- Wang et al., *Structured fabrics with tunable mechanical properties*, Nature 2021: https://www.nature.com/articles/s41586-021-03698-7
- phys.org summary: https://phys.org/news/2021-08-chain-mail-fabric-stiffen-demand.html
