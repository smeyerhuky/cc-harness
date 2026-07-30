---
type: "Reference"
title: "Mechanical Engineering for OpenSCAD Designs"
description: "Gear module math, pressure angles, bearing fits, shaft-hub joints, snap-fit calculations, and stiffness estimates for FDM parts."
resource: "https://www.khkgears.net/new/gear_knowledge/abcs_of_gears-b/b6.html"
tags: ["gears", "bearings", "mechanics", "fdm", "snap-fit", "shaft", "tolerances"]
timestamp: "2026-07-30"
---

# Mechanical Engineering for OpenSCAD Designs

## Gears

### Module System (ISO 286)

Gear size is defined by **module** `m` (mm per tooth):

```
pitch_diameter = m × number_of_teeth
```

BOSL2 uses the `spur_gear()` primitive which accepts `mod` (module) directly.

| Module | Tooth Size | Typical Use |
| :---: | :--- | :--- |
| 0.5 | Very fine | Clockwork, micro-mechanisms |
| 1.0 | Fine | Small gearboxes, RC cars |
| 1.5 | Medium | Hobby robotics |
| 2.0 | Coarse | Functional FDM gears |
| 3.0 | Very coarse | High-torque, low-speed |

**FDM minimum module**: m = 1.5 for PLA/PETG, m = 1.0 for PA-CF with 0.2 mm layer height. Smaller teeth print poorly.

### Pressure Angle

Standard pressure angle: **20°** (ISO). BOSL2 default is also 20°.

Use **14.5°** only for legacy compatibility. **25°** gives stronger teeth but less smooth meshing — use for high-load, low-speed FDM gears.

```scad
include <../libs/BOSL2/std.scad>
spur_gear(mod=2, teeth=20, thickness=8, pressure_angle=20);
```

### Centre Distance

For two meshing spur gears:
```
centre_distance = (m × (teeth_a + teeth_b)) / 2
```

Add 0.1–0.2 mm backlash clearance to centre distance for FDM gears:
```scad
centre_dist = (m * (teeth_a + teeth_b)) / 2 + backlash_clearance;
```

### Gear Ratio & RPM

```
ratio        = teeth_driven / teeth_driver
RPM_output   = RPM_input / ratio
torque_output = torque_input × ratio × efficiency
```

FDM gear efficiency: ~0.85–0.92 per stage (plastic-on-plastic, unlubricated).

### Bevel & Helical Gears

- **Helical gears**: helix angle 15–30° reduces noise, increases axial load. BOSL2: `spur_gear(..., helical=20)`.
- **Bevel gears**: shaft angle typically 90°. BOSL2: `bevel_gear(mod=2, teeth=20, face_width=10, shaft_angle=90)`.

### Minimum Tooth Width

```
face_width = 8 × m   (rule of thumb: 8–16× module)
```

FDM gears: use 10–12× module. Wider face = more contact = more load capacity but more weight.

---

## Bearings

### Standard Bore Sizes (608, 624, 685 Series)

| Designation | Bore (d) | OD (D) | Width (B) |
| :---: | :---: | :---: | :---: |
| 608 ZZ | 8 mm | 22 mm | 7 mm |
| 624 ZZ | 4 mm | 13 mm | 5 mm |
| 685 ZZ | 5 mm | 11 mm | 5 mm |
| 6001 ZZ | 12 mm | 28 mm | 8 mm |
| 6200 ZZ | 10 mm | 30 mm | 9 mm |
| MR105 ZZ | 5 mm | 10 mm | 4 mm |

### Bearing Fit Types (ISO 286)

For a shaft into an inner bore:

| Fit Type | Shaft Tolerance | Bore in Housing | Notes |
| :--- | :---: | :---: | :--- |
| Press-fit (inner race) | h6 (+0/−0.011 mm for Ø8) | — | Bearing press-fit into shaft |
| Sliding (inner race) | f7 | — | Bearing slides on shaft |
| Press-fit (outer race) | — | H7 | Bearing in printed housing |
| Loose (outer race) | — | G7 | Serviceable fit |

**FDM practical values** (compensate for print inaccuracy):

```scad
// Press-fit bearing into printed housing (outer race)
housing_bore = bearing_od + 0.0;   // exact nominal; FDM will give ~0.1 mm clearance
                                    // tune by test print

// Sliding shaft through bearing inner bore
shaft_dia    = bearing_id - 0.1;   // 0.1 mm undersize for sliding
```

