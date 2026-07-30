---
type: "Reference"
title: "OpenSCAD Syntax Gotchas"
description: "Common mistakes and non-obvious rules in OpenSCAD: use vs include semantics, geometry variables, $fn placement, scope, and export commands."
resource: "https://openscad.org/documentation.html"
tags: ["openscad", "scad", "syntax", "pitfalls", "best-practices"]
timestamp: "2026-07-30"
---

# OpenSCAD Syntax Gotchas

OpenSCAD is not a general-purpose programming language. It has several unintuitive behaviours that cause silent geometry errors or incorrect output. Read this before writing `.scad` files.

## 1. `use` vs `include`

These are **not** equivalent:

| Statement | What it does |
| :--- | :--- |
| `use <file.scad>` | Imports **only module and function definitions**. Top-level geometry (bare `cube()`, `sphere()`, etc.) in the imported file is **silently ignored**. |
| `include <file.scad>` | Executes the entire file inline — definitions **and** geometry. Variables defined at top level in the imported file are also imported into the current scope. |

**Rule**: Use `use` for library files (BOSL2, your own utility modules). Use `include` only when you explicitly want to inherit variables from another file (e.g., `include <config.scad>`).

**Gotcha**: BOSL2's `std.scad` must be `include`d (not `use`d) because it sets up constants and calls `include` chains internally:
```scad
include <../libs/BOSL2/std.scad>  // correct
use <../libs/BOSL2/std.scad>      // WRONG — BOSL2 primitives won't work
```

## 2. Geometry Variables Are Evaluated at Render Time, Not Parse Time

OpenSCAD uses a "last write wins in the same scope" rule for variables (it's a functional, not imperative language):

```scad
x = 1;
x = 2;   // x IS 2 — no "redeclare" error, last assignment wins globally
cube(x); // renders a 2×2×2 cube
```

**But child modules inherit the parent scope at call time:**
```scad
x = 10;
module foo() { cube(x); }

x = 20;  // This reassignment applies EVERYWHERE in this scope
foo();   // Renders a 20×20×20 cube, not 10×10×10
```

**Rule**: Never rely on variable mutation to pass context to modules. Use module parameters instead:
```scad
module foo(size=10) { cube(size); }
foo(size=20);
```

## 3. `$fn`, `$fa`, `$fs` — Special Variables

`$fn` (fragment number), `$fa` (minimum angle), `$fs` (minimum size) control sphere/cylinder tessellation.

**Rule 1**: Set `$fn` inside the call, not globally in production files:
```scad
// Good — local override
cylinder(r=5, h=10, $fn=64);

// Avoid — sets global default, affects all subsequent geometry
$fn = 64;
```

**Rule 2**: A global `$fn` in `config.scad` is acceptable **only** if it's the single source of truth and every call site inherits it. Document this clearly.

**Rule 3**: High `$fn` values (≥ 128) dramatically increase render time for boolean operations. Use `$fn=32` for preview, `$fn=128` for final export.

**Rule 4**: `$fn = 0` means "use `$fa` and `$fs` to determine count". Default `$fa=12`, `$fs=2`.

## 4. Boolean Operations and Coplanar Faces

OpenSCAD uses CGAL for CSG booleans. **Coplanar faces cause non-deterministic results** (flickering in preview, geometry errors in export):

```scad
// BAD — the top face of cube A is coplanar with the bottom of cube B
union() {
  cube([10, 10, 5]);
  translate([0, 0, 5]) cube([10, 10, 5]);
}

// GOOD — overlap by epsilon to avoid coplanar faces
union() {
  cube([10, 10, 5.001]);
  translate([0, 0, 5]) cube([10, 10, 5]);
}
```

**Rule**: When unioning parts that share a face, overlap by `0.001` mm in the joining direction. For `difference()`, extend the cutting object `0.001` past both surfaces it should cut through.

```scad
// Cutting object for difference — extend past both surfaces
difference() {
  cube([10, 10, 10]);
  translate([3, 3, -0.001])
    cube([4, 4, 10.002]);  // −0.001 below, +0.001 above
}
```

## 5. `children()` and Module Children

Modules receive child geometry via `children()`:

```scad
module centered_on_top(offset=0) {
  children();                          // place at origin
  translate([0, 0, offset]) children(); // copy on top
}

centered_on_top(offset=5) sphere(r=2); // passes sphere as child
```

**Gotcha**: `children()` can only be called inside a module. Calling it at top level is an error.

**Multiple children**: Use `children(0)`, `children(1)`, etc. to select individual children. `$children` holds the count.

## 6. `hull()` and `minkowski()` Are Expensive

`hull()` computes the convex hull of all child geometry — O(n log n) on vertex count. `minkowski()` is O(n²) and should be used sparingly.

**Rule**: For rounded boxes, prefer BOSL2's `cuboid(rounding=r)` over `minkowski(cube(...), sphere(...))` — it's orders of magnitude faster.

## 7. Export Commands (CLI)

```bash
# STL export (binary, mm units)
openscad -o output.stl input.scad

# PNG render (headless — always use xvfb-run on servers)
xvfb-run -a openscad \
  --camera=<tx>,<ty>,<tz>,<rx>,<ry>,<rz>,<dist> \
  --imgsize=1920,1080 \
  -o render.png input.scad

# DXF projection for aperture measurement
# Add to your .scad file, then export:
#   projection(cut=true) rotate([90,0,0]) my_part();
openscad -o section.dxf input.scad   # when file top-level IS the projection

# Pass parameters on the command line (override config.scad values)
openscad -D 'bore_dia=8.0' -o output.stl input.scad
```

**Camera parameters** `--camera=tx,ty,tz,rx,ry,rz,dist`:
- `tx,ty,tz` = look-at translation (use bounding box centre of your model)
- `rx,ry,rz` = camera rotation (55,0,25 = standard isometric-ish)
- `dist` = distance (try 2.5× the largest model dimension)

## 8. Recursive Modules Require `$depth` Guard

OpenSCAD will recurse infinitely without a depth guard:

```scad
module fractal(depth=5) {
  if (depth > 0) {
    cube(depth);
    translate([depth+1, 0, 0]) fractal(depth=depth-1);
  }
}
```

## 9. `assert()` for Spec Verification

Use built-in `assert()` to enforce spec constraints at parse time:

```scad
include <config.scad>
assert(bore_dia >= 3.0, "bore_dia must be ≥ 3 mm for printability");
assert(wall_thickness >= 1.2, "wall too thin — minimum 1.2 mm");
```

`assert()` errors are surfaced in the OpenSCAD console and cause CLI to exit non-zero — use this in combination with `verify.py`.

## 10. BOSL2 Attachment System

BOSL2's `attach()` replaces manual `translate()` + `rotate()` for placing child geometry on named anchor points:

```scad
include <../libs/BOSL2/std.scad>

cuboid([20, 10, 5])
  attach(TOP, BOTTOM) sphere(r=3);  // sphere sits on top face
```

**Gotcha**: BOSL2 anchors use `+z = TOP`, `−z = BOTTOM`, etc. Your custom modules must call `attachable()` to gain this feature — plain OpenSCAD modules are not attachable without wrapping.

## Related

- [`bambu-3mf-spec.md`](bambu-3mf-spec.md) — export pipeline from OpenSCAD to Bambu `.3mf`.
- [`../../../kb/platforms/openscad/algorithms.md`](../../../kb/platforms/openscad/algorithms.md) — CSG boolean tree strategies.
- [`../../../kb/platforms/openscad/materials.md`](../../../kb/platforms/openscad/materials.md) — print settings that affect geometry choices.
