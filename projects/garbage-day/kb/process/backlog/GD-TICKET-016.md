---
type: "Work Item"
title: "GD-TICKET-016: Label bots as bots everywhere"
description: "Make every place a bot appears (quick-match offer, lobby, match screen, result) say it is a bot and its level, as the PRD's assumed answer to open question 5 requires."
resource: "../coverage-audit.md"
tags: ["backlog", "UI"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-016: Label bots as bots everywhere

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the PRD's answer to open
question 5, "a bot is always labelled as a bot", was carried by nothing.

## Acceptance Criteria

- A bot opponent's name reads "Bot · <preset or skill/speed>" on the offer, the match screen and
  the result; the protocol marks a bot client so the other side cannot be fooled.
- An end-to-end test of "Play a bot while you wait" asserts the label on each screen.

## Linked Artifacts

- [PRD open questions](../../product/prd.md#open-questions), [UI language — voice and copy](../../design/ui-language.md#voice-and-copy)

## AI PDLC Prompt

Goal: label bots everywhere. Read `kb/product/prd.md` (US-01, US-03, open questions) and
`kb/design/architecture.md` ("Bots", "Messages"). Add a bot flag to `hello` in the protocol
package, carry it through the Match DO to the opponent, and render the label in the client. Done
when the criteria hold, the code and KB gates pass, this item is `done` with a Resolution, the
backlog index and roadmap agree, and the journal records it.
