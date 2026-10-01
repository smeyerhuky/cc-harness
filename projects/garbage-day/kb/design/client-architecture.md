---
type: "Architecture"
title: "Garbage Day — Client Architecture (React)"
description: "How the React client is built: packages and feature folders, the shared ui commons, the five layers of state (engine store, XState screen flow, Zustand preferences, router data, local component state), contexts and hooks, rendering boards on canvas outside React's render cycle, input, and how the proof of concept's client code maps onto components."
resource: "../process/journal/2026-09-30-design.md"
tags: ["design", "architecture", "react"]
timestamp: "2026-09-30"
relationships:
  - type: ELABORATES
    target: architecture.md
  - type: DERIVED_FROM
    target: ../process/journal/2026-09-30-design.md
---

# Garbage Day — Client Architecture (React)

The owner asked for "a react based project on the latest dependencies … components that are
modular, commons with reusable and effective use of modern … state and context management hooks".
This page says how. Versions are in [stack and CI](stack-and-ci.md); the system around the client
is in [architecture](architecture.md).

## Principles

1. **The game loop runs outside React.** The engine ticks at 60 Hz in a plain TypeScript loop, and
   boards are drawn on canvas from that loop. React never re-renders 60 times a second: it renders
   screens, panels and overlays, and re-renders only when a value it shows actually changes.
2. **State lives in the smallest place that works**, and each kind of state has one home (below).
   Nothing is copied between two stores.
3. **Commons first.** Anything used by two features lives in the `ui` package. Features never
   import from each other, only from `ui`, `engine`, `protocol` and their own folder.
4. **Let the React Compiler memoize.** Components are written plainly; no hand-written
   `useMemo`/`useCallback` unless a measurement shows the compiler missed something.
5. **Every screen works by keyboard and by touch**, and honours reduced motion.

## Packages and folders

```
projects/garbage-day/src/
├── engine/        @garbage-day/engine    pure TS, no DOM (see architecture.md)
├── protocol/      @garbage-day/protocol  message types and schemas
├── ui/            @garbage-day/ui        the commons: tokens, primitives, game widgets, hooks
│   ├── tokens/        tokens.css (generated from tokens.ts), fonts
│   ├── primitives/    Button, IconButton, Chip, Card, Dialog (native <dialog>), Popover (popover API),
│   │                  Sheet, Toggle, Select, Slider, Stepper, Toast, Kbd, VisuallyHidden
│   ├── game/          BoardCanvas, PieceGlyph, PowerIcon, Meter, SpeedChip, PresenceChip, HoldSlot,
│   │                  NextQueue, PowerSlot, Countdown, ShowdownBanner, Popup, AttackFlight, BoardCover,
│   │                  Confetti, clearLabel (the words for clears: "Quad", "T-spin Double")
│   ├── sound/         Sfx: the synthesized tones, played only while sound is on
│   ├── layout/        StageLayout (slots: left, centre, right, feed), ScreenFrame, ThumbZone
│   ├── hooks/         useReducedMotion, usePageVisibility, useWakeLock, useHaptics, useResizeObserver,
│   │                  useGestures, useKeyBindings, useAnimationFrame, useInterval, useColorScheme,
│   │                  useMediaQuery, useShake
│   └── gallery/       every token and widget in its states, served at /gallery (a visual check)
└── app/           @garbage-day/app       one Vite project: the client and the Worker
    ├── client/
    │   ├── main.tsx, App.tsx, routes.tsx
    │   ├── state/         appMachine.ts (XState), prefs.ts (Zustand), MatchSession.ts
    │   ├── net/           Socket (reconnect + outbox), clockSync.ts, lobbyClient.ts
    │   ├── bot/           bot.worker.ts (engine + Bot as a second client)
    │   └── features/
    │       ├── home/          HomeScreen: Quick match, Create game, Play a bot, handle
    │       ├── quick-match/   SearchingScreen, BotOfferPanel
    │       ├── private-game/  CreateGameForm, LobbyScreen (code, Copy, Share, Ready)
    │       ├── bot/           BotSetup (presets, skill and speed sliders)
    │       ├── match/         MatchScreen, PlayerPanel, OpponentPanel, CentreColumn, MatchFeed,
    │       │                  PausePopover, WaitBar, ReturnNote, TouchSurface, ButtonPad
    │       ├── results/       ResultCard, StatsTable, RematchButton
    │       └── settings/      SettingsSheet: controls, gestures, sound, motion
    └── worker/            index.ts (routes), LobbyDO.ts, MatchDO.ts
```

