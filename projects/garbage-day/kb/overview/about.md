---
type: "Concept"
title: "About Garbage Day"
description: "A two-player, real-time falling-block versus game with garbage attacks, for casual players, running entirely on Cloudflare."
resource: "../../README.md"
tags: ["project", "overview"]
timestamp: "2026-09-30"
---

# About Garbage Day

Garbage Day is a two-player, real-time falling-block versus game (a Tetris-style clone under its own name and look): two players are matched at random, play side by side on the same seeded pieces, and attack each other with garbage lines. It is for casual players who want a quick live match with a stranger or a friend, and it runs entirely on Cloudflare (Workers, static assets and Durable Objects) with no server to operate.

It exists because the owner wanted to know what a live multiplayer version takes without running
a backend, and a proof of concept answered it: each browser runs its own board, and one Durable
Object per match deals the pieces, relays moves, routes garbage and referees pauses. What it must
do in detail belongs in the spec (`kb/product/`, once written); this page stays the short version.

## Out of scope

- The Tetris name, logo or look: the game gets its own name and visual identity.
- User accounts, rankings, match history and replays in v1 (possible later milestones).
- Running any server outside Cloudflare Workers and Durable Objects.

## Where it stands

The [handoff](../process/handoff.md) — the one place that says where the project is right now.
