"""Clip ingest (protocol/http-endpoints.md). Body is FLAC/WAV; headers carry the
trigger and device start time; event_id (query) joins to the MQTT event message.
Compute and store a SHA-256 on receipt — clip files are the training corpus and
silent corruption would be expensive."""
from __future__ import annotations

import hashlib
import os
import time
from fastapi import APIRouter, Depends, Request, Header
from ..deps import get_repo
from ..repository import Repository
from ..config import settings

router = APIRouter(prefix="/api/v1", tags=["ingest"])


@router.post("/nodes/{node_id}/clips")
async def upload_clip(node_id: str, request: Request, event_id: str = "",
                      x_clip_trigger: str = Header(default="edge"),
                      x_clip_start_us: str = Header(default="0"),
                      repo: Repository = Depends(get_repo)):
    body = await request.body()
    sha = hashlib.sha256(body).hexdigest()
    os.makedirs(settings.clip_dir, exist_ok=True)
    ext = "flac" if request.headers.get("content-type", "").endswith("flac") else "wav"
    path = os.path.join(settings.clip_dir, f"{event_id or sha[:12]}.{ext}")
    with open(path, "wb") as f:
        f.write(body)
    clip = {"event_id": event_id, "path": path, "sha256": sha,
            "trigger": x_clip_trigger, "start_us": int(x_clip_start_us or 0),
            "bytes": len(body), "received_utc_us": int(time.time() * 1e6)}
    repo.record_clip(clip)
    return {"stored": True, "sha256": sha, "path": path, "bytes": len(body)}