Each feature folder exports one public `index.ts`; its components, hooks and machine pieces stay
private to it. Every workspace package declares its side effects: `ui` has none apart from its
CSS, so a screen that uses one widget doesn't ship the rest, and `engine` and `protocol` have
none, so the first page carries only the constants it imports and the engine loads with the
match. `useKeyBindings` arrived with [`GD-STORY-001`](../process/backlog/GD-STORY-001.md) and
takes the player's keys since [`GD-STORY-003`](../process/backlog/GD-STORY-003.md);
`useGestures` arrives with [`GD-STORY-004`](../process/backlog/GD-STORY-004.md).

## Where state lives

| Kind of state | Home | How components read it |
|---|---|---|
| **The running match**: my board, opponent view, meter, speed, clock, pause and result info | `MatchSession`, a plain class that owns the engine, the socket and clock sync; it is an external store with `subscribe` and `getSnapshot` | `useMatch(selector)`, built on `useSyncExternalStore`, returning only the slice a component needs; canvases read the session directly each frame |
| **Which screen we are on and why**: home, searching, bot offer, lobby, countdown, playing, paused, result, rematch | `appMachine`, an XState v5 actor, with child actors for quick match and the private lobby | `AppActorContext` from `createActorContext`; `useSelector` for values, `useActorRef().send` for events |
| **Preferences**: handle, key bindings, DAS/ARR, gesture sensitivity, pad on/off, sound, motion override, bot presets, last match settings | a Zustand store with the `persist` middleware (localStorage, versioned, try/catch) | `usePrefs(selector)`; no provider needed |
| **Server data**: a private game's info from its code, the quick-match waiting count | React Router loaders and actions for `/g/:code` and create-game; the waiting count arrives on the lobby socket into `appMachine` context | `useLoaderData`, `useFetcher`, `useSelector` |
| **Local UI state**: an open sheet, a form draft, a hovered button | `useState` / `useReducer` in the component | — |

Why this split: the match changes every frame and must not trigger React renders, so it is an
external store with selectors. Screen flow has real states and guards (you cannot be paused
before the countdown), which is what a state machine is for. Preferences are small, flat and
persisted, which is what Zustand does with the least code. Server data belongs to the route that
needs it.

Saved preferences are checked field by field on load, and an invalid field takes its default, so
a stale or edited entry never breaks the page. The check does not use Zod: the first page loads
without it, and `@garbage-day/protocol/handle` gives the handle rule without the schema library
(the socket code brings Zod when online play needs it).

## Contexts

Few, narrow, and holding stable objects rather than changing values, so a context change never
re-renders the tree. `createStoreContext` (`client/state/storeContext.tsx`) builds one around an
external store, with a selector hook on `useSyncExternalStore`:

| Context | Provides | Provided by |
|---|---|---|
| `AppActorContext` | the app actor | `App` |
| `MatchSessionContext` | the current `MatchSession` (stable for a match) | `MatchScreen` |
| `InputContext` | the `InputController` the keyboard and touch hooks feed | `MatchScreen` |

Theme is a `data-theme` attribute on the root plus CSS tokens, not a context.

## Modern React used on purpose

| API | Where |
|---|---|
| `useSyncExternalStore` | `useMatch` selectors over `MatchSession` |
| `use(Context)` | reading contexts inside conditionals in feature components |
| `useActionState` | Create game settings form and the handle regenerate action |
| `useOptimistic` | the Ready toggle and Rematch button, before the DO confirms |
| `useTransition` | route changes into and out of a match |
| `useEffectEvent` | keyboard, gesture, visibility and wake-lock listeners that read the latest props without re-subscribing |
| `<Activity>` | keeps the match screen mounted but hidden while the settings sheet is full screen on a phone |
| `<Suspense>` + `lazy` | route-level code splitting; the match screen and bot worker load on demand |
| Error boundaries | one per route; a match error offers "Reconnect" before "Home" |
| React Compiler | automatic memoization across the app |

## Rendering

