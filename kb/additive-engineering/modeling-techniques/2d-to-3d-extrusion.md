---




type: "Concept"
title: "2D to 3D Extrusion"
description: "Core concept from CodeSolutions"
resource: "CodeSolutions"
tags: ['modeling', '2d', 'extrusion']
timestamp: "2026-07-24"
---

# 2D to 3D Extrusion

Often, the most efficient way to build a 3D object is by defining a 2D profile and extruding it.

## Methods
* **2D Primitives**: `square`, `circle`, `polygon`.
* **Linear Extrude**: `linear_extrude(height = h)` pushes a 2D shape straight up the Z-axis. It supports `twist` and `scale` for creating helical or tapered forms (e.g., vase generation).
* **Rotate Extrude**: `rotate_extrude()` [sweeps](../surface-modeling/sweeps.md) a 2D profile around the Z-axis. It is the primary tool for creating axis-symmetric parts like pulleys, flanges, or parabolic reflectors.
