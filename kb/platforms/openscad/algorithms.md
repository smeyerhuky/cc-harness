---
type: "Reference"
title: "CSG Algorithms and B-Rep Strategies for OpenSCAD"
description: "CSG boolean tree construction, hull and Minkowski patterns, B-Rep export strategies, and performance optimisation for OpenSCAD geometry."
resource: "https://openscad.org/documentation.html"
tags: ["csg", "b-rep", "openscad", "algorithms", "hull", "minkowski", "boolean"]
timestamp: "2026-07-30"
---

# CSG Algorithms and B-Rep Strategies for OpenSCAD

OpenSCAD is a **Constructive Solid Geometry (CSG)** modeller: geometry is defined as a tree of boolean operations (`union`, `difference`, `intersection`) on primitives. Understanding this model avoids common performance and geometry pitfalls.

## CSG Fundamentals

### Boolean Operations

| Operation | OpenSCAD | Semantics |
| :---: | :--- | :--- |
| Union | `union() { A; B; }` | Volume of A **or** B |
| Difference | `difference() { A; B; }` | Volume of A **minus** B |
| Intersection | `intersection() { A; B; }` | Volume of A **and** B |

**Default scope**: children of a module are implicitly `union()`ed. Explicit `union()` is only needed for readability or when mixed with `difference()`.

### CSG Tree Structure

Model complexity is O(n) in the number of boolean operations, but CGAL's exact arithmetic makes it **multiplicative** at each non-trivial step. Structure your tree to minimise depth:

```scad
// BAD — deep sequential differences (O(n) depth, slow rebuild)
difference() {
  difference() {
    difference() { base; hole1; }
    hole2;
  }
  hole3;
}

// GOOD — flat difference tree (single pass)
difference() {
  base;
  hole1;
  hole2;
  hole3;
}
```

**Rule**: Group all subtractive geometry under a single `difference()` with the base solid as the first child.

### `union()` vs Implicit Union

Avoid wrapping additive geometry in explicit `union()` unless you need the group as a named value — OpenSCAD resolves top-level children with implicit union.

```scad
// GOOD — implicit union
module housing() {
  main_body();
  translate([0,0,10]) cap();
}

// Unnecessary — explicit union
module housing() {
  union() {
    main_body();
    translate([0,0,10]) cap();
  }
}
```

---

## `hull()` — Convex Envelope

`hull()` wraps all child volumes in the smallest convex polytope containing them. Useful for organic transitions:

```scad
// Rounded "lofted" shape between two circles
hull() {
  cylinder(r=10, h=0.001);
  translate([0, 0, 20]) cylinder(r=5, h=0.001);
}
```

**Pattern — rounded extrusion body:**
```scad
module rounded_box(size, r) {
  // Place spheres at corners; hull() gives a box with round corners
  x = size[0]/2 - r;
  y = size[1]/2 - r;
  z = size[2]/2 - r;
  hull()
    for (dx=[-x,x], dy=[-y,y], dz=[-z,z])
      translate([dx, dy, dz]) sphere(r=r, $fn=32);
}
```

**Performance note**: `hull()` vertex count = O(points²). Don't pass high-`$fn` cylinders to `hull()` — use `$fn=8` for the intermediate shapes and increase only for the final primitive.

---

## `minkowski()` — Morphological Dilation

`minkowski(A, B)` dilates shape A by the volume of shape B. The resulting volume has A's shape "fattened" by B:

```scad
// Equivalent to rounded_box above but much slower
minkowski() {
  cube([8, 4, 2]);
  sphere(r=1, $fn=16);
}
```

**Rule**: `minkowski()` is O(n × m) on vertex counts and is slow for complex shapes. Prefer BOSL2's `cuboid(rounding=r)`, `cyl(rounding=r)`, or manual `hull()` patterns for all but the simplest use cases.

**Legitimate use of `minkowski()`**: offset profiles by a non-spherical shape (e.g., swell a 2D path by a cylinder to extrude with rounded edges).

---

## Profile Sweeping with `linear_extrude` and `rotate_extrude`

### Linear Extrude

```scad
linear_extrude(height=10, twist=0, slices=1, scale=1.0)
  polygon(points=[[0,0],[5,0],[5,5],[0,5]]);
```

- `twist` (degrees): helical extrusion — use `slices` ≥ `|twist|/3` for smooth result.
- `scale`: taper from base (1.0) to top (scale value).
- Profile must be a 2D shape (polygon, circle, import .svg/.dxf).

