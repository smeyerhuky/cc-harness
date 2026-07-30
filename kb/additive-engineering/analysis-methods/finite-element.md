---






type: "Model"
title: "Finite Element Method (FEM)"
description: "Discretization method for solving continuum mechanics problems."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["fem", "simulation", "mesh"]
timestamp: "2026-07-24"
---

# Finite Element Method (FEM)

FEM is a numerical technique for finding approximate solutions to boundary value problems for partial differential equations. The core concept is dividing a complex continuous domain into a set of discrete sub-domains (elements), such as tetrahedrons or hexahedrons.

## Workflow
1. **Meshing (Decomposition):** Converting a [B-Rep](../solid-modeling/brep.md) solid into a valid volumetric mesh.
2. **Formulation:** Defining the physical [stiffness](../analysis/stiffness.md) matrices over each element.
3. **Solving:** Assembling the global matrix and solving the linear equations.

## [3D Printing](../applications/3d-printing.md) Context
Before committing to an expensive multi-day 3D print, FEM is used to simulate the structural integrity of the part under load. Since FDM printed parts are highly anisotropic (weaker along the Z-axis layer lines), specialized orthotropic material models must be used in the FEM solver to obtain accurate results.
