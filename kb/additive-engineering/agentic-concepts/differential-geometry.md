---

type: "Concept"
title: "Differential Geometry & Curvature Tensors"
description: "The mathematics of Gaussian and Mean curvature for surface analysis."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["math", "geometry", "curvature"]
timestamp: "2026-07-24"
---

# Differential [Geometry](../mathematics/geometry.md) & Curvature Tensors

Curvature dictates how surfaces behave under deformation, offset, and meshing.

*   **Principal Curvatures ($\kappa_1, \kappa_2$)**: The maximum and minimum bending of a surface at a specific point.
*   **Gaussian Curvature ($K$)**: Defined as $K = \kappa_1 \cdot \kappa_2$. By Gauss’s *Theorema Egregium*, $K$ is intrinsic (it doesn't change if you bend the surface without stretching it). You cannot perfectly flatten a sphere ($K > 0$) onto a plane ($K = 0$) without tearing or stretching.
*   **Mean Curvature ($H$)**: Defined as $H = 0.5(\kappa_1 + \kappa_2)$. *Minimal Surfaces* (like soap films spanning a wire frame) are defined by the strict mathematical condition $H = 0$ everywhere, minimizing surface area for a given boundary.
