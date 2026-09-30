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
(`GD-TICKET-006`); a row marked *at 011* is pinned when the app shell needs it.

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
| Cloudflare in Vite | `@cloudflare/vite-plugin` | 1.62.2 *at 011* | Runs the Worker and Durable Objects in workerd during `vite dev` and builds both |
| Deploy tool | Wrangler | 4.144.0 *at 011* | Latest; required by the Vite plugin |
| Worker types | `@cloudflare/workers-types` | 5.20260930.1 *at 011* | Matches the compatibility date |
| Routing | React Router (data mode) | 8.4.0 | Loaders and actions for private-game lookups; lazy routes |
| Screen-flow state | XState + `@xstate/react` | 5.33.2 · 6.1.0 | Real states and guards for the app flow ([client architecture](client-architecture.md)) |
| Preferences state | Zustand (with `persist`) | 5.0.15 | Smallest correct tool for a persisted flat store |
| Message schemas | Zod | 4.6.5 | Validates every incoming message on the server; types shared with the client |
| Styling | CSS Modules + CSS custom properties | built in | Tokens from [UI language](ui-language.md); no runtime cost |
| Fonts | `@fontsource` (Big Shoulders Display, Public Sans, IBM Plex Mono) | latest at scaffold | Self-hosted |
| Unit and component tests | Vitest | **4.1.11** (exception) | See exceptions |
| Durable Object tests | `@cloudflare/vitest-pool-workers` | 0.22.0 *at 011* | Runs DO tests inside workerd |
| DOM for tests | happy-dom + Testing Library (`@testing-library/react`, `/dom`) | 20.14.5 · 16.3.3 · 10.4.2 | Fast DOM; tests by role and label |
| End-to-end | Playwright + `@axe-core/playwright` | 1.63.0 · 4.13.0 | Two browsers play a real match; accessibility scan |
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
| Vitest **4.1.11** | 5.0.2 | `@cloudflare/vitest-pool-workers` 0.22 requires Vitest `^4.1` | The pool supports Vitest 5 |

Both exceptions are checked by Renovate automatically: the upgrade PR stays open and fails until
the blocker moves. The TypeScript 7 compiler (`@typescript/native-preview`) may be added later as
a faster second typecheck without touching lint.

**Waiting a day is not an exception.** On 2026-09-30 the three Cloudflare packages marked
*at 011* were under a day old (Wrangler 4.144.0 and the Vite plugin 1.62.2 were published the
evening before, the Worker types that night), so `minimumReleaseAge` refused them. Nothing needs
them before the app shell, [`GD-TICKET-011`](../process/backlog/GD-TICKET-011.md), which pins the
newest versions old enough on its own day.

## Workspace layout

