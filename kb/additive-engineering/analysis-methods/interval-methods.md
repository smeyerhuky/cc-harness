---






type: "Algorithm"
title: "Interval Methods"
description: "Arithmetic treating variables as ranges rather than single values."
resource: "Computational Geometry - MIT OCW 2.158J"
tags: ["interval", "arithmetic", "bounding"]
timestamp: "2026-07-24"
---

# Interval Methods

Interval arithmetic replaces standard floating-point numbers with intervals $[a, b]$ representing the lower and upper bounds of a value. 

For addition:
$$ [a, b] + [c, d] = [a+c, b+d] $$

## Application in [Geometry](../mathematics/geometry.md)
Interval methods provide guaranteed bounds for numerical root-finding and non-linear solver algorithms. By evaluating a bounding box of a spline patch using interval arithmetic, we can definitively prove if an [intersection](../geometric-algorithms/intersection.md) *does not* exist within a region, allowing rapid pruning of spatial trees.
