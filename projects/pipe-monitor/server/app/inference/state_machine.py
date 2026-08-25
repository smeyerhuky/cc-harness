"""Authoritative open-set tracker (inference/state-machine.md).

This is the component that makes the system a *tracker*, not a per-frame
*classifier*. Transient events are trusted immediately; steady-state (NMF)
estimates only override after SUSTAINED disagreement — the asymmetry that
prevents the flickering per-frame classifiers suffer from.

Fully implemented and testable with synthetic events (no trained model needed).
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Correction:
    t_utc_us: int
    added: set[str]
    removed: set[str]


@dataclass
class StateMachine:
    hysteresis_us: int = 60_000_000          # 60 s sustained disagreement to adopt NMF
    abstain_hysteresis_us: int = 20_000_000  # drop to 20 s after an abstention
    open_set: set[str] = field(default_factory=set)
    corrections: list[Correction] = field(default_factory=list)
    _uncertain: bool = False
    _disagree_since: int | None = None

    # --- transient path (primary) -------------------------------------------
    def on_transient(self, t_utc_us: int, fixture: str | None, direction: str) -> None:
        """A classified transient. fixture=None means the classifier abstained:
        we know *something* changed but not what — mark uncertain and lean on the
        steady-state path, but never guess (a forced label causes a wrong state
        transition that persists)."""
        if fixture is None:
            self._uncertain = True
            return
        if direction == "open":
            self.open_set.add(fixture)
        elif direction == "close":
            self.open_set.discard(fixture)
        self._uncertain = False
        self._disagree_since = None

    # --- steady-state path (confirmatory) -----------------------------------
    def on_steady_state(self, t_utc_us: int, nmf_active: set[str]) -> None:
        """Called ~every 10 s with the NMF active set. Adopt it only after the
        disagreement persists past the hysteresis window."""
        if nmf_active == self.open_set:
            self._disagree_since = None
            return
        if self._disagree_since is None:
            self._disagree_since = t_utc_us
        window = self.abstain_hysteresis_us if self._uncertain else self.hysteresis_us
        if t_utc_us - self._disagree_since >= window:
            added = nmf_active - self.open_set
            removed = self.open_set - nmf_active
            self.corrections.append(Correction(t_utc_us, set(added), set(removed)))
            self.open_set = set(nmf_active)
            self._disagree_since = None
            self._uncertain = False

    # --- health signal -------------------------------------------------------
    def correction_rate_per_day(self, window_us: int, now_utc_us: int) -> float:
        """Steady-state correction rate is the primary health metric available
        WITHOUT ground truth (rising rate ⇒ drift / fouled aerator / new fixture)."""
        cutoff = now_utc_us - window_us
        recent = [c for c in self.corrections if c.t_utc_us >= cutoff]
        days = window_us / 86_400_000_000
        return len(recent) / days if days > 0 else 0.0

    def all_closed(self) -> bool:
        """Passive leak detection only runs while the state machine reports all
        fixtures closed — so state errors propagate into false leak alerts."""
        return len(self.open_set) == 0 and not self._uncertain