### Rotate Extrude

```scad
rotate_extrude(angle=360, $fn=64)
  translate([5, 0]) circle(r=2);  // Creates a torus
```

The 2D profile is swept around the Z axis. Profile **must not cross X=0**.

---

## Projection — 2D Cross-Sections for Measurement

To extract a flat cross-section for aperture measurement (input to `measure_aperture.py`):

```scad
// Place this at the top level of a dedicated measurement file
// or pass via -D on the command line
projection(cut=true)
  rotate([90, 0, 0])      // rotate so the cut plane hits the feature of interest
    my_assembly();
```

Export to DXF:
```bash
openscad -o stl/bore_section.dxf measurement_projection.scad
```

The DXF can then be measured by `measure_aperture.py`.

---

## Modular B-Rep Export Strategy

OpenSCAD does not natively produce NURBS/B-Rep STEP. For tessellated STEP export:

1. Export each part as STL from OpenSCAD.
2. Use `FreeCAD` CLI or `Open3D` to convert STL → STEP (tessellated, not parametric):
   ```bash
   freecad --run-script convert_to_step.py  # see below
   ```
3. Or use `meshlabserver` / `MeshLab` for mesh-to-STEP via VTK.

**FreeCAD CLI conversion** (requires FreeCAD ≥ 0.20):
```python
# convert_to_step.py (run with: freecad --run-script convert_to_step.py)
import FreeCAD, Part, Mesh

def stl_to_step(stl_path: str, step_path: str):
    mesh = Mesh.Mesh(stl_path)
    shape = Part.Shape()
    shape.makeShapeFromMesh(mesh.Topology, 0.1)
    shape.exportStep(step_path)

import sys, pathlib
for stl in pathlib.Path("stl").glob("*.stl"):
    stl_to_step(str(stl), f"step/{stl.stem}.step")
FreeCAD.closeDocument(FreeCAD.ActiveDocument.Name)
```

---

## Performance Optimisation

### Preview vs Render

OpenSCAD has two modes:
- **Preview (F5)**: fast but uses OpenCSG (screen-space approximation) — may show artefacts.
- **Render (F6)**: slow but exact CGAL mesh — use for export.

Always check the CGAL-rendered result before exporting, not just the preview.

### Reducing Render Time

| Technique | Savings |
| :--- | :--- |
| Use `$fn=32` during development; `$fn=128` only at export | 10–50× |
| Flat boolean trees (single `difference()`) | 2–5× |
| Avoid nested `minkowski()` | Up to 100× |
| `render()` wrapper caches expensive sub-trees | Significant for repeated modules |
| Split large assemblies into separate files, render individually | Linear per-part |

```scad
// Cache an expensive sub-tree so it isn't recomputed for each instance
module expensive_part() {
  render()   // forces CGAL evaluation and caches result
  difference() { ... complex geometry ... }
}
```

### The `render()` Wrapper

`render()` forces CGAL evaluation of its children and caches the result. Use around expensive sub-trees that appear multiple times in an assembly:

```scad
module gear_tooth_profile() {
  render() {
    // expensive booleans
  }
}
// Called 20 times in spur_gear — without render(), evaluated 20×; with, evaluated once.
```

---

## Common CSG Anti-Patterns

| Anti-pattern | Problem | Fix |
| :--- | :--- | :--- |
| Coplanar faces in union/difference | Non-deterministic CGAL artefacts | Overlap by 0.001 mm |
| `minkowski()` on complex meshes | Render takes hours | Use `hull()` + BOSL2 rounding |
| Deep sequential `difference()` trees | O(n) slow rebuild | Flatten to single `difference()` |
| High `$fn` on objects passed to `hull()` | Explodes vertex count | Use low-`$fn` for intermediate shapes |
| Geometry outside the positive XYZ octant | Confuses some exporters | Centre at origin during modelling, translate for export |
| Recursive module without depth guard | Infinite recursion / crash | Add `if (depth > 0)` guard |

---

## Related

- [`materials.md`](materials.md) — minimum feature sizes that constrain CSG geometry.
- [`mechanics.md`](mechanics.md) — gear and thread primitives that use these CSG patterns.
- `scad-design-to-print` skill → `references/scad-syntax-gotchas.md` — `hull()`, `minkowski()`, and boolean anti-patterns from the OpenSCAD syntax perspective (skill reference, outside KB bundle).
