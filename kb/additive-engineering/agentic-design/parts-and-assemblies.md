---



type: "Concept"
title: "Agentic Assemblies and Parts"
description: "Core concept from agentcad Concepts"
resource: "agentcad Concepts"
tags: ['assemblies', 'hierarchy', 'semantics']
timestamp: "2026-07-24"
---

# Agentic Assemblies and Parts

When an agent designs an assembly, it must maintain semantic meaning so a human can understand and modify the output.

## Semantic Grouping
* **Named Parts**: Scripts should explicitly tag distinct bodies with stable IDs or names (e.g., `top_case`, `bottom_case`). 
* **Color Coding**: Assigning colors programmatically helps the human reviewer parse the agent's design intent in the visual viewer.
* **Isolated Review**: By maintaining a list of captured parts for a given version, reviewers can isolate or focus on individual components without rendering the entire complex assembly.
