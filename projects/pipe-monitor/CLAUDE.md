# Acoustic Pipe Monitor — Working Rules for Claude Sessions

Governs `projects/pipe-monitor/`. A single-installation acoustic water-fixture disaggregation and
leak-detection system, scaffolded from the `pipe-monitor` deep-wiki implementation spec.

## What this project is

Four components that ship together:

```
cad/        parametric OpenSCAD — hybrid printed enclosure + pipe clamp (28.6 mm OD)
firmware/   ESP-IDF C — the deliberately dumb sensor node (acquire, feature, detect, upload)
server/     FastAPI + Postgres — all inference, all training, single source of truth
frontend/   React + Vite — calibration wizard, live monitor, drift dashboard (no business logic)
kb/         project OKF knowledge base — design, decisions, plan
```

The architecture is a three-tier split: a **dumb node** that does no classification, a **server**
that owns all inference and state, and a **frontend** with no business logic. Do not move
featurization or classification onto the device — that is the single most important architectural
decision in the source spec.

## Load-bearing rules (do not "fix" these)

- **`[HARD]` Keep featurization off the device.** The node ships a linear log-power spectrogram
  (257 bins, int8) at 15.6 fps, hop 1024 (frames do **not** overlap — deliberate, see
  `firmware/main/feature_stream.c`). The common error is setting hop = FFT/2; that quadruples
  storage for no gain.
- **`[HARD]` `scale_db` is not optional** in the feature batch. It is the leak detector's only
  absolute-level input; the int8 bins carry shape only.
- **`[HARD]` Session holdout.** `holdout_session_id` is required on `POST /api/v1/models/train`.
  The retention job must pin calibration-session features. Augmentation composes **only** from
  training-session singles.
- **`[HARD]` Multi-label, not multi-class.** Steady-state output is sigmoid (one node per fixture
  + a NoUse node), never softmax.
- **`[HARD]` Enclosure shielding.** The spec calls for die-cast aluminium; this build substitutes
  a **hybrid** printed shell with a copper-lined amp region + single-point ground. If you drop the
  copper lining, you reintroduce the 60 Hz ground-loop failure that lands on the leak band.

## Requirement markers

Preserved from the source spec:

- **`[HARD]`** — load-bearing. Changing it invalidates other parts. Surface dependents before
  changing.
- **`[SOFT]`** — a default to prevent bikeshedding. Substitute freely with reason.

## Knowledge base navigation

Start at [`kb/index.md`](kb/index.md):

- **[overview/](kb/overview/index.md)** — what the system is, and the pointer to the source spec
- **[decisions/](kb/decisions/index.md)** — where this scaffold diverges from the spec and why
  (hybrid enclosure, stubbed inference, placeholder params)
- **[plan/](kb/plan/index.md)** — the phase plan and the Phase 0 bring-up checklist

## Conventions

- **OKF hygiene:** `okf_version` only in `kb/index.md`; subdirectory `index.md` files are pure
  tables of contents; every content file carries `type/title/description/resource/tags/timestamp`.
  Lint: `python3 .claude/skills/okf-wikify/scripts/lint_okf.py projects/pipe-monitor/kb/`.
- **Document as you go.** Update `kb/`, `README.md`, `version.json`, and the project card under
  `projects/kb/projects/pipe-monitor.md` in the same change that produces the work.
- **Scaffold honesty.** When a file is a stub pending real data, say so in a header comment. Do
  not present untested inference code as validated.

## Build/validate

- **firmware** — ESP-IDF 5.x: `idf.py set-target esp32s3 && idf.py build` (needs the toolchain).
- **server** — `cd server && pip install -e . && uvicorn app.main:app` (needs Postgres + broker).
- **frontend** — `cd frontend && npm install && npm run build`.
- **cad** — `openscad -o enclosure.stl cad/enclosure.scad` (parametric; see `cad/README.md`).

## Related

- Projects rules: [`/projects/CLAUDE.md`](../CLAUDE.md)
- Project card: [`/projects/kb/projects/pipe-monitor.md`](../kb/projects/pipe-monitor.md)
