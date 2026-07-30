---

type: "Architecture"
title: "The Geometry Kernel"
description: "The deterministic C++ engine that calculates 3D geometry."
resource: "agentic_cad_software_architecture.md"
tags: ["kernel", "OpenCASCADE", "C++"]
timestamp: "2026-07-24"
---

# The [Geometry](../mathematics/geometry.md) Kernel (The Engine)

Do not build a B-Rep geometry kernel from scratch. It takes decades to resolve the floating-point errors in Boolean operations.

*   **OpenCASCADE Technology (OCCT)**: The open-source C++ kernel behind FreeCAD and CadQuery. Your agentic software will pass the generated Python/DSL scripts to this kernel to calculate the actual geometry.
*   **CGAL (Computational Geometry Algorithms Library)**: For advanced meshing, Delaunay triangulations, and handling non-manifold data, you pipe specific tasks through CGAL.
*   **WebGPU Compute Kernels**: Modern architectures also offload geometric tasks directly to the GPU using [Compute Geometry Kernels](../webgpu-visualizer/compute-geometry.md) (e.g., parallel prefix sum for accelerated meshing or voxelization).
