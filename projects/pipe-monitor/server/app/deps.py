"""Shared dependencies. A single repository instance is stored on app state and
injected into routes so tests can swap in a fresh in-memory backend."""
from __future__ import annotations

from fastapi import Request
from .repository import Repository


def get_repo(request: Request) -> Repository:
    return request.app.state.repo
