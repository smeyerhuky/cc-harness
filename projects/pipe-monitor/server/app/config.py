"""Server configuration (server/data-model.md). Stack [SOFT]: FastAPI, Postgres,
Mosquitto. Runs with an in-memory repository out of the box so the API can be
exercised without a database; set DATABASE_URL to use Postgres."""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Settings:
    database_url: str | None = os.environ.get("DATABASE_URL")   # None -> in-memory repo
    mqtt_broker: str = os.environ.get("MQTT_BROKER", "mqtt://127.0.0.1:1883")
    clip_dir: str = os.environ.get("CLIP_DIR", "./data/clips")
    feature_dir: str = os.environ.get("FEATURE_DIR", "./data/features")
    node_id: str = os.environ.get("NODE_ID", "basement-main")


settings = Settings()
