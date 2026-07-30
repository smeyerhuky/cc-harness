---

type: "Process"
title: "Monotonic Surfaces"
description: "Slicer and agentic printing techniques"
resource: "Web Synthesis"
tags: ['monotonic', 'aesthetic', 'surface-finish', 'rectilinear']
timestamp: "2026-07-24"
---

# Monotonic and Directional Layers

Surface finish on the top and bottom layers of an FDM print is dictated by the toolpath planning of the slicer.

## Monotonic Order
Standard fill algorithms often cause the nozzle to jump around, filling in gaps from different directions. This creates visible "scars" and inconsistent light reflection (seams) on flat surfaces.
**Monotonic infill** forces the slicer to print adjacent lines in a single, consistent direction (e.g., strictly left-to-right). This yields a perfectly smooth, uniform top/bottom surface finish without directionality artifacts.

## Aligned Rectilinear
While Monotonic ensures a smooth aesthetic for a single face, **Aligned Rectilinear** forces *every single layer* in the print to use the exact same directional angle (e.g., 0° or 90°). 
* **Use Case (Transparency):** By setting Top/Bottom layers to 0 and using 100% Aligned Rectilinear infill, all plastic is laid down in the exact same orientation. This is the secret technique for printing highly transparent parts (like glass-like PETG).
