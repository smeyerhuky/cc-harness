---
type: "Policy"
title: "Garbage Day Definition of Done"
description: "This project's additions to the repo-wide definition of done; the generic three tiers are linked, not copied."
resource: "../../../../kb/pdlc/definition-of-done.md"
tags: ["verification", "governance"]
timestamp: "2026-09-30"
---

# Garbage Day Definition of Done

Every work item, dependency change, and milestone in this project meets the repo-wide
[definition of done](../../../../kb/pdlc/definition-of-done.md) **plus** the items below. Don't copy
the generic tiers here — add only what is specific to this project.

## Project-specific items

1. **Engine changes keep replays deterministic.** A change under `src/engine/` passes the golden
   replays; regenerating a golden file is a deliberate, separate commit that says why the rules
   changed and links the spec edit.
2. **Colours and type come from tokens.** UI code uses the UI language's CSS custom properties,
   never literal colours, and the token-contrast test passes.
3. **User-facing work is checked on a phone and a desktop** (touch and keyboard), with reduced
   motion on, and the check is recorded in the item's Resolution.
4. **Dependency versions are current** per the dependency tier of the repo's definition of done,
   with any held-back version listed in [stack and CI](../design/stack-and-ci.md#exceptions-to-latest).

## This project's gates

The project [KB gates](../../../../kb/pdlc/definition-of-done.md#gates) on this bundle, and, once
`src/` has code, the [code gates](../design/stack-and-ci.md#code-gates).
