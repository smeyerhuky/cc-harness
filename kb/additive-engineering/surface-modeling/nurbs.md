---






type: "Concept"
title: "NURBS"
description: "Non-Uniform Rational B-Splines for representing exact conic sections and free-form surfaces."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["curves", "nurbs", "conics"]
timestamp: "2026-07-24"
---

# Non-Uniform Rational [B-Splines](../surface-modeling/b-splines.md) (NURBS)

NURBS are a generalization of [B-Splines](b-splines.md) that introduce a weight $w_i$ associated with each control point. This rational formulation allows the exact representation of conic sections (circles, ellipses, parabolas) which polynomial [B-splines](../surface-modeling/b-splines.md) can only approximate.

## Mathematical Formulation
$$ C(t) = \frac{\sum_{i=0}^{n} w_i P_i N_{i,p}(t)}{\sum_{i=0}^{n} w_i N_{i,p}(t)} $$

## In OpenSCAD
OpenSCAD natively relies on polygonal meshes and [Constructive Solid Geometry](../solid-modeling/csg.md), lacking native NURBS support. Complex curved surfaces in OpenSCAD are generally handled by linear extrusions, rotational [sweeps](../surface-modeling/sweeps.md), or polyhedron definitions based on discrete points.
