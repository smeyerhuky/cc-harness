"""Wire-format parsing, mirroring firmware/main/proto.c exactly.

The feature-batch binary is the node's continuous stream; the server must reject
unknown versions loudly rather than misparse (a silently misinterpreted stream
would poison the training corpus). See protocol/feature-batch-format.md.
"""
from __future__ import annotations

import struct
from dataclasses import dataclass

PROTO_VERSION = 1
BIN_COUNT = 257
HEADER_FMT = "<BBHqqI"           # version,frame_count,bin_count,t0_utc,t0_mono,frame_period
HEADER_SIZE = struct.calcsize(HEADER_FMT)   # 24
FRAME_FIXED_FMT = "<ff"          # scale_db, ultrasonic_rms
FRAME_FIXED_SIZE = struct.calcsize(FRAME_FIXED_FMT)   # 8
FRAME_SIZE = FRAME_FIXED_SIZE + BIN_COUNT             # 265


@dataclass
class Frame:
    scale_db: float
    ultrasonic_rms: float
    bins: bytes            # 257 signed int8, dB below peak


@dataclass
class FeatureBatch:
    version: int
    t0_utc_us: int
    t0_mono_us: int
    frame_period_us: int
    frames: list[Frame]


class ProtoError(ValueError):
    """Raised on malformed or unknown-version payloads (fail loud)."""


def parse_feature_batch(data: bytes) -> FeatureBatch:
    if len(data) < HEADER_SIZE:
        raise ProtoError(f"short header: {len(data)} < {HEADER_SIZE}")
    version, frame_count, bin_count, t0_utc, t0_mono, period = struct.unpack_from(HEADER_FMT, data, 0)
    if version != PROTO_VERSION:
        raise ProtoError(f"unknown feature-batch version {version} (expected {PROTO_VERSION})")
    if bin_count != BIN_COUNT:
        raise ProtoError(f"unexpected bin_count {bin_count} (expected {BIN_COUNT})")
    need = HEADER_SIZE + frame_count * FRAME_SIZE
    if len(data) != need:
        raise ProtoError(f"length {len(data)} != header+{frame_count}*{FRAME_SIZE}={need}")

    frames: list[Frame] = []
    off = HEADER_SIZE
    for _ in range(frame_count):
        scale_db, us = struct.unpack_from(FRAME_FIXED_FMT, data, off)
        off += FRAME_FIXED_SIZE
        bins = data[off:off + BIN_COUNT]
        off += BIN_COUNT
        frames.append(Frame(scale_db=scale_db, ultrasonic_rms=us, bins=bins))
    return FeatureBatch(version, t0_utc, t0_mono, period, frames)


def dequantize_bins(bins: bytes, log_floor_db: float = -96.0) -> list[float]:
    """int8 [-127,0] -> dB below peak [-96,0], inverse of the firmware mapping."""
    scale = (-log_floor_db) / 127.0
    return [b * scale for b in _as_signed(bins)]


def _as_signed(bins: bytes) -> list[int]:
    return [b - 256 if b > 127 else b for b in bins]
