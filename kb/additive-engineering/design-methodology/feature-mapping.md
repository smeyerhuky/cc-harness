---






type: "Methodology"
title: "Feature Mapping"
description: "Matching specific physical geometries to the optimal CAD modeling commands."
resource: "https://ocw.mit.edu/courses/res-16-002-how-to-cad-almost-anything-january-iap-2024/"
tags: ["modeling", "commands", "strategy"]
timestamp: "2024-01-01"
---

Feature mapping is the methodology of evaluating a physical object's [geometry](../mathematics/geometry.md) and selecting the most efficient CAD operation to recreate it.

While basic commands like "extrude boss," "fillet," and "sweep" are individually simple to learn, the core competency of an engineer lies in knowing *when* to deploy them. 

Common mappings include:
- **Rotational Symmetry (e.g., mouthpieces, cones, cups):** Best modeled using a `Revolve` command.
- **Constant Cross-Sections along a Path (e.g., tubing, wires, pipes):** Best modeled using a `Sweep` command.
- **Prismatic Volumes:** Best modeled using an `Extrude` command.

This strategy relies heavily on [Geometric Decomposition](geometric_decomposition.md), as identifying the underlying primitive shapes within an object dictates the sequence of operations required.
