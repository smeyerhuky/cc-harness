---



type: "Concept"
title: "Structured Feedback Loops"
description: "Core concept from agentcad Concepts"
resource: "agentcad Concepts"
tags: ['agent', 'feedback', 'json']
timestamp: "2026-07-24"
---

# Structured Feedback Loops

For an AI agent to iteratively design CAD models, it requires deterministic, machine-readable feedback rather than just visual output.

## Stdout vs Stderr Separation
* **Data Streams**: A robust agentic workflow separates human-readable progress logs from machine-readable data. Diagnostics and progress are piped to `stderr`, while the final execution state (success, metrics, paths) is printed to `stdout` as strict JSON.
* **Agent Parsing**: The agent consumes the JSON payload to understand if the script compiled successfully, what files were generated, and what geometric properties were measured, closing the feedback loop without needing computer vision.
