---






type: "Concept"
title: "Boundary Representation (B-Rep)"
description: "Modeling solids by explicitly storing their bounding topology and geometry."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["brep", "topology", "geometry"]
timestamp: "2026-07-24"
---

# Boundary Representation (B-Rep)

B-Rep describes a solid explicitly by its enclosing boundaries. 
A B-Rep model consists of two connected data structures:
1. **Topology:** Vertices, Edges, Faces, and Loops. This defines how the elements are connected (adjacency).
2. **[Geometry](../mathematics/geometry.md):** Coordinates for vertices, curves for edges, and equations/splines for faces.

## Euler-Poincaré Formula
To guarantee that a B-Rep object is a valid, closed 2-manifold solid, its topology must satisfy the Euler-Poincaré characteristic:
$$ V - E + F = 2 (S - G) $$
Where $V$ is vertices, $E$ is edges, $F$ is faces, $S$ is shells (independent components), and $G$ is the genus (number of through-holes).

## Exporting
STEP and IGES files are standard B-Rep formats. To 3D print a B-Rep model, the faces are triangulated and converted into an STL file, which is a very simple, [geometry](../mathematics/geometry.md)-only polygon mesh format.
