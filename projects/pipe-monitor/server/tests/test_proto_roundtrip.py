"""Cross-language check: parse bytes produced by the ACTUAL firmware serializer
(firmware/main/proto.c) with the server parser (app/proto.py). This is what
guarantees node and server agree on the wire format."""
import os
import subprocess
import pytest
from app.proto import parse_feature_batch, dequantize_bins, PROTO_VERSION

HERE = os.path.dirname(__file__)
FW_MAIN = os.path.abspath(os.path.join(HERE, "..", "..", "firmware", "main"))


@pytest.fixture(scope="module")
def golden_bytes(tmp_path_factory):
    if not os.path.exists(os.path.join(FW_MAIN, "proto.c")):
        pytest.skip("firmware proto.c not present")
    binp = str(tmp_path_factory.mktemp("fw") / "emit")
    r = subprocess.run(
        ["cc", "-std=c11", "-I", FW_MAIN, "-o", binp,
         os.path.join(HERE, "emit_batch.c"), os.path.join(FW_MAIN, "proto.c")],
        capture_output=True, text=True)
    if r.returncode != 0:
        pytest.skip("cannot compile firmware emitter: " + r.stderr)
    out = subprocess.run([binp], capture_output=True)
    return out.stdout


def test_firmware_batch_parses(golden_bytes):
    batch = parse_feature_batch(golden_bytes)
    assert batch.version == PROTO_VERSION
    assert batch.t0_utc_us == 1735689600000000
    assert batch.t0_mono_us == 84213000000
    assert batch.frame_period_us == 64000
    assert len(batch.frames) == 3
    # scale_db values the emitter wrote: -10, -11, -12
    assert abs(batch.frames[0].scale_db - (-10.0)) < 1e-5
    assert abs(batch.frames[2].scale_db - (-12.0)) < 1e-5
    assert abs(batch.frames[1].ultrasonic_rms - 0.02) < 1e-6
    # bins are 257 int8; bin 0 == 0, and dequantize maps to <= 0 dB
    assert len(batch.frames[0].bins) == 257
    db = dequantize_bins(batch.frames[0].bins)
    assert db[0] == 0.0
    assert all(d <= 0.0 for d in db)


def test_unknown_version_rejected():
    from app.proto import ProtoError
    bad = bytearray(24 + 265)
    bad[0] = 99  # bogus version
    with pytest.raises(ProtoError):
        parse_feature_batch(bytes(bad))
