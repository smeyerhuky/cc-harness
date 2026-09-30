# Design — Garbage Day

How v1 is built (pipeline stage 2a). Each file implements part of the [spec](../product/index.md)
and starts from the proof of concept in `spikes/proof-of-concept/`.

* [System architecture](architecture.md) - Client, Worker, Lobby and Match Durable Objects, the engine and protocol packages, messages, state machines, determinism, garbage ledger, presence, bots, cost
* [Client architecture (React)](client-architecture.md) - Packages and feature folders, the ui commons, where each kind of state lives, contexts and modern hooks, canvas rendering, input
* [UI language](ui-language.md) - Identity, colour and type tokens, the piece palette and patterns, widgets, motion, sound, touch feedback, layouts, voice and copy
* [Tech stack, build and CI](stack-and-ci.md) - Pinned versions and why, the two exceptions to latest, workspace layout, tests, dependency security, the GitHub Actions pipeline, deployment, code gates
