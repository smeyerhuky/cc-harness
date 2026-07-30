---
type: "Reference"
title: "FDM Materials for Functional Parts"
description: "Material properties, FDM anisotropy, shrinkage factors, minimum wall counts, and print-setting guidelines for functional OpenSCAD designs."
resource: "https://bambulab.com/en/filament"
tags: ["fdm", "materials", "pla", "petg", "abs", "asa", "nylon", "tpu", "shrinkage", "anisotropy"]
timestamp: "2026-07-30"
---

# FDM Materials for Functional Parts

FDM parts are **anisotropic**: they are weakest in the Z (layer-bond) direction and strongest in XY (within-layer). Design geometry, orient prints, and choose materials with this in mind.

## Quick Reference Table

| Material | Tensile Strength XY | Z/XY Ratio | Shrinkage | Enclosure? | Best Use |
| :--- | :---: | :---: | :---: | :---: | :--- |
| PLA | ~50 MPa | ~0.6 | 0.3–0.5% | No | Prototypes, low-stress parts |
| PETG | ~50 MPa | ~0.65 | 0.2–0.3% | No | Food-safe, impact-resistant |
| ABS | ~40 MPa | ~0.5 | 0.5–0.8% | **Yes** | High-temp, post-processable |
| ASA | ~45 MPa | ~0.55 | 0.4–0.7% | **Yes** | Outdoor/UV-stable |
| PA6 (Nylon) | ~70 MPa | ~0.7 | 0.8–1.5% | **Yes** | Gears, bearing surfaces |
| PA-CF | ~100 MPa | ~0.75 | 0.3–0.5% | **Yes** | Structural, stiff gears |
| TPU 95A | ~30 MPa | ~0.5 | 0.5–1.0% | Optional | Seals, gaskets, grips |
| PC | ~55 MPa | ~0.55 | 0.5–0.7% | **Yes** | Impact, transparency |

*XY tensile values are approximate; they vary by brand, layer height, and infill density.*

## FDM Anisotropy — Design Implications

1. **Orient the load path in XY.** Tensile loads on Z-layer bonds cause delamination at ~40–65% of XY strength. Place the primary stress axis within the print plane.
2. **Bridging**: FDM can bridge horizontally up to ~50–80 mm without support (material-dependent). Overhangs >45° from vertical need support or chamfers.
3. **Layer bonding** improves with: slower print speed, higher temperature, shorter layer height, and thicker extrusion width.

## Shrinkage & Dimensional Accuracy

FDM parts shrink as they cool. Compensate in OpenSCAD with a global scale factor:

```scad
// config.scad
shrinkage_factor = 1.005;  // 0.5% for PLA — adjust per material
```

Apply before export only — don't bake compensation into base geometry, keep it in `config.scad` as an explicit parameter.

**Bore holes**: FDM inner diameters print ~0.1–0.3 mm undersized due to filament pressure and shrinkage. Add a hole compensation value:

```scad
hole_compensation = 0.2;  // add to radius for all through-holes
cylinder(r = bore_r + hole_compensation, h = thickness);
```

## Minimum Wall Thicknesses

| Feature | Minimum | Recommended |
| :--- | :---: | :---: |
| Unsupported wall | 0.8 mm (1× extrusion width) | 1.2 mm (1.5×) |
| Structural wall | 1.2 mm | 2.0–3.0 mm |
| Snap-fit arm | 1.5 mm | 2.0 mm |
| Thread wall | 2.0 mm | 3.0 mm |
| Screw boss wall | 1.5 mm beyond insert OD | 2.5 mm |

*Extrusion width is typically 0.4–0.5 mm for a 0.4 mm nozzle.*

## Layer Height vs. Surface Quality

| Layer Height | Z-Resolution | Strength | Print Time |
| :--- | :---: | :---: | :---: |
| 0.05 mm | Excellent | Low (cold layers) | Very slow |
| 0.10 mm | Very good | Good | Slow |
| 0.20 mm | Good | Best | Normal |
| 0.30 mm | Moderate | Good | Fast |

**Rule**: 0.20 mm is the sweet spot for functional parts. Use 0.10 mm only for fine features (threads, gear teeth). Never use 0.05 mm for structural parts — inter-layer adhesion suffers.

## Clearances for Printed Fits

These values assume a well-calibrated printer (Bambu X1C / P1S with default profiles):

| Fit Type | Radial Clearance (each side) | Total Diameter Delta |
| :--- | :---: | :---: |
| Press-fit (permanent) | 0.0–0.1 mm | 0.0–0.2 mm |
| Snug / hand-press | 0.1–0.15 mm | 0.2–0.3 mm |
| Sliding / running | 0.15–0.2 mm | 0.3–0.4 mm |
| Loose / free | 0.25–0.4 mm | 0.5–0.8 mm |

Define all clearances in `config.scad`:
```scad
clearance_press   = 0.0;
clearance_snug    = 0.15;
clearance_sliding = 0.2;
clearance_free    = 0.35;
```

## Infill for Functional Parts

| Use Case | Infill % | Pattern |
| :--- | :---: | :--- |
| Prototyping / visual | 10–15% | Grid or gyroid |
| General functional | 20–30% | Gyroid |
| High-load structural | 40–60% | Rectilinear or honeycomb |
| Gears / bearing races | 60–80% | Rectilinear |
| Solid (max strength) | 100% | Rectilinear |

Gyroid is preferred for isotropic strength; rectilinear maximises load-bearing in a known direction.

## Material-Specific Notes

### PLA
- Prints on any printer; no enclosure needed.
- Heat deflection temperature: ~60°C — not suitable for engine bays or dishwashers.
- Post-processing: sandable, paintable.

### PETG
- Layer adhesion better than PLA; slightly more flexible.
- Strings aggressively — retraction tuning required.
- Bonds poorly to ABS/ASA; acceptable to PLA with interface layer.

### ABS / ASA
- Requires heated enclosure (≥ 40°C chamber) to prevent warping.
- ABS: acetone-smoothable, excellent layer bonding.
- ASA: UV-stable, preferred over ABS for outdoor parts.

### Nylon (PA6 / PA12)
- Absorbs moisture from air — dry 12 h at 70°C before printing.
- Excellent abrasion resistance; best material for printed gears.
- PA-CF (carbon-fibre reinforced): stiffer, less moisture-sensitive.

### TPU
- Print slowly (≤ 25 mm/s) to avoid buckling in Bowden setups.
- Shore hardness 95A ≈ firm rubber; 85A ≈ soft rubber.

## Related

- [`mechanics.md`](mechanics.md) — gear tooth geometry and bearing-fit calculations that use these clearance values.
- [`algorithms.md`](algorithms.md) — CSG strategies affected by material shrinkage and minimum feature size.
