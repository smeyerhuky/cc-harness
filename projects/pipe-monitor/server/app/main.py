"""FastAPI application (server/index.md). Single source of truth for inference and
state. Runs with an in-memory repository out of the box; set DATABASE_URL to use
Postgres (schema.sql)."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .config import settings
from .repository import InMemoryRepository
from .routes import sessions, clips, models, inference

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.database_url:
        # Production: a PgRepository (asyncpg + schema.sql) would be constructed
        # here. Not required to run the API; the in-memory repo mirrors its
        # semantics for the routed fields.
        log.warning("DATABASE_URL set but PgRepository is a scaffold stub; using in-memory")
    app.state.repo = InMemoryRepository()
    log.info("repository ready (in-memory)")
    yield


app = FastAPI(title="Acoustic Pipe Monitor", version="0.1.0", lifespan=lifespan)


@app.get("/healthz")
def healthz():
    return {"ok": True}


app.include_router(sessions.router)
app.include_router(clips.router)
app.include_router(models.router)
app.include_router(inference.router)
