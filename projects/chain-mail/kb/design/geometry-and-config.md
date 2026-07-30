---
type: "Reference"
title: "Geometry & Configuration"
description: "Ring geometry, European 4-in-1 weave parameters, and the config.scad single source of truth."
resource: "../../src/config.scad"
tags: ["geometry", "config", "chainmail", "european-4-in-1", "parameters"]
timestamp: "2026-07-30"
---

# Geometry & Configuration

All numeric parameters live in `projects/chain-mail/src/config.scad` — the **single source of
truth**. This page explains what they mean; the file is authoritative.

## Ring geometry (the unit)

A ring is a torus: **wire diameter `WD`** (cross-section) and **inner diameter `ID`**, with
**outer diameter `OD = ID + 2·WD`** and **aspect ratio `AR = ID / WD`**.

| Symbol | Value | Note |
|---|---|---|
| `WD` | **1.6 mm** | finer gauge (authentic drape); ~3.5× extrusion width |
| `AR` | **5.0** | E4-1 closes for AR ≳ 3.0–3.5; 5 gives drape + clearance room |
| `ID` | **8.0 mm** | = AR·WD |
| `OD` | **11.2 mm** | = ID + 2·WD |

## Print-in-place clearance (chosen at M1)

`GAP = 0.30 mm` — the **locked** design clearance between linked wires. All three tested gaps
(0.30 / 0.40 / 0.50) printed and released cleanly on the P1S; the tightest was chosen. `GAP_ALT_04`
and `GAP_ALT_05` remain as looser fallbacks. See [M1 findings](../findings/m1-print-in-place.md).

## M1-calibrated interlink (the weave basis)

A verified linked pair (Gauss linking number **Lk = +1**) that both rests on the bed and holds
`GAP` between threaded wires. Adjacent rings must lean in **opposite** directions — two circles
in parallel planes cannot link.

| Symbol | Value | Note |
|---|---|---|
| `LINK_TILT` | **30°** | ring lean; opposite sign on adjacent rings |
| `LINK_DX` | **3.7 mm** | diagonal X offset giving GAP=0.30 at this tilt |
| `LINK_DY` | **3.0 mm** | diagonal Y offset (row step) |

## Engineered hinge / crease links

Crease links get their own geometry (`HINGE_WD` 1.2, `HINGE_AR` 6.5, target `HINGE_RMIN` ~8 mm)
tuned to fold tight, decoupling fold radius from drape gauge. See [spec summary](spec-summary.md) §5.

## Build volume & profile

`BED` 256, usable ~`230 × 230 × 236`; `NOZZLE` 0.4, `LAYER_H` 0.2, `EXTRUSION_W` ~0.45.

## Color

`COLOR_MODE` = `"off"` (default for prototypes) / `"band"` / `"image"`. Geometry is identical
across modes; only per-ring filament assignment changes.

## Weave linking rules (measured at M2)

Opposite-tilt rings **do not** link on pure-X offsets, **do** link on pure-Y and diagonal
offsets. E4-1 = each ring threads its 4 **diagonal** neighbors in adjacent rows, tilt alternating
per row. Full detail and the flat-tiling constraint: [Weave tiling findings](../findings/weave-tiling.md).

## Related

- [Spec summary](spec-summary.md) · [M1 findings](../findings/m1-print-in-place.md)
- Repo-wide recipe: [Print-in-place chainmail cookbook](../../../../kb/additive-engineering/scad-cookbook/print-in-place-chainmail.md)
