"""Inference + observability endpoints (protocol/http-endpoints.md).

/spectrogram must downsample server-side (a day of features is 346 MB; the live
monitor needs a few hundred columns). The WS pushes state + level at 4 Hz.
"""
from __future__ import annotations

import asyncio
import json
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from ..deps import get_repo
from ..repository import Repository

router = APIRouter(prefix="/api/v1", tags=["inference"])


@router.get("/state")
def current_state(repo: Repository = Depends(get_repo)):
    return repo.get_state()


@router.get("/events")
def list_events(repo: Repository = Depends(get_repo), fixture_id: int | None = None):
    evs = list(repo.events.values()) if hasattr(repo, "events") else []
    return {"events": evs}


@router.get("/spectrogram")
def spectrogram(frm: int = 0, to: int = 0, cols: int = 300):
    # STUB: real impl reads the Parquet rollups for [frm,to] and downsamples to
    # `cols` columns server-side. Returns shape metadata until data exists.
    return {"from": frm, "to": to, "cols": cols, "bins": 257, "data": []}


@router.get("/drift")
def drift_history():
    # STUB: returns the nightly (coupling_drift, structural) series once chirps run.
    return {"series": []}


@router.websocket("/live")
async def live(ws: WebSocket):
    """State + level at 4 Hz for the live monitor."""
    await ws.accept()
    repo = ws.app.state.repo
    try:
        while True:
            await ws.send_text(json.dumps({"state": repo.get_state(), "level_db": None}))
            await asyncio.sleep(0.25)
    except WebSocketDisconnect:
        return
