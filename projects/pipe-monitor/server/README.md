# Server — Acoustic Pipe Monitor

FastAPI + Postgres LAN server: MQTT/HTTP ingest, storage, the training pipeline, and inference.
**All inference and state live here** — the node does none. Runs with an in-memory repository out
of the box (no DB/broker needed) so the API and the calibration flow can be exercised immediately;
point `DATABASE_URL` at Postgres for the real backend.

## What's real vs. stubbed

**Real and tested (19 pytest cases):**
- Wire-format parser (`app/proto.py`) — validated against bytes from the **actual firmware
  serializer** (cross-language roundtrip test).
- State machine (`app/inference/state_machine.py`) — full arbitration, hysteresis, correction rate.
- Feature preprocessing (`app/inference/features.py`) — CV pruning, dual MA, per-vector norm.
- Augmentation **hygiene** (`app/inference/augment.py`) — composes only from training singles;
  toilets excluded from mixing; multi-label output.
- Training/holdout **guards** (`app/training.py`) — holdout required, dual metrics, activation gate.
- Retention **pinning** (`app/retention.py`) — calibration features survive the 90-day roll-off.
- All HTTP endpoints (sessions/labels/coverage, clip ingest, models train/activate) via TestClient.
- `schema.sql` — applies cleanly on Postgres 16 (11 tables, constraints, indexes).

**Honest stubs (shape real, no trained weights until Phase-0 data exists):**
- `templates.py` (bank empty), `nmf.py` (bases unfit), `leak.py`/`drift.py` (thresholds are
  Phase-4 placeholders), the `/models/train` fit step, and `/spectrogram` downsampling.
- `PgRepository` — the in-memory repo mirrors its semantics; the asyncpg impl is the production
  backend to fill in. See `app/repository.py`.

Why stubbed: the models are fit to **one installation** and there is nothing to train against until
your hardware records real water events. See `../kb/decisions/stubbed-inference.md`.

## Run it

```bash
cd server
pip install -e .            # or: pip install fastapi 'uvicorn[standard]' numpy pydantic
uvicorn app.main:app --reload --port 8000
# http://localhost:8000/docs   (OpenAPI UI)
```

With Postgres:

```bash
createdb pipe && psql pipe -f app/schema.sql
export DATABASE_URL=postgresql://localhost/pipe
uvicorn app.main:app
```

## Test

```bash
cd server && python3 -m pytest -q      # 19 passed
```

The proto roundtrip test compiles `../firmware/main/proto.c`, runs it to emit a golden batch, and
parses it with `app/proto.py` — so node and server can never silently disagree on the wire format.

## The disciplines enforced in code (not just documented)

| Discipline | Where | How |
|---|---|---|
| Session holdout is mandatory | `routes/models.py`, `training.py` | `holdout_session_id` is a required body field; `< 2` sessions or holdout-not-in-list → 422 |
| Augmentation can't leak the holdout | `inference/augment.py` | function takes only the training subset; no parameter can pass holdout data |
| Both metrics + the gap always | `training.py` | `build_metrics` always writes random-split, session-holdout, and gap |
| Activation gate (AC2) | `training.py`, `routes/models.py` | gap > 0.08 → 409 unless `override:true` (logged loudly) |
| Calibration features pinned | `retention.py` | pinned session_ids excluded from the 90-day delete |
| Fail loud on bad feature stream | `proto.py`, `mqtt_ingest.py` | unknown version → `ProtoError`, batch rejected |
| Server-timestamped labels | `routes/sessions.py` | label body has no time field; server stamps on tap |

## API surface (protocol/http-endpoints.md)

```
POST /api/v1/sessions                    POST /api/v1/sessions/{id}/labels
POST /api/v1/sessions/{id}/end           GET  /api/v1/sessions/{id}/coverage
POST /api/v1/nodes/{id}/clips            GET  /api/v1/state
GET  /api/v1/events                      GET  /api/v1/spectrogram   (downsampled)
GET  /api/v1/drift                       WS   /api/v1/live          (4 Hz)
POST /api/v1/models/train                GET  /api/v1/models
POST /api/v1/models/{version}/activate
```

## Tools

- `tools/phase0_check.py` — numeric Phase-0 gate (ρ>0.8, hum ≥20 dB down, CV sanity).
- `tools/plot_spectrograms.py` — renders the per-fixture panels that ARE the Phase-0 deliverable.
