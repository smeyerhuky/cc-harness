---






type: "Mechanism"
title: "Bearings and Spindles"
description: "Rules for bearing layouts, preload, and handling thermal growth."
resource: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/"
tags: ["bearings", "spindles", "thermal-growth", "preload"]
timestamp: "2026-07-24"
---

# Bearings and Spindles

Bearings control the [Degrees of Freedom](../joints-and-constraints/exact-constraint.md) of rotating [shafts](../mechanisms/shafts.md).

## Bearing Layouts
A properly constrained spindle must avoid over-constraint, particularly under thermal loads. 
- **Thermal Growth:** [Shafts](../mechanisms/shafts.md) typically get hotter than housings because housings dissipate heat better. 
- A standard "good" layout constraints one bearing set axially and radially, while the other bearing set is constrained **only radially**. This allows the shaft to expand axially without destroying the bearings.

## Preload
Applying a preload removes slop and increases the apparent [stiffness](../analysis/stiffness.md) of the bearing assembly. However, incorrect constraints (like a double face-to-face constraint with thermal expansion) will exponentially increase the preload until failure.
