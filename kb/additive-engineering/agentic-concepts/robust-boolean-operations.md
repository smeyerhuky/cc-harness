---

type: "Concept"
title: "Robust Boolean Operations"
description: "Solving floating-point intersection failures with exact arithmetic."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["boolean", "kernel", "BSP"]
timestamp: "2026-07-24"
---

# Robust Boolean Operations & BSP Trees

Floating-point arithmetic (like 0.1 + 0.2 != 0.3) causes standard Boolean [intersection](../geometric-algorithms/intersection.md) algorithms to fail when faces are perfectly co-planar.

*   **Exact Rational Arithmetic**: Kernel algorithms use arbitrary-precision fractions instead of floats to ensure deterministic intersection calculations.
*   **Binary Space Partitioning (BSP) Trees**: A data structure that recursively divides space using hyperplanes, allowing the kernel to definitively classify every point in space as "Inside," "Outside," or "On Boundary" during a Union or Difference operation.
