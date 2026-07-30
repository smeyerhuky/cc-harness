---






type: "Concept"
title: "Sweeps and Generalized Cylinders"
description: "Generating 3D volumes by sweeping a 2D cross-section along a trajectory."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["sweeps", "extrusion", "cad"]
timestamp: "2026-07-24"
---

# Sweeps and Generalized Cylinders

Sweeping is a fundamental generative modeling operation. A 2D contour is translated or rotated through space to form a 3D solid or surface.

## Types of Sweeps
1. **Translational Sweep (Extrusion):** Moving a profile along a linear vector. (e.g., `linear_extrude` in OpenSCAD).
2. **Rotational Sweep:** Revolving a profile around an axis. (e.g., `rotate_extrude` in OpenSCAD).
3. **Generalized Cylinder (Sweep along a Path):** Moving a cross-section along a generalized 3D space curve, often with varying scale or twist.

## Manufacturing Constraints
Sweeps form the basis of most prismatic and revolved machine parts. When [3D printing](../applications/3d-printing.md) a sweep, the alignment of the sweep axis with the print bed (Z-axis) heavily influences the part's strength due to layer adhesion anisotropy.
