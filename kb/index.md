---
okf_version: "0.1"
---

# CC Harness Knowledge Base

Welcome to the playground repository knowledge base. This OKF-formatted resource provides comprehensive guidance on repository structure, development workflows, and knowledge management practices.

The playground is a structured development environment for experimentation and multi-project development. Each project maintains its own knowledge base, and this repository KB provides cross-project guidance and standards.

## Table of Contents

* [Getting Started](./getting-started/index.md) - Quick introduction and setup guides
* [AI-SDLC](./ai-sdlc/index.md) - Spec-driven development and the AI-SDLC workflow
* [Additive Engineering](./additive-engineering/index.md) - Root knowledge base for 3D modeling and agentic software
* [Architecture](./architecture/index.md) - Repository structure, KB organization, and project templates
* [Development](./development/index.md) - Development workflows and shared code management

### Deploy knowledge (added 2026-07-15)

The following four sections capture the abstract deploy lifecycle, this repo's git protocol, per-platform deploy recipes, and hard-won lessons from real deploys. Start from [`concepts/deploy-lifecycle`](./concepts/deploy-lifecycle.md) if you're about to ship something for the first time.

* [Concepts](./concepts/index.md) - Platform-neutral ideas: deploy lifecycle, verification vs deployment, how to navigate this KB
* [Process](./process/index.md) - Git protocol for this repo: branches, commits, pushes, PRs, merged-PR follow-ups
* [Platforms](./platforms/index.md) - Concrete per-platform deploy recipes (Cloudflare Workers first; add siblings as you deploy elsewhere)
* [Lessons](./lessons/index.md) - Specific things that bit us in real deploys — read the relevant one *before* you hit the wall
