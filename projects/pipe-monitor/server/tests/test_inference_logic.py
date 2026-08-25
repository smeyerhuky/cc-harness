"""Unit tests for the fully-implemented inference logic (no trained model needed):
state machine arbitration, feature preprocessing, augmentation hygiene, retention
pinning, and the training/holdout guards."""
import numpy as np
import pytest

from app.inference.state_machine import StateMachine
from app.inference import features as feat
from app.inference.augment import synthesize_overlaps, SEQUENCE_FIXTURES
from app.retention import features_to_delete, FEATURE_RETENTION_US
from app.training import (validate_train_request, training_sessions, can_activate,
                         build_metrics, HoldoutError)

US = 1_000_000


def test_transient_trusted_immediately():
    sm = StateMachine()
    sm.on_transient(0, "shower", "open")
    assert sm.open_set == {"shower"}
    sm.on_transient(1 * US, "shower", "close")
    assert sm.open_set == set()


def test_steady_state_overrides_only_after_sustained_disagreement():
    sm = StateMachine(hysteresis_us=60 * US)
    sm.on_transient(0, "kitchen", "open")            # state = {kitchen}
    # NMF disagrees (says tap) but only briefly -> no override yet
    sm.on_steady_state(10 * US, {"tap"})
    assert sm.open_set == {"kitchen"}
    # disagreement persists past 60 s -> adopt NMF, log a correction
    sm.on_steady_state(75 * US, {"tap"})
    assert sm.open_set == {"tap"}
    assert len(sm.corrections) == 1


def test_abstention_shortens_hysteresis():
    sm = StateMachine(hysteresis_us=60 * US, abstain_hysteresis_us=20 * US)
    sm.on_transient(0, None, "open")                 # abstain -> uncertain
    sm.on_steady_state(5 * US, {"bath"})
    assert sm.open_set == set()                       # not yet (5 < 20)
    sm.on_steady_state(25 * US, {"bath"})
    assert sm.open_set == {"bath"}                    # adopted after 20 s


def test_all_closed_gates_leak_detection():
    sm = StateMachine()
    assert sm.all_closed() is True
    sm.on_transient(0, "shower", "open")
    assert sm.all_closed() is False


def test_correction_rate_is_a_health_signal():
    sm = StateMachine(hysteresis_us=1)
    for i in range(3):
        base = i * 100 * US
        sm.on_transient(base, "a", "open")           # state = {a}
        sm.on_steady_state(base + 1, {"b"})          # start disagreement clock
        sm.on_steady_state(base + 10, {"b"})         # elapsed > 1 us -> correction
    assert len(sm.corrections) == 3
    rate = sm.correction_rate_per_day(window_us=86_400 * US, now_utc_us=300 * US)
    assert rate >= 3.0


def test_cv_mask_flags_dead_bins():
    # bin 0 constant (CV 0 -> drop), bin 1 varies a lot (keep)
    X = np.array([[5.0, 1.0], [5.0, 9.0], [5.0, 4.0], [5.0, 8.0]])
    mask = feat.cv_mask(X, keep_cv=0.05)
    assert mask[0] == False and mask[1] == True


def test_per_vector_minmax_is_shape_only():
    X = np.array([[1.0, 2.0, 3.0], [10.0, 20.0, 30.0]])  # same shape, diff level
    Y = feat.per_vector_minmax(X)
    assert np.allclose(Y[0], Y[1])                    # level removed


def test_augment_hygiene_only_uses_given_singles():
    rng = np.random.default_rng(0)
    singles = {"shower": np.abs(rng.normal(size=(20, 8))),
               "tap": np.abs(rng.normal(size=(20, 8))),
               "toilet": np.abs(rng.normal(size=(20, 8)))}
    X, Y, order = synthesize_overlaps(singles, n_synth=50, rng=rng, max_sources=3)
    assert X.shape == (50, 8) and Y.shape == (50, 3)
    # multi-label: some rows have >1 active source
    assert (Y.sum(axis=1) > 1).any()
    # toilet (a temporal sequence) is never mixed in
    ti = order.index("toilet")
    assert Y[:, ti].sum() == 0
    assert "toilet" in SEQUENCE_FIXTURES


def test_retention_pins_calibration_features():
    now = 100 * FEATURE_RETENTION_US
    rows = [
        {"node_id": "n", "t_utc_us": now - 1, "session_id": None, "path": "recent"},
        {"node_id": "n", "t_utc_us": now - 2 * FEATURE_RETENTION_US, "session_id": None, "path": "old_ambient"},
        {"node_id": "n", "t_utc_us": now - 2 * FEATURE_RETENTION_US, "session_id": 7, "path": "old_calib"},
    ]
    to_del = features_to_delete(rows, now, pinned_session_ids={7})
    paths = {r["path"] for r in to_del}
    assert paths == {"old_ambient"}          # recent kept; pinned calibration kept


def test_holdout_guard():
    with pytest.raises(HoldoutError):
        validate_train_request([1, 2], None)             # missing holdout
    with pytest.raises(HoldoutError):
        validate_train_request([1, 2], 3)                # holdout not in list
    with pytest.raises(HoldoutError):
        validate_train_request([1], 1)                   # need >=2 sessions
    validate_train_request([1, 2, 3], 3)                 # ok
    assert training_sessions([1, 2, 3], 3) == [1, 2]     # holdout excluded from data


def test_activation_gate():
    good = build_metrics(0.95, 0.90, 3, {}, [], 100, 30)   # gap 0.05
    bad = build_metrics(0.97, 0.80, 3, {}, [], 100, 30)    # gap 0.17
    assert can_activate(good).allowed is True
    assert can_activate(bad).allowed is False
    assert can_activate(bad, override=True).allowed is True
