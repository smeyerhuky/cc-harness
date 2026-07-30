---




type: "Concept"
title: "Animation"
description: "Core concept from Mastering OpenSCAD"
resource: "Mastering OpenSCAD"
tags: ['animation', 'time', 'motion']
timestamp: "2026-07-24"
---

# Animation

OpenSCAD provides a built-in animation system to visualize moving parts, such as gears, clock movements, or hinges.

## The `$t` Variable
* **Mechanism**: The global variable `$t` [sweeps](../surface-modeling/sweeps.md) from 0.0 to 1.0. 
* **Implementation**: By tying rotations or translations to `$t` (e.g., `rotate([0, 0, 360 * $t])`), the GUI will render frames sequentially, creating a visual animation.
* **Export**: The GUI allows exporting the animation as a series of PNG images (image sequence), which can later be combined into a GIF or video for documentation.
