---
type: "Reference"
title: "Garbage Day — UI Language"
description: "The visual and verbal language: the municipal identity and what to avoid, colour tokens for both themes including a non-guideline piece palette with patterns, type, the board and widgets, motion with reduced-motion equivalents, sound, touch feedback, annotated layouts for desktop and phone, and the voice of the copy; carried over from the proof-of-concept pages and updated for v1."
resource: "../product/prd.md"
tags: ["design", "UI", "ui-language"]
timestamp: "2026-09-30"
relationships:
  - type: IMPLEMENTS
    target: ../product/controls-and-layout.md
  - type: DERIVED_FROM
    target: ../process/backlog/GD-SPIKE-001.md
---

# Garbage Day — UI Language

How Garbage Day looks, moves, sounds and talks. Behaviour (what a gesture does, what a pause
does) is the spec's, in [controls and layout](../product/controls-and-layout.md) and
[pause and presence rules](../product/pause-and-presence.md); this page is the language those
behaviours are expressed in. It starts from the two proof-of-concept pages and changes what a
shipped game needs.

## Identity

**Municipal waste collection.** The name is the day the bins go out, and the look borrows from
the street: hazard tape, safety orange, bin blue, concrete grey, reflective yellow, and the
condensed signage type of depots and trucks. It is playful but orderly, like a well-run depot.

- **Hazard stripes mean garbage.** Diagonal yellow-and-ink stripes mark incoming garbage (the
  meter), hatched grey marks landed garbage rows, and a stripe band tops every popover that
  interrupts play. Nothing else uses stripes.
- **The stage is a dark cabinet in both themes.** The page around it follows light or dark mode;
  the boards always sit on a near-black well so pieces read the same everywhere.
- **Avoid:** anything from Tetris's trade dress (the name, the logo, the guideline's colour for
  each piece, its skins and music), glossy candy blocks, neon arcade clichés, and emoji as
  decoration.

## Colour tokens

From the proof of concept's `:root` blocks, unchanged unless noted. Every colour is a CSS custom
property defined on `:root` for light, redefined for dark under
`@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#ECEEEA` | `#101315` | page |
| `--surface` · `--surface-2` | `#F8F9F6` · `#E1E5DF` | `#171B1E` · `#1F2529` | cards, sheets |
| `--ink` · `--muted` · `--line` | `#1B1F22` · `#56606A` · `#C8CEC7` | `#E6E9E4` · `#98A2A8` · `#2C3338` | text, borders |
| `--accent` (safety orange) | `#C73E17` | `#FF6B3D` | primary actions, the local player |
| `--rival` (bin blue) | `#22629C` | `#5DA5E3` | the opponent |
| `--hazard` · `--hazard-ink` | `#F2B90F` · `#1B1F22` | `#F2C12E` · `#111416` | garbage meter, stripe bands |
| `--ok` · `--warn` · `--bad` | `#2A8453` · `#9A7208` · `#C23A2B` | `#4CC27F` · `#E3B23C` · `#F0604F` | presence and results |
| `--well` · `--well-grid` · `--cabinet` | `#14181B` · `#1F2529` · `#262C31` | `#0A0D0F` · `#171C20` · `#0E1113` | board and stage |
| `--garbage` · `--garbage-stripe` | `#6F777D` · `#5A6167` | `#646C72` · `#50575C` | landed garbage |
| `--pw-shield` · `-bomb` · `-fog` · `-rush` | `#4FD1E8` · `#F0604F` · `#B3B6D6` · `#F29A2E` | same | gems and power-ups |

**Pieces: changed from the proof of concept.** The demo used the guideline colour for each shape
(I cyan, O yellow, T purple, S green, Z red, J blue, L orange), which is part of the trade dress
the PRD rules out. v1 uses the **collection streams** palette, where no piece keeps its guideline
hue, and gives every piece a **pattern mark** so shapes differ without colour (US-20):

