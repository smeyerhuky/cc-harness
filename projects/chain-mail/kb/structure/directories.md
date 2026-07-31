---
type: "Reference"
title: "Project Directory Structure"
description: "Directory and file layout of the chain-mail project as of M1/M2."
resource: "../../README.md"
tags: ["structure", "directories", "project", "scad"]
timestamp: "2026-07-30"
---

# Project Directory Structure

Chain Mail follows the playground project structure plus the `scad-design-to-print` deliverable
tree.

## Layout

```
projects/chain-mail/
│
├── src/                         # OpenSCAD source
│   ├── config.scad              # single source of truth for all numbers
│   ├── ring.scad                # parametric torus ring (field + crease variants)
│   ├── coupon.scad              # M1 print-in-place linked pair (opposite tilt)
│   └── coupon_plate.scad        # M1 test plate (3 gap pairs)
│
├── spec/
│   ├── SPEC.md                  # FROZEN specification
│   └── fit_checks.json          # automated clearance checks for verify.py
│
├── tools/                       # verification scripts (+ linking_number.py)
├── stl/                         # exported meshes (pairs + plate)
├── renders/                     # iso / top / section PNGs
│
├── kb/                          # this knowledge base
│   ├── index.md                 # KB entry point (okf_version)
│   ├── overview/  design/  findings/  process/  structure/
│
├── DESIGN_REPORT.md             # per-milestone engineering log
├── CLAUDE.md   README.md   version.json
└── (libs/BOSL2 vendored, gitignored)
```

## Key files

- **`src/config.scad`** — every parameter; edit here, not in downstream files.
- **`spec/SPEC.md`** — frozen requirements; see the [spec summary](../design/spec-summary.md).
- **`tools/linking_number.py`** — Gauss linking-number gate (proves interlink).
- **`DESIGN_REPORT.md`** — measured results and decisions per milestone.

## Related

- [About Chain Mail](../overview/about.md) · [Geometry & configuration](../design/geometry-and-config.md)
- [Repository Architecture](../../../../kb/architecture/directory-structure.md)
