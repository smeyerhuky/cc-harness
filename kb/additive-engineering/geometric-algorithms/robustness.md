---






type: "Concept"
title: "Robustness and Floating Point Issues"
description: "Managing topological inconsistencies caused by finite precision arithmetic."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["robustness", "floating-point", "epsilon"]
timestamp: "2026-07-24"
---

# Robustness of Geometric Computations

Geometric algorithms often fail due to inconsistencies between topological decisions and floating-point geometric evaluations. If a point is calculated to lie exactly *on* a plane, round-off errors might classify it as slightly *inside* or *outside*.

## Strategies
1. **Epsilon Tolerances:** Defining a small threshold $\epsilon$ where values are considered equal. This can lead to cascading errors if untracked.
2. **Exact Arithmetic:** Using rational numbers of arbitrary precision. This guarantees consistency but is extremely slow.
3. **[Interval Methods](../analysis-methods/interval-methods.md):** Tracking the upper and lower bounds of a floating-point calculation. (See [Interval Methods](../analysis-methods/interval-methods.md)).

Robustness failures in CAD software often manifest as "Boolean operation failed" errors when dealing with coincident or nearly-coincident faces.