| Piece | Stream | Colour | Mark (inset, 30% ink) |
|---|---|---|---|
| I | Paper | kraft `#D0A15B` | two horizontal lines |
| O | Glass | bottle green `#3E9E7A` | ring |
| T | Plastics | bin blue `#4A78C8` | small triangle |
| S | Textiles | rose `#C4508A` | diagonal slash |
| Z | Metal | steel `#7C95AC` | 2 × 2 dots |
| J | Compost | olive `#8FA33B` | plus |
| L | Electronics | plum `#9A6CC0` | square outline |
| Garbage | — | `--garbage` with hatch | diagonal hatch (from the demo) |
| Gem | power-up | `--pw-*` | white diamond (from the demo) |

Each piece colour must reach at least 3:1 contrast against `--well`; a unit test checks every
token pair the UI relies on, in both themes.

## Type

| Role | Face | Use |
|---|---|---|
| Display | **Big Shoulders Display** 800–900, uppercase | titles, player names, banners, countdown numbers |
| Body | **Public Sans** 400–700 | all running text and controls |
| Data | **IBM Plex Mono** 400–600, tabular numbers | clock, stats, codes (`GD-7KQ4`), meters |

Self-hosted from `@fontsource` packages, not Google Fonts: no third-party request, and it works
offline. Fallback stacks as in the demo (`"Arial Narrow"` for display, `system-ui` for body).
Scale: 14 · 16 · 20 · 28 · 40 · 64 px, with display sizes clamped to the viewport.

## The board and its widgets

From the demo's canvas renderer, kept:

- **Cells** are square with a 1 px gap, a lighter top bevel and a darker bottom bevel.
- **Garbage** cells are hatched grey sprites. **Gems** are power-up coloured cells with a white
  diamond that pulses gently.
- The **ghost** is a 2 px outline in the piece colour at 60% opacity.
- **Line clears** flash white for the 0.2 s clear delay, then the rows above drop.

| Widget | Look |
|---|---|
| Meter | a 10 px bar on the board's inner edge. Waiting rows are dim hazard stripes, ready rows are bright; the count sits above it; a cyan glow while shielded |
| Slots | hold, power-up and next pieces in small dark tiles with a mono caption; the opponent's next tile shows a padlock and "hidden" |
| Speed chip | `SPEED 7` with a thin progress bar to the next level; red while Rush or sudden death is on |
| Presence chip | a dot and a word: online (green), away (yellow), reconnecting (blinking yellow), gone (red) |
| Showdown banner | a pill across the top of the stage: yellow for Double garbage, red and pulsing for Sudden death |
| Popover | surface card with the hazard stripe band on top, title in display type, a countdown ring, primary action filled in accent |
| Board cover | a dark diagonal pattern with "Hidden while paused" and the reason and time left in hazard yellow |

## Motion

Durations from the demo; each has a reduced-motion version that keeps the information.

| Event | Motion | Reduced motion |
|---|---|---|
| Hard drop | piece travels at 14 ms per row, then a 260 ms white lock glow | instant, glow only |
| Line clear | 3 white pulses in 200 ms, rows collapse in 220 ms | a single fade |
| Garbage lands | rows slide up from below in 150 ms and the screen shakes for 380 ms | rows appear, no shake |
| Attack sent | a yellow token flies from the board through the centre column to the other meter in 700 ms, and the column's Match DO badge pulses | the meter count ticks up |
| Clear label | TETRIS, T-SPIN DOUBLE and so on rise and fade over 1.3 s | shown for 1 s, no movement |
| Countdown | 3-2-1-GO numbers pop in over 550 ms | numbers change in place |
| Win | confetti from the winner's board | none |

## Sound

Off until the player turns it on. v1 keeps the demo's synthesized tones (Web Audio, no files): a
tick for moves, a thud for locks, a rising arpeggio per cleared line, a sweep for attacks sent, a
low rumble for garbage landing, a three-note horn for showdowns, and a fanfare for a win.
Recorded sounds can replace them later without changing the events.

## Touch feedback

