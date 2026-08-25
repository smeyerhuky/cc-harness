"""Endpoint tests via FastAPI TestClient with a fresh in-memory repository.
Exercises the calibration flow, the [HARD] holdout requirement, the activation
gate, and clip ingest — no Postgres or broker required."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.repository import InMemoryRepository


@pytest.fixture()
def client():
    app.state.repo = InMemoryRepository()      # fresh per test
    return TestClient(app)


def test_health(client):
    assert client.get("/healthz").json() == {"ok": True}


def test_calibration_flow_server_timestamps_labels(client):
    s = client.post("/api/v1/sessions", json={"kind": "calibration", "ambient_temp_c": 14.5}).json()
    sid = s["id"]
    # label carries NO timestamp; server stamps it
    r = client.post(f"/api/v1/sessions/{sid}/labels",
                    json={"fixture_id": 1, "action": "open", "valve_position": "full"})
    assert r.status_code == 200
    assert r.json()["t_start_utc_us"] > 0
    cov = client.get(f"/api/v1/sessions/{sid}/coverage").json()
    assert cov["session_id"] == sid
    assert client.post(f"/api/v1/sessions/{sid}/end").status_code == 200


def test_train_requires_holdout(client):
    # missing holdout_session_id -> pydantic 422
    r = client.post("/api/v1/models/train", json={"kind": "transient", "session_ids": [1, 2]})
    assert r.status_code == 422
    # holdout not among session_ids -> our guard 422
    r = client.post("/api/v1/models/train",
                    json={"kind": "transient", "session_ids": [1, 2], "holdout_session_id": 9})
    assert r.status_code == 422


def test_train_and_activation_gate(client):
    r = client.post("/api/v1/models/train",
                    json={"kind": "transient", "session_ids": [1, 2, 3], "holdout_session_id": 3})
    assert r.status_code == 200
    body = r.json()
    m = body["metrics"]
    # both metrics present, gap computed
    assert "random_split_acc" in m and "session_holdout_acc" in m and "gap" in m
    version = body["version"]

    # stub metrics have gap 0.0 -> activatable
    a = client.post(f"/api/v1/models/{version}/activate", json={"override": False})
    assert a.status_code == 200
    assert client.get("/api/v1/models").json()[0]["active"] is True


def test_activation_gate_blocks_large_gap(client):
    # inject a model with a large gap directly to test the gate
    app.state.repo.create_model("bad-1", "transient",
                                {"gap": 0.20, "random_split_acc": 0.97, "session_holdout_acc": 0.77})
    blocked = client.post("/api/v1/models/bad-1/activate", json={"override": False})
    assert blocked.status_code == 409
    forced = client.post("/api/v1/models/bad-1/activate", json={"override": True})
    assert forced.status_code == 200


def test_clip_ingest_hashes_and_reconciles(client):
    # event arrives first (as on the wire), then the clip reconciles by event_id
    app.state.repo.record_event({"event_id": "e1", "node_id": "n", "t_utc_us": 1,
                                 "t_mono_us": 1, "kind": "edge", "direction": "rising"})
    r = client.post("/api/v1/nodes/n/clips?event_id=e1",
                    content=b"RIFFfake-wav-bytes",
                    headers={"Content-Type": "audio/wav", "X-Clip-Trigger": "edge",
                             "X-Clip-Start-Us": "42"})
    assert r.status_code == 200
    assert r.json()["stored"] is True and len(r.json()["sha256"]) == 64
    assert app.state.repo.events["e1"]["clip_path"].endswith("e1.wav")
