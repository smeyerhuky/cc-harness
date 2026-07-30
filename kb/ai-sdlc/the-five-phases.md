---


type: "Concept"
title: "The Five Phases of AI-DLC"
description: "Core concept from AI-SDLC"
resource: "AI-SDLC"
tags: ['phases', 'lifecycle', 'pdlc']
timestamp: "2026-07-24"
---

# The Five Phases of AI-DLC

The AI-Driven Development Lifecycle (AI-DLC) scales [Spec-Driven Development](../ai-sdlc/spec-driven-development.md) from an individual technique into a comprehensive team methodology. It forces structure into the prompt-response loop using five phases:

1. **Specify**: The developer describes the work. The AI drafts a structured spec, surfaces ambiguity, and asks questions. The developer answers them in the spec.
2. **Plan**: The AI reads the answered spec and generates a phased implementation plan. The developer reviews and edits it before building begins.
3. **Build**: The AI implements the next phase, stops, and reports. The developer reviews the output and commits. Each developer commit is a human gate.
4. **Validate**: An automated quality gate checks the implementation against the spec (coverage, security). If it passes, the AI drafts a pull request.
5. **Ship**: The developer merges the pull request. The AI tags the release and publishes.

In this model, **Phases beat marathons**. One-shot generation is easy to produce but hard to trust; phased implementation keeps the work legible and under developer control.