- While dragging, the piece follows the finger. Once the gesture locks to an axis, a faint arrow
  shows the direction.
- A flick leaves a short streak above the landing spot.
- A tap-rotate shows a small arc on the side that was tapped.
- Vibration, where supported: 10 ms on lock, 20 ms on hard drop, 30 ms when garbage lands.

## Layouts

**Desktop, 1200 px and wider:**

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GARBAGE DAY            YOU · online · SPEED 7        1:24        SPEED 7 · online · RIVAL │
├──────────┬───────────────────────┬──┬───────────┬──┬───────────────────────┬──────────┤
│ HOLD     │                       │▒▒│   1:24    │▒▒│                       │ HOLD     │
│ POWER  E │                       │▒▒│ ┌───────┐ │  │                       │ POWER    │
│ NEXT     │     your board        │  │ │MATCH  │ │  │    RIVAL's board      │ NEXT     │
│  ▪▪▪▪    │     (fills height)    │  │ │ DO    │ │  │    (same size)        │ [hidden] │
│  ▪▪      │                       │  │ └───────┘ │  │                       │          │
│  ...     │                       │  │ attacks   │  │                       │          │
│          │                       │  │ fly here  │  │                       │          │
├──────────┴───────────────────────┴──┴───────────┴──┴───────────────────────┴──────────┤
│ Lines 24 · Sent 11 · 1.8 pieces/s · Tetrises 2      Lines 19 · Sent 8 · 1.5 pieces/s  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

At 1600 px and wider, a **match feed** column (attacks, cancels, power-ups, showdowns, pauses,
with times) sits to the right of RIVAL's panel.

**Phone, portrait:**

```
┌──────────────────────────────┐
│ YOU · SPEED 7    1:24  RIVAL │
├───┬─────────────────┬─┬──────┤
│H  │                 │▒│ ┌──┐ │
│P  │   your board    │▒│ │R │ │  opponent at about a third of the width
│N  │   (most of the  │ │ │  │ │
│▪▪ │    height)      │ │ └──┘ │
│▪▪ │                 │ │ ▒    │
├───┴─────────────────┴─┴──────┤
│      (power-up button)   (P) │  thumb zone
└──────────────────────────────┘
```

**Phone, landscape:** the desktop arrangement without the stats row or the feed, boards at equal
size.

## Voice and copy

Plain words, active voice, from the player's side of the screen. Say what happened and what
happens next. No blame, no jokes at the player's expense, no exclamation marks except in clear
labels.

| Moment | Copy |
|---|---|
| Opponent switched tabs | **RIVAL left the game tab.** Both boards are hidden and frozen, so nobody loses time. If RIVAL isn't back in 2:00, RIVAL forfeits. |
| Opponent lost connection | **RIVAL's connection dropped.** This one is free: dropped connections don't use RIVAL's pauses. |
| Waiting bar | Waiting for RIVAL · 1:43 · +1:00 · Leave |
| No pauses left | **Away, no pauses left.** The match keeps running. Come back within 0:15 or you forfeit. |
| Return | You were away 0:47 · 1 pause left |
| Result | **You win.** RIVAL topped out at 2:14. / **No contest.** You left while RIVAL was away. |
| Private game | Send this link to one friend. The game closes after 30 minutes if nobody joins. |
| Full game | This game is full. Start a quick match instead? |

Names are always shown as the players see them (a handle, or "Bot · Regular"); the words
"Durable Object" and "WebSocket" never appear outside the developer overlay.

## What changes from the demos

| Demo | v1 |
|---|---|
| Guideline piece colours | The collection-streams palette with pattern marks |
| Google Fonts link | Self-hosted fonts |
| Explainer sections (engine room, wire log, quizzes) | A developer overlay, off by default |
| XP, levels and badges | Not in v1 (the PRD doesn't include them) |
| Fixed-size stage in a scrolling page | A full-viewport match screen that never scrolls |
| Everything in one file | `ui` package components and tokens |
