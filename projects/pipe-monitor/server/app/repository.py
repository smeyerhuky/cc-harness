"""Repository abstraction over storage.

Routes depend on this Protocol, not on Postgres directly, so the API can be
exercised end-to-end with an in-memory backend in tests and local runs. A
Postgres implementation (asyncpg, schema.sql) is the production backend; the
in-memory one mirrors its semantics for the fields the routes touch.
"""
from __future__ import annotations

import itertools
from typing import Any, Protocol


class Repository(Protocol):
    def create_session(self, kind: str, ambient_temp_c: float | None, note: str | None) -> dict: ...
    def add_label(self, session_id: int, fixture_id: int | None, action: str,
                  valve_position: str | None, t_start_utc_us: int) -> dict: ...
    def end_session(self, session_id: int, t_utc_us: int) -> dict | None: ...
    def coverage(self, session_id: int) -> dict: ...
    def add_fixture(self, **kw) -> dict: ...
    def list_fixtures(self) -> list[dict]: ...
    def record_event(self, ev: dict) -> dict: ...
    def record_clip(self, clip: dict) -> dict: ...
    def create_model(self, version: str, kind: str, metrics: dict) -> dict: ...
    def list_models(self) -> list[dict]: ...
    def activate_model(self, version: str) -> dict | None: ...
    def get_state(self) -> dict: ...


class InMemoryRepository:
    """Deterministic, dependency-free backend for tests and local runs."""

    def __init__(self) -> None:
        self._ids = itertools.count(1)
        self.sessions: dict[int, dict] = {}
        self.labels: list[dict] = []
        self.fixtures: dict[int, dict] = {}
        self.events: dict[str, dict] = {}
        self.clips: list[dict] = []
        self.models: dict[str, dict] = {}
        self.open_set: set[str] = set()

    # sessions -----------------------------------------------------------------
    def create_session(self, kind, ambient_temp_c=None, note=None):
        sid = next(self._ids)
        # calibration/validation sessions are pinned so retention won't drop them
        s = {"id": sid, "kind": kind, "ambient_temp_c": ambient_temp_c,
             "operator_note": note, "ended_at": None,
             "pinned": kind in ("calibration", "validation")}
        self.sessions[sid] = s
        return s

    def add_label(self, session_id, fixture_id, action, valve_position, t_start_utc_us):
        lb = {"id": next(self._ids), "session_id": session_id, "fixture_id": fixture_id,
              "action": action, "valve_position": valve_position,
              "t_start_utc_us": t_start_utc_us}
        self.labels.append(lb)
        return lb

    def end_session(self, session_id, t_utc_us):
        s = self.sessions.get(session_id)
        if not s:
            return None
        s["ended_at"] = t_utc_us
        return s

    def coverage(self, session_id):
        cells: dict[str, int] = {}
        for lb in self.labels:
            if lb["session_id"] != session_id:
                continue
            key = f'{lb["fixture_id"]}|{lb["valve_position"]}'
            cells[key] = cells.get(key, 0) + 1
        return {"session_id": session_id, "cells": cells,
                "populated": sum(1 for v in cells.values() if v >= 10)}

    # fixtures -----------------------------------------------------------------
    def add_fixture(self, **kw):
        fid = next(self._ids)
        f = {"id": fid, **kw}
        self.fixtures[fid] = f
        return f

    def list_fixtures(self):
        return list(self.fixtures.values())

    # ingest -------------------------------------------------------------------
    def record_event(self, ev):
        self.events[ev["event_id"]] = ev
        return ev

    def record_clip(self, clip):
        self.clips.append(clip)
        # reconcile with a possibly-earlier event (event arrives before the clip)
        ev = self.events.get(clip.get("event_id"))
        if ev:
            ev["clip_path"] = clip["path"]
        return clip

    # models -------------------------------------------------------------------
    def create_model(self, version, kind, metrics):
        m = {"version": version, "kind": kind, "metrics": metrics, "active": False}
        self.models[version] = m
        return m

    def list_models(self):
        return list(self.models.values())

    def activate_model(self, version):
        m = self.models.get(version)
        if not m:
            return None
        for other in self.models.values():
            other["active"] = False
        m["active"] = True
        return m

    def get_state(self):
        return {"open_set": sorted(self.open_set)}