Always print a test coupon of the bearing pocket before committing to a full print.

---

## Shaft–Hub Joints

### Keyed Shaft (DIN 6885)

Common square key cross-sections for shaft diameters:

| Shaft Ø (mm) | Key Width × Height |
| :---: | :---: |
| 6–8 | 2 × 2 |
| 8–10 | 3 × 3 |
| 10–12 | 4 × 4 |
| 12–17 | 5 × 5 |
| 17–22 | 6 × 6 |

Key-slot clearance in FDM hub: add 0.15 mm per side.

### D-Shaft (Flat on Round)

```scad
// D-shaft profile
module d_shaft(dia, flat_depth, len) {
  difference() {
    cylinder(d=dia, h=len, $fn=64);
    translate([-dia/2, dia/2 - flat_depth, -0.001])
      cube([dia, flat_depth + 0.001, len + 0.002]);
  }
}
```

Hub bore: add 0.15 mm on the round side, 0.1 mm on the flat side.

---

## Snap-Fits

### Cantilever Snap-Fit

```
deflection_y    = (strain_max × L²) / (1.5 × h)
snap_force      = (E × b × h³ × deflection) / (4 × L³)
```

Where:
- `L` = arm length (mm)
- `h` = arm thickness at root (mm)
- `b` = arm width (mm)
- `E` = Young's modulus (MPa): PLA ≈ 3500, PETG ≈ 2100, Nylon ≈ 2700
- `strain_max` = 0.02 (2%) for PLA, 0.03 for PETG/Nylon (FDM, conservative)

**Rule of thumb**: arm length/thickness ratio 5–10 for ABS/PETG. Shorter = stiffer, higher insertion force. Longer = more flexible, lower break threshold.

### Taper for Snap Retention

Add a 15–30° return angle on the snap hook for permanent retention (disassembly requires tool). Use 45° for easy tool-free removal.

---

## Thread Design for FDM

### Self-Tapping vs Printed Threads

- **M3–M5**: Use heat-set brass inserts (Voron-style) for best durability. Bore = insert OD + 0.0 mm (press-fit, heated install).
- **M6+**: Printed threads are viable. Use ISO coarse pitch. Add 0.2–0.3 mm clearance to minor/major diameters.

### BOSL2 Thread Primitive

```scad
include <../libs/BOSL2/std.scad>
// External thread (bolt)
threaded_rod(d=6, l=20, pitch=1.0);

// Internal thread (nut/tapped hole)
threaded_nut(od=10, id=6, h=8, pitch=1.0);
```

Clearance between mating printed threads: `pitch/10` per flank (0.1 mm for M6×1.0).

---

## Stiffness Estimates for FDM Parts

### Bending Stiffness (Beam)

```
EI = E × (b × h³) / 12   [N·mm²]
deflection = F × L³ / (3 × EI)   [mm]  (cantilever, point load at tip)
```

For a 3 mm × 5 mm PLA beam, 40 mm long, 10 N tip load:
```
EI = 3500 × (3 × 5³) / 12 = 3500 × 31.25 = 109375 N·mm²
δ  = 10 × 40³ / (3 × 109375) ≈ 0.195 mm
```

**FDM correction factor**: reduce `E` by 20–30% for layer-bond weakening in the load direction (use E_eff = 0.75 × E_bulk as a conservative estimate).

### Torsional Stiffness (Solid Round Shaft)

```
GJ = G × π × d⁴ / 32
φ = T × L / GJ   [rad]
```

PLA shear modulus `G ≈ 1300 MPa`. For a Ø8 mm × 30 mm PLA shaft under 100 N·mm torque:
```
GJ = 1300 × π × 8⁴ / 32 ≈ 83 776 N·mm²
φ  = 100 × 30 / 83776 ≈ 0.036 rad ≈ 2°
```

A 2° twist at 30 mm length is acceptable for low-precision mechanisms; not for encoder shafts.

---

## Related

- [`materials.md`](materials.md) — E values, clearance defaults, and FDM-specific property tables.
- [`algorithms.md`](algorithms.md) — CSG strategies for generating gear geometry and thread profiles.
