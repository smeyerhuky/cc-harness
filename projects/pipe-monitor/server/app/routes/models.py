"""Model training + activation (protocol/http-endpoints.md, server/training-pipeline.md).

holdout_session_id is a REQUIRED body field — the cheapest enforcement of the
session-holdout rule: a training run that cannot start without naming a holdout
cannot silently degrade into a random split. Activation refuses a model whose
gap exceeds the AC2 threshold unless an explicit override is passed (and logs it).
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..deps import get_repo
from ..repository import Repository
from ..training import (validate_train_request, training_sessions, build_metrics,
                        can_activate, HoldoutError, gap_interpretation)

log = logging.getLogger("models")
router = APIRouter(prefix="/api/v1/models", tags=["models"])


class TrainRequest(BaseModel):
    kind: str                          # transient | nmf
    session_ids: list[int]
    holdout_session_id: int            # REQUIRED — pydantic rejects if missing


@router.post("/train")
def train(body: TrainRequest, repo: Repository = Depends(get_repo)):
    try:
        validate_train_request(body.session_ids, body.holdout_session_id)
    except HoldoutError as e:
        raise HTTPException(422, str(e))

    train_ids = training_sessions(body.session_ids, body.holdout_session_id)
    # --- STUB: real pipeline assembles clips/labels, augments from train_ids only,
    #     fits templates/NMF, evaluates on BOTH random split and the held-out
    #     session. Until calibration data exists there is nothing to fit, so we
    #     record a metrics envelope with the correct shape and a null model. ---
    metrics = build_metrics(
        random_split_acc=0.0, session_holdout_acc=0.0,
        holdout_session_id=body.holdout_session_id,
        per_fixture={}, confusion=[], n_train=0, n_holdout=0,
    )
    metrics["note"] = ("stub: no calibration data yet; pipeline shape is real, "
                       "trains on sessions " + str(train_ids) +
                       " (holdout excluded from data AND augmentation)")
    version = f"{body.kind}-{len(repo.list_models()) + 1}"
    repo.create_model(version, body.kind, metrics)
    return {"version": version, "metrics": metrics,
            "gap_interpretation": gap_interpretation(metrics["gap"])}


@router.get("")
def list_models(repo: Repository = Depends(get_repo)):
    return repo.list_models()


class ActivateRequest(BaseModel):
    override: bool = False


@router.post("/{version}/activate")
def activate(version: str, body: ActivateRequest, repo: Repository = Depends(get_repo)):
    models = {m["version"]: m for m in repo.list_models()}
    m = models.get(version)
    if not m:
        raise HTTPException(404, "model not found")
    decision = can_activate(m["metrics"], override=body.override)
    if not decision.allowed:
        raise HTTPException(409, decision.reason)
    if body.override:
        log.warning("ACTIVATION OVERRIDE for %s: %s", version, decision.reason)
    repo.activate_model(version)
    return {"activated": version, "reason": decision.reason}
