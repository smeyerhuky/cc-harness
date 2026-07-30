---

type: "Process"
title: "Slicer Fundamentals"
description: "Slicer and agentic printing techniques"
resource: "Web Synthesis"
tags: ['slicer', 'g-code', 'fdm', 'layer-height']
timestamp: "2026-07-24"
---

# Slicer Fundamentals

Slicing software converts a 3D mesh (STL/3MF) into G-code, balancing trade-offs between **quality, speed, and structural strength**.

## Core Parameters

* **Layer Height:** Dictates resolution along the Z-axis. Lower heights (0.1mm) yield smooth finishes but increase print time. Higher heights (0.2-0.3mm) are faster but produce visible stair-stepping. A common baseline is 50% of the nozzle diameter.
* **Perimeters (Walls):** The number of outer shells. **Increasing wall count is significantly more effective for adding structural strength than increasing infill.** For load-bearing parts, 3-5 perimeters are recommended.
* **Temperature:** Proper nozzle temperature ensures polymer chains fuse (see [Reptation Theory](../../polymer-physics/reptation-theory.md)). Too high causes stringing; too low causes delamination. Bed temperature prevents warping by managing thermal strain.
* **Print Speed:** Determines volumetric flow rate. Excessive speed leads to under-extrusion or ringing artifacts if the kinematics cannot keep up.
