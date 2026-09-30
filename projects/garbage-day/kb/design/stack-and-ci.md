---
type: "Technology"
title: "Garbage Day — Tech Stack, Build and CI"
description: "The v1 technology choices with pinned versions checked on 2026-09-30 and the reason for each, the two documented exceptions to 'latest', the pnpm workspace layout, local development, the test pyramid, dependency security, the GitHub Actions pipeline, deployment to Cloudflare, and the code gates."
resource: "architecture.md"
tags: ["design", "deploy", "ci"]
timestamp: "2026-09-30"
relationships:
  - type: IMPLEMENTS
    target: architecture.md
---

# Garbage Day — Tech Stack, Build and CI

The owner's rule: **React, on the latest dependencies, to stay ahead of vulnerabilities.**
"Latest" means the newest release on the npm registry that is **at least one day old**: the
workspace refuses anything younger (`minimumReleaseAge`, under
[dependency security](#dependency-security)), so a version published today is picked up
tomorrow. Every version below was the newest by that rule on 2026-09-30, except two, which are
held back one major by a peer dependency and are listed as exceptions with the condition for
lifting them. Exact versions are pinned in `package.json` files and the committed lockfile
(`GD-TICKET-006`, and `GD-TICKET-011` for the Cloudflare rows).

## The stack

| Area | Choice | Version | Why |
|---|---|---|---|
| Runtime (dev, CI) | Node.js LTS | 24.x in CI; `engines` ≥ 22.22 | Current LTS in CI; 22.22 is the floor that still runs every tool, so an older local Node works |
| Package manager | pnpm workspaces | 12.8.1 | Fast, strict, workspace protocol; blocks install scripts unless allowed. Pinned in `packageManager`; run through Corepack or `npx pnpm@12.8.1` |
| Language | TypeScript, strict | **6.0.3** (exception) | See exceptions |
| UI | React + React DOM | 19.3.0 | Latest; `<Activity>`, `useEffectEvent`, `useActionState`, `useOptimistic` |
| Memoization | React Compiler (`babel-plugin-react-compiler`) | 1.0.0 | Stable; removes hand-written memoization |
| Compiler route | `@rolldown/plugin-babel` + `@babel/core` | 0.2.4 · 8.0.6 | `@vitejs/plugin-react` 6 no longer runs Babel itself; its `reactCompilerPreset()` runs through this plugin. The native (oxc) compiler route is still experimental |
| Build and dev server | Vite | 8.3.1 | Latest; Rolldown bundler |
| React plugin | `@vitejs/plugin-react` | 6.1.1 | Needs Vite 8; hosts the React Compiler |
| Cloudflare in Vite | `@cloudflare/vite-plugin` | 1.62.0 | Runs the Worker and Durable Objects in workerd during `vite dev` and `vite preview`, and builds both |
| Deploy tool | Wrangler | 4.143.0 | The version the Vite plugin 1.62.0 pins; has `wrangler preview` (Worker Previews need 4.135 or later) |
| Worker types | `@cloudflare/workers-types` | 5.20260929.1 | Types for the Worker and `cloudflare:workers`; the bindings are declared in `worker/env.d.ts` |
| Routing | React Router (data mode) | 8.4.0 | Loaders and actions for private-game lookups; lazy routes |
| Screen-flow state | XState + `@xstate/react` | 5.33.2 · 6.1.0 | Real states and guards for the app flow ([client architecture](client-architecture.md)) |
| Preferences state | Zustand (with `persist`) | 5.0.15 | Smallest correct tool for a persisted flat store |
| Message schemas | Zod | 4.6.5 | Validates every incoming message on the server; types shared with the client |
| Styling | CSS Modules + CSS custom properties | built in | Tokens from [UI language](ui-language.md); no runtime cost |
| Fonts | `@fontsource` (Big Shoulders Display, Public Sans, IBM Plex Mono) | 5.3.0 (display, since `GD-TICKET-011`); the others with the M2 commons | Self-hosted, imported by the `ui` package's `fonts.css` |
| Unit and component tests | Vitest | **4.1.11** (exception) | See exceptions |
| Durable Object tests | `@cloudflare/vitest-plugin` | 1.3.1 | Runs Worker and DO tests inside workerd. It replaced `@cloudflare/vitest-pool-workers`, whose last release (0.22.0, August) bundles a runtime too old for the compatibility date |
| DOM for tests | happy-dom + Testing Library (`@testing-library/react`, `/dom`) | 20.14.5 · 16.3.3 · 10.4.2 | Fast DOM; tests by role and label |
| End-to-end | Playwright + `@axe-core/playwright` | 1.63.0 (in since `GD-TICKET-019`) · 4.13.0 (M3) | Two browsers play a real match; accessibility scan |
| Browser tests | `@vitest/browser-playwright` | 4.1.11 (matches Vitest) | Runs the golden replays in Chromium, Firefox and WebKit |
| Lint | ESLint + `typescript-eslint` + `eslint-plugin-react-hooks` | 10.11.0 · 8.71.0 · 7.1.1 | Hooks rules including the React Compiler's; type-aware rules through the project service |
| Lint support | `@eslint/js` · `globals` | 10.0.1 · 17.12.0 | ESLint's recommended rules; browser and Node globals |
| Node types | `@types/node` | 24.19.0 | Matches the CI runtime; only the root config and Vitest configs use it |
| Format | Prettier | 3.9.9 | One style, no debate |
| Unused code and dependencies | Knip | 6.38.0 | Keeps the dependency surface small |
| Dependency updates | Renovate | hosted app | Weekly grouped updates, patch updates merged automatically when CI is green |

## Exceptions to "latest"

| Held back | Latest | Blocked by | Lift when |
|---|---|---|---|
| TypeScript **6.0.3** | 7.0.2 (the native compiler) | `typescript-eslint` 8.71 supports TypeScript `<6.1` | `typescript-eslint` supports 7.x; Renovate's PR for TypeScript 7 goes green |
| Vitest **4.1.11** | 5.0.2 | `@cloudflare/vitest-plugin` 1.3 requires Vitest `^4.1` | The plugin supports Vitest 5 |
| `undici` forced to **7.29.1** (a security override, not a hold-back) | 7.30.0 | miniflare 5.20260926.0-alpha, under Wrangler 4.143.0, pins 7.29.0, which has ten advisories (two high, all in local development tooling) | Wrangler 4.143.1 or later is in: its miniflare pins 7.29.1; then delete the `overrides` entry in `pnpm-workspace.yaml` |

The two hold-backs are checked by Renovate automatically: the upgrade PR stays open and fails
until the blocker moves. The override is 7.29.1 rather than 7.30.0 because 7.29.1 is exactly
what miniflare's own next release uses. The TypeScript 7 compiler (`@typescript/native-preview`) may be added later as
a faster second typecheck without touching lint.

**Waiting a day is not an exception.** On 2026-09-30 Wrangler 4.144.0 and 4.143.1, the Vite
plugin 1.62.2 and 1.62.1, the Worker types of that day and `@cloudflare/vitest-plugin` 1.3.2 and
1.3.3 were all under a day old, so `minimumReleaseAge` refused them and
[`GD-TICKET-011`](../process/backlog/GD-TICKET-011.md) pinned the newest releases that were
older: a matched set (the plugin 1.62.0 pins Wrangler 4.143.0, as does the test plugin 1.3.1).

## Workspace layout

```
projects/garbage-day/
├── package.json            scripts: dev, build, lint, format, typecheck, test, test:worker, audit (+ e2e later)
├── pnpm-workspace.yaml     packages: src/*; minimumReleaseAge 1440; allowBuilds (esbuild, workerd); overrides
├── pnpm-lock.yaml          committed
├── tsconfig.base.json      shared strict options; each package's tsconfig.json extends it
├── tsconfig.json           the root config, for the Vitest workspace file only
├── vitest.config.ts        one Vitest run over every package (`projects: ['src/*']`)
├── eslint.config.js · .prettierrc.json · .prettierignore · knip.json
├── src/
│   ├── engine/   @garbage-day/engine    src/, tsconfig.json, vitest.config.ts (Node)
│   ├── protocol/ @garbage-day/protocol  same shape; depends on zod
│   ├── ui/       @garbage-day/ui        src/tokens, src/primitives; happy-dom tests
│   └── app/      @garbage-day/app       index.html, client/, worker/, wrangler.jsonc, vite.config.ts, vitest.worker.config.ts
└── e2e/                                 Playwright specs (from M3)
```

Packages export their TypeScript source (`"exports": "./src/index.ts"`) rather than build
output: Vite and Vitest compile it on the fly, so there is no library build step and no
declaration files. For the same reason the typecheck is `tsc --noEmit -p <package>` for each
package in turn, not `tsc -b` over project references, which would need every package to emit.

**Configuration notes.** ESLint's type-aware rules find each file's tsconfig through the project
service, so every file ESLint lints must sit inside some tsconfig. The packages' Vitest configs
are in their packages' tsconfigs; the root `tsconfig.json` exists only to hold the root
`vitest.config.ts`. Knip ignores `react`, `react-dom` and `@types/react`
in `src/ui`, where they are a peer dependency plus test-only development dependencies that Knip
cannot see being used.

**One Vitest.** Packages that plug into Vitest (`@vitest/browser-playwright`, Playwright) are root
development dependencies, beside Vitest itself. Declared in a package instead, they made pnpm
build a second copy of Vitest for that package, and the Workers test plugin then met a different
copy from the runner ("Cannot read properties of undefined (reading 'config')", `GD-TICKET-019`).

## Local development

- Install once with `corepack enable` (then `pnpm install`), or run every command as
  `npx pnpm@12.8.1 <script>`; both honour the `packageManager` pin.
- `pnpm dev` starts Vite with the Cloudflare plugin: the React app, the Worker and both Durable
  Objects run locally in workerd (`http://localhost:5173`; `/api/health` answers from both DOs).
  After `pnpm build`, `pnpm --filter @garbage-day/app preview` serves the built Worker the same
  way. Open two tabs, or
  one normal and one private window, to play yourself. Local verification follows the repo's
  [`/kb/platforms/cloudflare-local-verify.md`](../../../../kb/platforms/cloudflare-local-verify.md).
- `pnpm test` runs engine, protocol, ui and client tests; `pnpm test:worker` the Durable Object
  tests; `pnpm e2e` the Playwright suite against `vite preview`.

## Tests

| Layer | What | Tool |
|---|---|---|
| Engine unit | pieces and kicks, lock delay, attack table, cancelling, garbage landing, speed table, power-ups, referee rules | Vitest |
| Golden replays | seeded matches (bot vs bot, a classic-rules match, and one with every interruption, as in `spikes/proof-of-concept/live/test-live.js`) replayed twice and compared with `src/engine/test/golden/*.json` by result, tick counts, final board hashes, stats, message counts and messages per minute, and the referee's timeline. `pnpm --filter @garbage-day/engine golden:update` regenerates them, deliberately. `pnpm test:browser` runs the same test, against the same files, in Chromium, Firefox and WebKit | Vitest (`toMatchFileSnapshot`); Vitest browser mode with Playwright |
| Protocol | every message type round-trips through its schema; invalid messages are rejected | Vitest |
| UI and client | commons, features, `appMachine`, gestures, `MatchSession` against a local referee | Vitest, happy-dom, Testing Library |
| Worker and Durable Objects | routes and the health check (from `GD-TICKET-011`); then pairing, private lobby and codes, dealing, ledger resend, alarms (pause, grace, both away, expiry), snapshot restore after restart | `@cloudflare/vitest-plugin` (`src/app/vitest.worker.config.ts`) |
| End to end | two browser contexts: quick match to result; private link join; a tab hidden mid-match, then back; accessibility scan of every screen | Playwright, axe |

## Dependency security

- `pnpm audit --audit-level moderate` runs in CI. A finding fails the build unless an exception
  with a reason is recorded in `package.json` (`pnpm.auditConfig.ignoreGhsas`) and in this file.
- **GitHub dependency review** runs on every pull request that touches the project and blocks
  new vulnerable or wrongly-licensed dependencies ([the pipeline](#the-pipeline)).
- **CodeQL** (JavaScript/TypeScript, no build needed) runs weekly, on pull requests and on
  pushes that touch `src/`.
- `minimumReleaseAge` of one day in `pnpm-workspace.yaml` stops a just-published (possibly
  hijacked) version from being installed. `allowBuilds` allows install scripts only for the
  packages it names (esbuild and workerd, which fetch native binaries); pnpm 12 refuses to finish
  an install that meets any other. (The scaffold first wrote the pnpm 10 name,
  `onlyBuiltDependencies`, which pnpm 11 and later ignore; `GD-TICKET-011` found and fixed it.)
- **Overrides** in `pnpm-workspace.yaml` patch a vulnerable transitive version only until
  upstream catches up, each listed in [exceptions](#exceptions-to-latest) with when to remove it.
- The lockfile is frozen in CI (`pnpm install --frozen-lockfile`).

## The pipeline

Three workflows at the repo root (`GD-TICKET-007`, deploys from `GD-TICKET-011`), plus a
composite action for the setup every code job shares:

| File | Runs on | Jobs |
|---|---|---|
| `.github/workflows/garbage-day.yml` | pushes that touch the project (path filter); **every** pull request; manual runs | `changes`, `install`, `lint`, `typecheck`, `test`, `test-worker`, `test-browser`, `audit`, `build`, `kb`, `dependency-review`, `garbage-day-ok`; then `deploy-preview` (pull requests) or `deploy-production` (`main`) |
| `.github/workflows/garbage-day-preview-cleanup.yml` | a pull request touching the project closes | `delete-preview` |
| `.github/workflows/garbage-day-codeql.yml` | pushes and pull requests that touch `projects/garbage-day/src/`; weekly (Monday 05:17 UTC); manual runs | `codeql` |
| `.github/actions/garbage-day-setup/` | used by every code job | pnpm from the `packageManager` pin, Node 24, the pnpm store cached by lockfile hash, `pnpm install --frozen-lockfile` |

```
          ┌─ install ─┬─ lint (eslint, prettier --check, knip) ─┐
          │           ├─ typecheck (tsc per package)            ├─► build ─┐   (e2e: M3)
          │           ├─ test (vitest: engine, replays, ui) ────┤          │
changes ──┤           ├─ test-worker (Workers pool) ────────────┤          │
          │           ├─ audit (pnpm audit) ────────────────────┘          │
          │           └─ test-browser (golden replays in Chromium, Firefox, WebKit) ─┤
          │                                                                  ├─► garbage-day-ok ─┬─► deploy-preview (PR)
          ├─ kb (the repo's KB gates on projects/garbage-day/kb/ and projects/kb/) ─┤                   └─► deploy-production (main)
          └─ dependency-review (pull requests only) ────────────────────────────────┘
codeql and delete-preview (their own workflows)
```

- **`changes`** decides whether the project was touched. A pull request is compared with its
  base (`git diff base...head`) against the same paths as the push filter: the project, the
  projects index, these workflow files, and the kb job's inputs (the gate scripts and
  `kb/authority/`). Pushes are already path-filtered, and a manual run checks everything. When
  the project is untouched, every other job is skipped.
- **`install`** runs once first, so the store is cached before the parallel jobs restore it.
- **`test-browser`** installs the three Playwright browsers on the runner and replays the golden
  matches in each. Chromium shares Node's V8, so the check that matters is Firefox and WebKit.
  In an agent session, where only a Chromium is installed, run it as
  `GD_BROWSERS=chromium PW_CHROMIUM=<path to chrome> pnpm test:browser`.
- **`garbage-day-ok`** needs every job, runs even when one fails, and fails if any failed or was
  cancelled; skipped jobs count as passing.
- **Least privilege:** the workflows grant `contents: read` and nothing else, except CodeQL's
  job, which adds `security-events: write` and `actions: read`, and `deploy-preview`, which adds
  `pull-requests: write` to comment the preview URL. Checkouts don't keep the token
  (`persist-credentials: false`). Every action is pinned to a full commit SHA with its version
  in a comment, and Renovate updates those pins as well (`renovate.json`'s `includePaths` covers
  these files).
- **Dependency review** fails on a new dependency with a moderate or worse advisory, or under a
  GPL, AGPL or SSPL licence (the repo is MIT, and the client ships to browsers).

**Required to merge: `garbage-day-ok`**, and only it. Pull requests are not path-filtered for
this reason: GitHub waits forever for a required check from a workflow that never starts, so a
path-filtered required check would block every pull request for the repo's other projects. One
summary check also means adding a job (e2e in M3) never touches the repository's settings.
CodeQL is left out of the required checks: its findings appear on the pull request as code
scanning alerts.

**The owner must set this up; an agent session cannot:** in the repository's settings, add a
branch ruleset (or branch protection) for `main` that requires the status check
`garbage-day-ok`. Renovate's automatic patch merges wait for it too.

## Deployment

The Worker (`src/app/worker/`, configured by `src/app/wrangler.jsonc`) serves the built client as
static assets with an SPA fallback; only `/api/*` and `/ws/*` reach the Worker first. Both
Durable Object classes, `LobbyDO` and `MatchDO`, are declared with a first migration using
`new_sqlite_classes` (SQLite storage, which the free plan requires). `vite build` writes the
deployable Worker and its config to `dist/`, which `wrangler deploy` and `wrangler preview` read.

- **A preview per pull request, as a Worker Preview.** `deploy-preview` runs
  `wrangler preview --name pr-<number>` and comments the preview URL on the pull request; the
  cleanup workflow runs `wrangler preview delete` when the pull request closes. A Worker Preview
  (open beta since 2026-09-22) is a running copy under the same Worker with its own URL, its own
  settings (the `previews` block in `wrangler.jsonc`, which sets `ENVIRONMENT` to `preview`) and
  **its own Durable Object storage**, so a preview never touches production's matches. The design
  first named `wrangler versions upload`, but Cloudflare makes no version URL for a Worker that
  has Durable Objects, so that route gives no preview at all.
- **Production on a push to `main`:** `deploy-production` runs `wrangler deploy` in the GitHub
  environment `production`, where the owner can require an approval.
- **Credentials:** `CLOUDFLARE_API_TOKEN` (scoped to Workers and Durable Objects on one account)
  and `CLOUDFLARE_ACCOUNT_ID` as repository secrets; never in files. Without them (before the
  owner adds them, and on pull requests from forks) both deploy jobs record a notice and pass. See
  [`/kb/platforms/cloudflare-credentials.md`](../../../../kb/platforms/cloudflare-credentials.md).
- **Not yet proven against Cloudflare.** No session so far has had the secrets, so the first
  real preview and production deploys are also the first test of these jobs. If previews fail
  before the Worker exists in production, one production deploy comes first.
- **Known traps from this repo's lessons:** a sandboxed agent session cannot reach its own
  `*.workers.dev` URL (error 1042), so live checks after a deploy happen in the owner's browser
  ([`/kb/lessons/sandbox-egress-limits.md`](../../../../kb/lessons/sandbox-egress-limits.md)), and
  a polluted Wrangler cache can deploy stale code
  ([`/kb/lessons/wrangler-cache-pollution.md`](../../../../kb/lessons/wrangler-cache-pollution.md)).
  CI builds from a clean checkout for that reason, and `.wrangler/` is gitignored.
- **A deploy restarts live matches' Durable Objects**; clients reconnect and matches restore from
  their snapshots ([architecture](architecture.md#presence-and-pauses)). Production deploys are
  still best done when traffic is low.

## Code gates

Run from `projects/garbage-day/` before every commit that touches `src/`, in addition to the KB
gates:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker && pnpm build
```

CI adds `pnpm audit`, and `pnpm e2e` from M3. `pnpm test:worker` runs the Worker and Durable
Object tests inside workerd.
