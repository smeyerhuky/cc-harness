---






type: "Concept"
title: "Exact Constraint Design"
description: "Principles for perfectly constraining mechanical bodies without fighting."
resource: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/"
tags: ["constraints", "kinematics", "degrees-of-freedom"]
timestamp: "2026-07-24"
---

# Exact Constraint Design

Constraints are fundamental to mechanical design. An ideal constraint is represented as a line of action.

## 6 - C = R
A rigid body has 6 degrees of freedom (DOF). 
- **C** = Number of linearly independent constraints.
- **R** = Number of independent DOF remaining.

## Under, Exact, and Over Constraint
- **Exact Constraint:** There is exactly one constraint for each DOF that needs to be restricted. Parts fit together perfectly without binding.
- **Under Constraint:** Too few constraints; the part has unwanted DOF.
- **Over Constraint:** Too many constraints. The constraints will "fight" each other, leading to binding, high assembly forces, or premature failure when thermal expansion occurs (see [Bearings](../mechanisms/bearings-and-spindles.md)).

## Rule of Complimentary Patterns
Each permissible freedom (rotation about a line) must intersect each constraint line. Parallel lines intersect at infinity (translations are rotations with an infinite radius).
