# Frontend — Acoustic Pipe Monitor

React + Vite (TypeScript, strict). Calibration orchestration and observability. **No business
logic** — every decision is a server call.

Builds clean (`tsc -b && vite build`) and was screenshot-verified in headless Chromium.

## Screens

- **Calibration wizard** (`components/CalibrationWizard.tsx`) — the highest-value screen. Drives
  the operator through the coverage matrix; each label is **server-timestamped on tap**
  (`api.addLabel` sends no time), which is what makes calibration data usable. Fixture-aware
  prompting only asks valid cells (a toilet has no valve position / hot supply). Live level meter,
  redo-last-cell, live coverage grid. Responsive — meant for a phone while walking the house.
- **Live monitor** (`components/LiveMonitor.tsx`) — current open set (large), event feed with
  attribution + confidence, and the **correction control** that writes a new label (the cheapest
  hard-negative training data). Subscribes to `WS /api/v1/live` at 4 Hz.
- **Drift & alerts** (`components/DriftDashboard.tsx`) — coupling drift and structural change as
  **separate traces** (conflating them destroys the signal), plus the alert table. Local
  notification only, no cloud.

## Run

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 ; proxies /api and the WS to :8000
npm run build      # tsc strict + vite production build -> dist/
```

The dev server proxies `/api` (and the WebSocket) to the server on `:8000`, so run the server
alongside for live data. Without the server the screens render with empty state.

## Where the seams are

- `src/api.ts` is the whole server contract. Fixtures are currently seeded in the wizard; a fuller
  build reads `GET /api/v1/fixtures`.
- The correction control currently `prompt()`s for the true fixture and shows what it *would* POST;
  wire it to a real correction-label endpoint when the inference path is live.
- The level meter is simulated until the `WS /api/v1/live` `level_db` field carries real data.
