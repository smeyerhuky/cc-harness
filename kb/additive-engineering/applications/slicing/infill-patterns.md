---

type: "Process"
title: "Infill Patterns"
description: "Slicer and agentic printing techniques"
resource: "Web Synthesis"
tags: ['infill', 'gyroid', 'strength', 'fdm']
timestamp: "2026-07-24"
---

# Infill Patterns

Infill dictates the internal structure of an FDM part. Choosing the right pattern is critical for optimizing strength, weight, and print time.

## Pattern Comparison

1. **Gyroid:** The gold standard for functional parts. It provides nearly equal strength in all directions (isotropic) and avoids nozzle collisions (the nozzle never crosses its own path on the same layer).
2. **Cubic / Triangles:** Excellent for compressive strength and rigidity. These form interlocking 3D lattices.
3. **Lightning / Lines:** The fastest patterns. Lightning infill only generates internal support exactly where needed (under top layers), leaving the rest of the model hollow. Ideal for non-functional large prototypes.
4. **Adaptive Cubic:** Varies density automatically, placing dense support near the walls/roof and sparse support in the core.

## Density Diminishing Returns
For most functional applications, an infill density of **20% to 40%** is sufficient. Beyond 50-60%, you hit diminishing returns in structural strength while drastically increasing print time. Add [Perimeters](slicer-fundamentals.md) instead!