```
projects/garbage-day/
├── package.json            scripts: dev, build, lint, format, typecheck, test, test:worker, audit (+ e2e later)
├── pnpm-workspace.yaml     packages: src/*; minimumReleaseAge 1440; onlyBuiltDependencies allowlist
├── pnpm-lock.yaml          committed
├── tsconfig.base.json      shared strict options; each package's tsconfig.json extends it
├── tsconfig.json           the root config, for the Vitest workspace file only
├── vitest.config.ts        one Vitest run over every package (`projects: ['src/*']`)
├── eslint.config.js · .prettierrc.json · .prettierignore · knip.json
├── src/
│   ├── engine/   @garbage-day/engine    src/, tsconfig.json, vitest.config.ts (Node)
│   ├── protocol/ @garbage-day/protocol  same shape; depends on zod
│   ├── ui/       @garbage-day/ui        src/tokens, src/primitives; happy-dom tests
│   └── app/      @garbage-day/app       index.html, client/, vite.config.ts (+ worker/, wrangler.jsonc at 011)
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

## Local development

- Install once with `corepack enable` (then `pnpm install`), or run every command as
  `npx pnpm@12.8.1 <script>`; both honour the `packageManager` pin.
- `pnpm dev` starts Vite with the Cloudflare plugin (from `GD-TICKET-011`; until then plain Vite):
  the React app, the Worker and both Durable Objects run locally in workerd. Open two tabs, or
  one normal and one private window, to play yourself. Local verification follows the repo's
  [`/kb/platforms/cloudflare-local-verify.md`](../../../../kb/platforms/cloudflare-local-verify.md).
- `pnpm test` runs engine, protocol, ui and client tests; `pnpm test:worker` the Durable Object
  tests; `pnpm e2e` the Playwright suite against `vite preview`.

## Tests

| Layer | What | Tool |
|---|---|---|
| Engine unit | pieces and kicks, lock delay, attack table, cancelling, garbage landing, speed table, power-ups, referee rules | Vitest |
| Golden replays | seeded matches (bot vs bot, plus scripted interruptions as in `spikes/proof-of-concept/live/test-live.js`) replayed and compared by final board hash, result, tick count, and messages per minute | Vitest |
| Protocol | every message type round-trips through its schema; invalid messages are rejected | Vitest |
| UI and client | commons, features, `appMachine`, gestures, `MatchSession` against a local referee | Vitest, happy-dom, Testing Library |
| Durable Objects | pairing, private lobby and codes, dealing, ledger resend, alarms (pause, grace, both away, expiry), snapshot restore after restart | `@cloudflare/vitest-pool-workers` |
| End to end | two browser contexts: quick match to result; private link join; a tab hidden mid-match, then back; accessibility scan of every screen | Playwright, axe |

## Dependency security

- `pnpm audit --audit-level moderate` runs in CI. A finding fails the build unless an exception
  with a reason is recorded in `package.json` (`pnpm.auditConfig.ignoreGhsas`) and in this file.
- **GitHub dependency review** runs on every pull request and blocks new vulnerable or
  wrongly-licensed dependencies.
- **CodeQL** (JavaScript/TypeScript) runs weekly and on pull requests.
- `minimumReleaseAge` of one day in `pnpm-workspace.yaml` stops a just-published (possibly
  hijacked) version from being installed. `onlyBuiltDependencies` allows install scripts only for
  named packages; the list is empty until `workerd` arrives with the app shell.
- The lockfile is frozen in CI (`pnpm install --frozen-lockfile`).

## The pipeline

One workflow, `.github/workflows/garbage-day.yml`, at the repo root, triggered by pushes and pull
requests that touch `projects/garbage-day/**`.

```
            ┌─ lint (eslint, prettier --check, knip) ─┐
install ────┼─ typecheck (tsc per package)            ├─► build ─► e2e ─► deploy-preview (PR)
            ├─ test (vitest: engine, replays, ui) ────┤                └► deploy-production (main)
            ├─ test-worker (pool-workers) ────────────┤
            ├─ audit (pnpm audit) ────────────────────┘
kb ─────────  the repo's KB gates on projects/garbage-day/kb/ and projects/kb/
dependency-review (PR only) · codeql (PR + weekly)
```

**Required to merge:** `kb`, `lint`, `typecheck`, `test`, `test-worker`, `audit`, `build`, `e2e`,
`dependency-review`.

## Deployment

- **Preview per pull request:** `wrangler versions upload` publishes a preview version and the job
  comments its URL on the pull request. Durable Object migrations are never applied from a preview.
- **Production on merge to `main`:** `wrangler deploy` behind a GitHub environment named
  `production`, so a person can require approval.
- **Credentials:** `CLOUDFLARE_API_TOKEN` (scoped to Workers and Durable Objects on one account)
  and `CLOUDFLARE_ACCOUNT_ID` as repository secrets; never in files. See
  [`/kb/platforms/cloudflare-credentials.md`](../../../../kb/platforms/cloudflare-credentials.md).
- **Durable Object classes** use SQLite storage (`new_sqlite_classes` in the first migration),
  which the free plan requires.
- **Known traps from this repo's lessons:** a sandboxed agent session cannot reach its own
  `*.workers.dev` URL (error 1042), so live checks after a deploy happen in a real browser
  ([`/kb/lessons/sandbox-egress-limits.md`](../../../../kb/lessons/sandbox-egress-limits.md)), and
  a polluted Wrangler cache can deploy stale code
  ([`/kb/lessons/wrangler-cache-pollution.md`](../../../../kb/lessons/wrangler-cache-pollution.md)).
  CI builds from a clean checkout for that reason.
- **A deploy restarts live matches' Durable Objects**; clients reconnect and matches restore from
  their snapshots ([architecture](architecture.md#presence-and-pauses)). Production deploys are
  still best done when traffic is low.

## Code gates

Run from `projects/garbage-day/` before every commit that touches `src/`, in addition to the KB
gates:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker && pnpm build
```

CI adds `pnpm e2e` and `pnpm audit`. Until the app shell (`GD-TICKET-011`) brings the first
Durable Object tests, `pnpm test:worker` only prints that there are none yet, so the gate line
stays the same from the start.
