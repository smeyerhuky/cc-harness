---






type: "Concept"
title: "B-Splines"
description: "Basis splines providing local control for curve and surface representation."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["curves", "splines", "basis", "local-control"]
timestamp: "2026-07-24"
---

# B-Splines (Basis Splines)

A B-spline curve is a piecewise polynomial curve defined by a set of control points, a knot vector, and a degree. Unlike global Bezier curves, B-splines offer local control: moving a single control point only affects a specific segment of the curve.

## Mathematical Formulation
A B-spline curve of degree $p$ is defined as:
$$ C(t) = \sum_{i=0}^{n} P_i N_{i,p}(t) $$
Where $P_i$ are the control points and $N_{i,p}(t)$ are the B-spline basis functions, defined recursively over a knot vector $U = \{u_0, u_1, ..., u_m\}$.

## CAD & [3D Printing](../applications/3d-printing.md) Context
When exporting B-spline surfaces to STL formats for FDM printing, the smooth mathematical representation is triangulated (tessellated). A low-resolution tessellation results in a faceted surface on the printed object. High-end CAD tools allow setting the chordal deviation to control this triangulation.
