-- =============================================================================
-- schema.sql — Postgres schema (server/data-model.md). Metadata in Postgres;
-- audio (FLAC) and features (Parquet) live on the filesystem, referenced by path.
-- DO NOT put audio in the database.
-- =============================================================================

CREATE TABLE IF NOT EXISTS fixtures (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    location        TEXT,
    type            TEXT,
    hot_cold        TEXT CHECK (hot_cold IN ('hot','cold','na')),
    branch_material TEXT,               -- 'copper' | 'pex' | ... ; explains HF-signature variance
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    id             SERIAL PRIMARY KEY,
    kind           TEXT NOT NULL CHECK (kind IN ('calibration','validation','ambient')),
    started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at       TIMESTAMPTZ,
    operator_note  TEXT,
    ambient_temp_c REAL,                -- nuisance-variable tracking (seasonal shift)
    pinned         BOOLEAN NOT NULL DEFAULT FALSE,  -- exclude features from rolling delete
    notes          TEXT
);

CREATE TABLE IF NOT EXISTS labels (
    id             SERIAL PRIMARY KEY,
    session_id     INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    fixture_id     INTEGER REFERENCES fixtures(id),
    action         TEXT NOT NULL CHECK (action IN ('open','close','steady','flush')),
    valve_position TEXT CHECK (valve_position IN ('trickle','half','full','na')),
    t_start_utc_us BIGINT NOT NULL,     -- SERVER-timestamped on operator tap
    t_end_utc_us   BIGINT
);

CREATE TABLE IF NOT EXISTS events (
    id         SERIAL PRIMARY KEY,
    node_id    TEXT NOT NULL,
    event_id   TEXT NOT NULL UNIQUE,    -- device UUID; join key for the clip
    t_utc_us   BIGINT NOT NULL,
    t_mono_us  BIGINT NOT NULL,
    kind       TEXT NOT NULL,           -- edge | manual | scheduled
    direction  TEXT,                    -- rising | falling (HINT only, not a classification)
    clip_path  TEXT
);

CREATE TABLE IF NOT EXISTS clips (
    id          SERIAL PRIMARY KEY,
    event_id    TEXT REFERENCES events(event_id) ON DELETE SET NULL,
    path        TEXT NOT NULL,
    sample_rate INTEGER NOT NULL,
    duration_s  REAL,
    sha256      TEXT NOT NULL           -- silent corruption of the training corpus is expensive
);

CREATE TABLE IF NOT EXISTS features (
    node_id  TEXT NOT NULL,
    t_utc_us BIGINT NOT NULL,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,  -- NULL for ambient stream
    path     TEXT NOT NULL,             -- hourly Parquet rollup
    PRIMARY KEY (node_id, t_utc_us)
);

CREATE TABLE IF NOT EXISTS inferences (
    id            SERIAL PRIMARY KEY,
    event_id      TEXT REFERENCES events(event_id) ON DELETE CASCADE,
    fixture_id    INTEGER REFERENCES fixtures(id),
    confidence    REAL,
    model_version TEXT NOT NULL,        -- every inference is attributable to a model
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fixture_state (
    t_utc_us      BIGINT PRIMARY KEY,
    open_set      JSONB NOT NULL,
    source        TEXT NOT NULL CHECK (source IN ('transient','steady_state')),  -- provenance
    model_version TEXT
);

CREATE TABLE IF NOT EXISTS chirps (
    id          SERIAL PRIMARY KEY,
    node_id     TEXT NOT NULL,
    t_utc_us    BIGINT NOT NULL,
    clip_path   TEXT,
    irf_path    TEXT,
    drift_metric REAL,
    structural_metric REAL,
    deferred    BOOLEAN NOT NULL DEFAULT FALSE   -- counted separately from failures (AC7)
);

CREATE TABLE IF NOT EXISTS alerts (
    id             SERIAL PRIMARY KEY,
    kind           TEXT NOT NULL,       -- leak | drift | node_offline | adc_clip | clip_missing
    severity       TEXT NOT NULL,
    t_utc_us       BIGINT NOT NULL,
    detail         JSONB,
    acknowledged_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS models (
    id         SERIAL PRIMARY KEY,
    version    TEXT NOT NULL UNIQUE,
    kind       TEXT NOT NULL CHECK (kind IN ('transient','nmf')),
    path       TEXT,
    trained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metrics    JSONB,                   -- both random-split AND session-holdout, plus the gap
    active     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_events_t ON events(t_utc_us);
CREATE INDEX IF NOT EXISTS idx_labels_session ON labels(session_id);
CREATE INDEX IF NOT EXISTS idx_features_session ON features(session_id);
CREATE INDEX IF NOT EXISTS idx_fixture_state_t ON fixture_state(t_utc_us);