- `BoardCanvas` owns a canvas and a device-pixel-ratio aware size. It takes a `source` (a function
  returning the board to draw) and draws on `useAnimationFrame`. It ports the proof of concept's
  `BoardCanvas` class: bevelled cells, hazard-hatched garbage sprite, gem diamonds, ghost piece,
  line-clear flash, garbage-rise offset, fog.
- HUD numbers (lines, sent, speed) come from `useMatch` selectors that change only on events, so
  they re-render a few times a second at most.
- The session steps inside the canvas's own frame callback (`source(now)` calls
  `session.frame(now)`, which steps once per frame time). Effects run child-first, so a separate
  loop in `MatchScreen` would draw each board one frame late. A pending key press runs one tick
  early, so a move always shows in the first frame after the key (US-05).
- Motion that the DOM does well (popups, the attack flying through the centre column, countdown
  pops) uses CSS and the Web Animations API, and turns off with reduced motion.
- **Layouts.** `useMatchLayout` picks the arrangement from two media queries (a phone upright,
  a phone on its side; anything else is desktop), and `StageLayout`, the panels and the header
  follow it: the structure changes in components (no centre column upright, the clock in the
  header), and CSS sizes within it. A board's box takes the board's 1:2 shape so its side panel
  and meter hug it; `BoardCanvas` fills that box in whole cells, up to 36 px on desktop.
- Moments go out as **effects**, not state: `MatchSession.onEffect` reports a clear (with its
  words from `clearLabel`), a cancel, a gem banked, garbage landing, an attack routed, a shield
  block, a power-up used or applied, a showdown's announce, start and end, a top-out, and the
  player's own moves and locks. Each consumer plays them once: `BoardFx` (labels and the shake),
  `AttackLayer` (the flight, and the referee badge's pulse), and `useMatchSound` (the synth, while
  sound is on, and a vibration when garbage lands). State that lasts (the meter, the showdown
  banner, the stats) stays in the snapshot.

## Input

- `InputController` ports the proof of concept's `Human` class: held keys, pressed edges, DAS and
  ARR per tick. The engine reads it once per tick.
- `useKeyBindings` maps the player's bindings to controller actions and blocks page scrolling
  during a match.
- `input/bindings.ts` holds the rules for changing a binding, which the settings and the stored
  preferences share: a key another action uses is refused, Tab and Esc can't be bound, an action
  has one to three keys. Delay and rate are kept in milliseconds that are whole ticks (50 to 333
  ms, 17 to 100 ms), so what the settings show is what the engine counts.
- `useGestures` implements the gesture table in
  [controls and layout](../product/controls-and-layout.md#touch-gestures) with Pointer Events on
  the `TouchSurface`: axis lock after 12 px, a column per cell of horizontal travel, tap to rotate
  (left third counter-clockwise), slow drag to soft-drop, flick to hard-drop, swipe up to hold.
  The table itself is `GestureRecognizer`, a pure class fed positions and times, which the tests
  drive row by row.
- Gestures reach the engine through the same controller as keys: `nudge` for a column (queued,
  one per tick, so a fast swipe loses none), `drop` for rows down (the engine's `Input.drop`,
  which moves the piece down that many rows at once and stops where it lands), and `press` for
  the one-off actions.
- `ButtonPad` is the optional on-screen pad; it feeds the same controller, with keys held as
  keys are. `TouchControls` puts the pad, or the round power-up button on a touch screen, in the
  match screen's footer.

## Testing the client

- Commons and features: Testing Library, interacting the way a player does (roles, labels, keys).
- `appMachine`: pure actor tests, sending events and asserting states and context.
- `useGestures`: synthetic pointer sequences for every row of the gesture table, including the
  axis lock and the flick threshold.
- `MatchSession`: runs against a local referee from the engine, no network, with scripted inputs.

## What carries over from the proof of concept

| Proof of concept (`spikes/proof-of-concept/live/app.js`) | Becomes |
|---|---|
| `StageView` | `StageLayout` plus `PlayerPanel`, `OpponentPanel`, `CentreColumn` |
| `drawMatch` | `useMatch` selectors plus the two `BoardCanvas` sources |
| modal, wait bar, board cards | `PausePopover`, `WaitBar`, `ReturnNote`, `BoardCover` |
| side slots, meter, speed chip, presence chip | the `ui/game` widgets of the same names |
| pad and keyboard map | `ButtonPad`, `useKeyBindings` |
| `drawMachine` diagrams, wire log | a developer overlay, off by default |
