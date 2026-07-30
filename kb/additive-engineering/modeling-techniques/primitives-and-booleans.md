---




type: "Concept"
title: "Primitives and Booleans"
description: "Core concept from Intro to OpenSCAD / CodeSolutions"
resource: "Intro to OpenSCAD / CodeSolutions"
tags: ['modeling', 'primitives', 'csg']
timestamp: "2026-07-24"
---

# Primitives and Booleans

[Constructive Solid Geometry](../solid-modeling/csg.md) (CSG) relies on the combination of basic shapes.

## Foundation
* **Primitives**: 
  * `cube([x, y, z], center=true/false)`
  * `cylinder(h, r1, r2, center)`
  * `sphere(r, $fn)`
* **Resolution (`$fn`)**: Curves in OpenSCAD are faceted. The `$fn` variable defines the number of fragments. High `$fn` yields smooth prints but slows down rendering.
* **Boolean Operations**: `union()`, `difference()`, and `[intersection](../geometric-algorithms/intersection.md)()` merge primitives. 
* **Debugging**: In complex differences, use `%` (background modifier) or `#` (debug modifier) to highlight the negative space being subtracted.
