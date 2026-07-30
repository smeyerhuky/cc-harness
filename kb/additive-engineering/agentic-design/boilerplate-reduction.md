---



type: "Concept"
title: "Boilerplate Reduction"
description: "Core concept from agentcad Concepts"
resource: "agentcad Concepts"
tags: ['prompting', 'context', 'efficiency']
timestamp: "2026-07-24"
---

# Boilerplate Reduction

LLM context windows and output token limits are constrained. Optimizing the script environment reduces hallucinations and syntax errors.

## Implicit Contexts
* **Pre-injected Primitives**: By implicitly exposing underlying CAD libraries (like build123d or CadQuery) into the execution environment, the agent doesn't have to waste tokens writing `import` statements or initialization boilerplate.
* **Focus on [Geometry](../mathematics/geometry.md)**: The agent only writes the raw geometric logic (e.g., `box = Box(10, 20, 5)`). The wrapper handles rendering, exporting, and metric generation automatically.
