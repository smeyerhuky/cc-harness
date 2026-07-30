---

type: "Concept"
title: "Isogeometric Analysis (IGA)"
description: "Eliminating meshing errors by using NURBS directly in FEA."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["FEA", "simulation", "NURBS"]
timestamp: "2026-07-24"
---

# Isogeometric Analysis (IGA)

Standard [Finite Element](../analysis-methods/finite-element.md) Analysis (FEA) approximates smooth CAD ([NURBS](../surface-modeling/nurbs.md)) with a faceted mesh. IGA uses the exact NURBS basis functions for the physical simulation.

Instead of computing [stiffness](../analysis/stiffness.md) matrices over discrete triangles, IGA integrates over the exact parametric domain, completely eliminating geometric discretization error and allowing exact simulation of stresses on perfectly curved boundaries.
