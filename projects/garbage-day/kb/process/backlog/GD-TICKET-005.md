---
type: "Work Item"
title: "GD-TICKET-005: Design the React client architecture"
description: "Write kb/design/client-architecture.md: modular feature folders, a reusable ui commons package, where each kind of state lives, narrow contexts, the modern React hooks used and why, canvas rendering outside React's render cycle, and input."
resource: "../journal/2026-09-30-design.md"
tags: ["backlog", "design", "react"]
timestamp: "2026-09-30"
state: "done"
milestone: "M0"
relationships:
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-design.md
  - type: DEPENDS_ON
    target: GD-TICKET-002.md
---

# GD-TICKET-005: Design the React client architecture

## Description

At the check-in after the spec, the owner asked for "a react based project on the latest
dependencies … components that are modular, commons with reusable and effective use of modern
sota state and context management hooks". The architecture item covers the system; this item
covers the client inside it.

## Acceptance Criteria

- `kb/design/client-architecture.md` exists with OKF frontmatter and defines: the packages and
  feature folders; the `ui` commons and the import rule between features; one home for each kind
  of state (the running match, screen flow, preferences, server data, local UI state) and why;
  the contexts; the modern React APIs used and where; rendering; input; client testing; and how
  the proof of concept's client code maps onto components.
- It is linked from `kb/design/index.md`.
- The project gates pass.

## Linked Artifacts

- [Client architecture](../../design/client-architecture.md), [architecture](../../design/architecture.md),
  [stack and CI](../../design/stack-and-ci.md)
- Proof-of-concept client: `spikes/proof-of-concept/live/app.js`

## AI PDLC Prompt

Done; nothing to execute. If the client design must change, edit
`projects/garbage-day/kb/design/client-architecture.md`, keep `stack-and-ci.md` versions in step,
and run the project gates (`/kb/pdlc/definition-of-done.md`, "Gates").

## Resolution

Done in [the design session](../journal/2026-09-30-design.md):
[`kb/design/client-architecture.md`](../../design/client-architecture.md). The running match is an
external store read through `useSyncExternalStore` selectors (boards drawn on canvas outside React
renders); screen flow is an XState v5 actor behind `createActorContext`; preferences are a
persisted Zustand store; server data uses React Router loaders; local state stays in components.
React 19 APIs (`use`, `useActionState`, `useOptimistic`, `useTransition`, `useEffectEvent`,
`<Activity>`) and the React Compiler each have a named use.
