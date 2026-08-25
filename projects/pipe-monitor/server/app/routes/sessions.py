"""Calibration session + labelling endpoints (protocol/http-endpoints.md).

The SERVER timestamps each label on the operator's tap — the client never sends a
time. This bounds label-alignment error at human reaction time to a prompt rather
than at clock-comparison after the fact, which is what makes calibration data
usable (published work kept only ~40% of manually-timed samples).
"""
from __future__ import annotations

import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..deps import get_repo
from ..repository import Repository

router = APIRouter(prefix="/api/v1", tags=["calibration"])


def _now_us() -> int:
    return int(time.time() * 1_000_000)


class SessionCreate(BaseModel):
    kind: str = "calibration"          # calibration | validation | ambient
    ambient_temp_c: float | None = None
    note: str | None = None


class LabelCreate(BaseModel):
    fixture_id: int | None = None
    action: str                        # open | close | steady | flush
    valve_position: str | None = None  # trickle | half | full | na
    # NOTE: deliberately NO timestamp field — the server stamps it.


@router.post("/sessions")
def create_session(body: SessionCreate, repo: Repository = Depends(get_repo)):
    return repo.create_session(body.kind, body.ambient_temp_c, body.note)


@router.post("/sessions/{sid}/labels")
def add_label(sid: int, body: LabelCreate, repo: Repository = Depends(get_repo)):
    return repo.add_label(sid, body.fixture_id, body.action, body.valve_position, _now_us())


@router.post("/sessions/{sid}/end")
def end_session(sid: int, repo: Repository = Depends(get_repo)):
    s = repo.end_session(sid, _now_us())
    if not s:
        raise HTTPException(404, "session not found")
    return s


@router.get("/sessions/{sid}/coverage")
def coverage(sid: int, repo: Repository = Depends(get_repo)):
    return repo.coverage(sid)
