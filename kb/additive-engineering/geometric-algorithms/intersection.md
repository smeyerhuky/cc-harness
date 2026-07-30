---






type: "Algorithm"
title: "Intersection Problems"
description: "Computing the locus of points common to multiple geometric entities."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["intersection", "curves", "surfaces"]
timestamp: "2026-07-24"
---

# Intersection Problems

Intersection computations are the most computationally intensive operations in solid modeling (especially in evaluating [CSG](../solid-modeling/csg.md) boundaries).

## Surface-Surface Intersection (SSI)
The intersection of two continuous surfaces $S_1(u,v)$ and $S_2(s,t)$ yields an intersection curve. Common methodologies include:
1. **Analytic:** Used for primitive shapes (plane-plane, sphere-cylinder).
2. **Lattice/Subdivision:** Recursively subdividing the patches using bounding boxes until they are planar enough to approximate as triangles, then intersecting the triangles.
3. **Marching/Tracing:** Finding a single intersection point and numerically tracing the curve by stepping along the cross-product of the two surface normals.
