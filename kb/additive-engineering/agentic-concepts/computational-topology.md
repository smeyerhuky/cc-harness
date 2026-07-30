---

type: "Concept"
title: "Computational Topology & Betti Numbers"
description: "Classifying the holes and voids of a mesh using algebraic topology."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["topology", "math", "betti"]
timestamp: "2026-07-24"
---

# Computational Topology & Betti Numbers

The Euler Characteristic ($\chi$) connects the discrete [geometry](../mathematics/geometry.md) of a mesh to its continuous topology via Betti numbers ($\beta_n$):

$\chi = V - E + F = \beta_0 - \beta_1 + \beta_2$

*   $V, E, F$ are the number of Vertices, Edges, and Faces.
*   $\beta_0$ = Number of connected components (usually 1 for a single part).
*   $\beta_1$ = Number of circular holes/tunnels (a donut has $\beta_1 = 1$).
*   $\beta_2$ = Number of enclosed 3D voids/cavities.

Slicers use this topological invariant to verify if a mesh is mathematically "watertight" before attempting to generate G-Code.
