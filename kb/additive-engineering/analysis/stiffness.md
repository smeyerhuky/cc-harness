---






type: "Model"
title: "Stiffness and Superposition"
description: "Fundamental stiffness models for mechanical design."
resource: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/"
tags: ["stiffness", "deflection", "superposition", "springs"]
timestamp: "2026-07-24"
---

# Stiffness and Superposition

Mechanical devices are modeled as networks of high, medium, and low stiffness springs. 

## Key Stiffness Equations
- **Axial Stiffness:** $k_{axial} = \frac{A E}{L}$
- **Torsional Stiffness:** $k_{\theta} = \frac{J G}{L}$
- **Lateral Bending (Cantilever):** $k_{lateral} = \frac{3 E I}{L^3}$

## Stiffness Ratios
To simplify modeling, calculate the stiffness ratio between components in a load path. If $k_1 \gg k_2$ in a series circuit, $k_1$ can be treated as rigid.

## Superposition
Superposition allows complex loads to be broken into independent simple loads and summed. It requires:
1. Linear cause and effect (Hooke's Law).
2. No coupling between loads.
3. Deflections are small enough that the global [geometry](../mathematics/geometry.md)/load orientation doesn't change significantly.

Note: Non-conformal contacts (like Hertzian contact in bearings) are non-linear ($k \propto F^{1/3}$). You must linearize them around the operating point to use superposition.
