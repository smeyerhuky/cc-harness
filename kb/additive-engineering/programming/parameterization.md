---





type: "Concept"
title: "Parameterization and Variables"
description: "Core concept from Mastering OpenSCAD within 10 projects"
resource: "Mastering OpenSCAD within 10 projects"
tags: ['coding', 'parameters', 'design']
timestamp: "2026-07-24"
---

# Parameterization

Parameterization is the practice of defining geometric dimensions and relationships using variables rather than hard-coded constants.

## Principles of Parametric Design
* **Variables**: Dimensions such as length, width, radius, and wall thickness should be declared as variables at the top of a script or in a configuration file.
* **Dependencies**: Features of a model should be defined relative to one another. For example, a hole's diameter might be defined as a fraction of the overall width, ensuring that scaling the model maintains proportional integrity.
* **Modules**: Reusable blocks of code (modules) accept parameters as arguments, allowing for the instantiation of multiple variations of a part without code duplication.
* **Customizability**: A fully parameterized model can be instantly adapted to different constraints, a critical requirement for generating [3D printing](../applications/3d-printing.md) components for various hardware configurations.
