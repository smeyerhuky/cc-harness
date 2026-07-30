---






type: "Algorithm"
title: "Octrees"
description: "Spatial partitioning data structure recursively dividing 3D space."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["spatial", "trees", "subdivision"]
timestamp: "2026-07-24"
---

# Octrees

An octree is a hierarchical, volume-based representation where a cubic volume of space is recursively subdivided into eight smaller octants. 

Nodes are classified as:
- **Black:** Completely inside the object.
- **White:** Completely outside the object.
- **Gray:** Intersects the object boundary (requires further subdivision).

## Applications
Octrees are heavily used for accelerating collision detection, generating [Finite Element Analysis](../analysis-methods/finite-element.md) meshes, and boolean evaluations in [CSG](../solid-modeling/csg.md). They provide a rapid, approximate way to evaluate integral properties like mass and volume.
