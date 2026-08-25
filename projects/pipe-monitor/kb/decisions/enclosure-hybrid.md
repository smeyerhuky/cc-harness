---
type: "Concept"
title: "Hybrid enclosure vs. die-cast aluminium"
description: "Why the scaffold uses a 3D-printed hybrid enclosure with copper lining instead of the spec's die-cast aluminium box, and what that preserves and risks."
resource: "../../cad/enclosure.scad"
tags: ["cad", "shielding", "divergence"]
timestamp: "2026-08-24"
---

# Hybrid enclosure vs. die-cast aluminium

## The spec

`hardware/bill-of-materials.md` item 10 and `hardware/mounting-and-grounding.md` mark a **die-cast
aluminium enclosure `[HARD]`** for shielding. The analog front end is a microvolt-sensitive
100 MΩ-summing-node charge amp on a pipe that is frequently bonded to household earth ground. The
spec devotes a whole file to the 60 Hz ground-loop failure, which lands directly on the 50–700 Hz
leak band.

## The decision (operator choice)

Use a **hybrid**: a fully 3D-printed shell and clamp, with the amplifier region shielded by
**copper tape or conductive paint** and tied to a **single-point ground boss**. This satisfies the
3D-print goal while keeping the shielding *intent* of the `[HARD]` requirement.

## What it preserves

- A Faraday region over the summing node — the highest-impedance point — via a printed pocket
  sized for copper-tape lining, with an internal ground-boss the tape bonds to.
- **Kapton electrical isolation** of the piezo from the pipe (printed standoff geometry that holds
  the tape + grease sandwich) — the mechanism that prevents the ground loop in the first place.
- Single-point analog ground and shield-grounded-at-amp-end-only wiring, unchanged from spec.

## What it risks (and how Phase 0 checks it)

FDM/SLA plastic provides **zero** intrinsic EMI shielding. If the copper lining is skipped, or
poorly bonded, the ground-loop failure returns. This is not provable from CAD — it is a Phase 0
exit criterion: **mains hum ≥20 dB below flow-noise band energy**. If Phase 0 shows 60 Hz smear,
the mitigation ladder is: (1) verify Kapton isolation and single-point ground, (2) improve copper
coverage/bonding, (3) fall back to dropping the printed shell into a stock die-cast box (the
printed *clamp/mount* still carries).

## Consequence for the CAD

`cad/enclosure.scad` exposes `copper_pocket = true` and a `ground_boss` module. The clamp,
piezo pocket, and exciter standoff are independent of the shielding choice, so they print and
mount identically whether or not the box is later swapped for metal.
