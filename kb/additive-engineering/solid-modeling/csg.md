---






type: "Concept"
title: "Constructive Solid Geometry (CSG)"
description: "Modeling solids through Boolean operations on geometric primitives."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["csg", "boolean", "trees"]
timestamp: "2026-07-24"
---

# Constructive Solid [Geometry](../mathematics/geometry.md) (CSG)

CSG represents a solid as a binary tree. The leaf nodes are rigid volumetric primitives (cubes, spheres, cylinders, cones), and the internal nodes are boolean operators (Union, [Intersection](../geometric-algorithms/intersection.md), Difference) or rigid body transformations (translate, rotate).

## Characteristics
- **Validity:** CSG models are always valid, closed solids (assuming valid primitives).
- **Unevaluated:** The tree is a recipe. The actual boundaries must be computed dynamically when rendering or exporting.

## OpenSCAD and FDM
CSG is the native paradigm of OpenSCAD. In FDM printing, boolean differences are used extensively to create holes and negative spaces. To avoid non-manifold artifacts ("zero-thickness walls") in CSG difference operations, the subtracted primitive must slightly overlap the boundaries of the base part.
