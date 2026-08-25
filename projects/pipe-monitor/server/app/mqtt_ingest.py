"""MQTT ingest (protocol/mqtt-topics.md). Subscribes to features/events/status and
routes them into the repository. The feature-batch handler parses the binary with
proto.parse_feature_batch and rejects unknown versions loudly.

The pure routing logic (handle_feature_payload / handle_event_payload) is
testable without a broker; connect() wires it to aiomqtt in a real run.
"""
from __future__ import annotations

import json
import logging
from .proto import parse_feature_batch, ProtoError
from .repository import Repository

log = logging.getLogger("ingest")


def handle_feature_payload(repo: Repository, node_id: str, payload: bytes) -> int:
    """Parse a feature batch; return frame count ingested. Raises ProtoError on a
    malformed/unknown-version payload (fail loud — a misparsed stream would poison
    the training corpus)."""
    batch = parse_feature_batch(payload)
    # Real impl appends to the hourly Parquet rollup for node_id at batch.t0_utc_us
    # and tags it with the active session_id if a calibration session is running.
    log.debug("features %s: %d frames @ %d", node_id, len(batch.frames), batch.t0_utc_us)
    return len(batch.frames)


def handle_event_payload(repo: Repository, node_id: str, payload: bytes) -> dict:
    ev = json.loads(payload)
    # Create the event record on receipt; reconcile the clip when it lands, keyed
    # on event_id (the event normally arrives BEFORE the clip).
    ev.setdefault("node_id", node_id)
    return repo.record_event(ev)


async def connect(repo: Repository, broker_uri: str, node_id: str):  # pragma: no cover
    """Wire the handlers to aiomqtt. Kept out of the unit-tested path (needs a
    live broker)."""
    import aiomqtt  # optional dependency; only needed for a live run

    async with aiomqtt.Client(broker_uri) as client:
        await client.subscribe(f"pipe/{node_id}/features")
        await client.subscribe(f"pipe/{node_id}/events")
        await client.subscribe(f"pipe/{node_id}/status")
        async for msg in client.messages:
            topic = str(msg.topic)
            try:
                if topic.endswith("/features"):
                    handle_feature_payload(repo, node_id, msg.payload)
                elif topic.endswith("/events"):
                    handle_event_payload(repo, node_id, msg.payload)
            except ProtoError as e:
                log.error("rejected feature batch: %s", e)
