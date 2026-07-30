---

type: "Algorithm"
title: "The Adjoint State Method"
description: "Efficiently calculating gradients for topology optimization."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["optimization", "algorithms", "topology"]
timestamp: "2026-07-24"
---

# The Adjoint State Method (Topology Optimization)

To computationally design the optimal shape of a part (Inverse Design), we define an objective function $\mathcal{J}$ (e.g., maximize [stiffness](../analysis/stiffness.md)) subject to constraints.

Using standard finite differences to calculate the gradient of $\mathcal{J}$ with respect to the million voxels of the part would require a million FEA simulations.

**The Adjoint Method**: By introducing *adjoint variables* and solving an adjoint equation backward in time/space, the exact gradient of the objective function with respect to all million design variables is computed simultaneously in just *two* FEA solves (one forward, one adjoint). The density of the mesh is then updated iteratively until it forms an optimal, alien-looking organic structure.
