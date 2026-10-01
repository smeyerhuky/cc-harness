---
type: "Work Item"
title: "GD-STORY-010: Create a game and share a link"
description: "Private games: match settings, a code and link with Copy and Share, a ready lobby, the 30-minute expiry, and the full-game screen (US-02)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-TICKET-028.md
  - type: DEPENDS_ON
    target: GD-STORY-011.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-010: Create a game and share a link

## Description

The roadmap's M3 todo "Private games: create, code and link, Copy and Share, ready lobby, full and expired states (US-02)". `/new` and `/g/:code` exist as screens in M2 ([`GD-TICKET-014`](GD-TICKET-014.md)); the game code rule and the loader already check codes.

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#getting-into-a-match), **US-02 Create a game and share a link**:

- Given I press **Create game**, then I can change the match settings and I get a link and a
  short code (for example `GD-7KQ4`) with a **Copy link** button and a **Share** button where the
  device supports it.
- Given my friend opens the link or enters the code, when they arrive, then we both see a lobby
  with both handles, the settings, and a **Ready** button each; the countdown starts when both
  are ready.
- Given nobody joins, when 30 minutes pass without activity, then the game expires and the link
  says so if opened later.
- Given a third person opens a link whose game already has two players, then they see "This game
  is full" and a **Quick match** button.

## Linked Artifacts

- [PRD — US-02 and match settings](../../product/prd.md#match-settings), [architecture](../../design/architecture.md)

## AI PDLC Prompt

Goal: a friend joins by link. Read the PRD's match settings and the architecture's private-lobby section. Build the settings form so a bot game can use it too ([`GD-TICKET-026`](GD-TICKET-026.md)). Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.
