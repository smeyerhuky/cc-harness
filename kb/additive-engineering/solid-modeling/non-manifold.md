---






type: "Concept"
title: "Non-Manifold Modeling"
description: "Representations that allow topologies breaking the two-manifold constraint."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["manifold", "topology", "errors"]
timestamp: "2026-07-24"
---

# Non-Manifold Modeling

A **two-manifold** solid guarantees that the neighborhood of every point on the surface is topologically equivalent to a 2D disk. 
A **non-manifold** condition occurs when this rule is broken, such as:
- Two faces sharing a single vertex.
- Three or more faces sharing a single edge.
- A wireframe edge protruding from a solid body.

## [3D Printing](../applications/3d-printing.md) Implications
Most slicer software (Cura, PrusaSlicer) expects strictly two-manifold STL files. Non-manifold [geometry](../mathematics/geometry.md) causes slicing algorithms to fail because they cannot unambiguously determine the "inside" versus the "outside" of the volume. Tools like MeshLab or Netfabb are used to repair non-manifold errors before FDM processing.
