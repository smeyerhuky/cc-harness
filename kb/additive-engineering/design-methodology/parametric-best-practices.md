---




type: "Concept"
title: "Parametric Best Practices"
description: "Core concept from Intro to OpenSCAD"
resource: "Intro to OpenSCAD"
tags: ['design', 'parametric', 'standards']
timestamp: "2026-07-24"
---

# Parametric Best Practices

To ensure scripts remain maintainable, customizable, and robust, strict conventions should be followed.

## Rules of Thumb
* **Make Everything Parametric**: Avoid "magic numbers" in the code. All dimensions should be variables. This allows for later scaling and newbie customization without breaking [geometry](../mathematics/geometry.md).
* **Variable Naming**: Use descriptive, English names (e.g., `box_length`, `wall_thickness`). While single-letter variables (`a`, `b`) make equations look simpler, they become unreadable in large projects.
* **Show Axes**: When designing from scratch, it helps to display or render a visual axis reference to maintain orientation (knowing which way is up for [3D Printing](../applications/3d-printing.md) orientation).
