---
type: "Code Example"
title: "Homework 4: Advanced Booleans (Hull & Minkowski)"
description: "Practical OpenSCAD implementation example."
resource: "Innate Knowledge"
tags: ['openscad', 'hull', 'minkowski', 'booleans']
timestamp: "2026-07-24"
---

# Advanced Booleans: Hull and Minkowski

While `union`, `difference`, and `intersection` are common, `hull` and `minkowski` are incredibly powerful for creating complex, organic, or filleted shapes.

```openscad
// Hull and Minkowski Examples
$fn = 32;

translate([-30, 0, 0])
    hull_example();

translate([30, 0, 0])
    minkowski_example();

// --- Modules ---
module hull_example() {
    // Hull wraps a convex envelope around all child objects.
    // Great for creating custom brackets or smooth transitions.
    color("cyan")
    hull() {
        cylinder(h=5, r=10);
        translate([20, 30, 0]) cylinder(h=5, r=5);
        translate([-10, 20, 0]) cube([5, 5, 5]);
    }
}

module minkowski_example() {
    // Minkowski sweeps the second child around the perimeter of the first.
    // Extremely useful for rounding edges (filleting) on complex 3D shapes.
    // WARNING: Computationally expensive!
    color("magenta")
    minkowski() {
        cube([20, 20, 10], center=true); // Base shape
        sphere(r=2);                     // Sweeping shape
    }
}
```
