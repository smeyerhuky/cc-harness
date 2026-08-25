import { useEffect, useState } from "react";
import { api } from "../api";

// Drift dashboard + alerts (frontend/monitoring-and-alerts.md). The four health
// traces are all available WITHOUT ground truth, which makes them the only
// quality signals during unattended operation. Coupling drift and structural
// change are shown as SEPARATE traces — conflating them destroys the signal.

interface DriftPoint { t: number; coupling: number; structural: number; }

export function DriftDashboard() {
  const [series, setSeries] = useState<DriftPoint[]>([]);

  useEffect(() => {
    api.drift().then((r) => setSeries(r.series ?? [])).catch(() => {});
  }, []);

  return (
    <section className="card">
      <h2>Health traces (no ground truth required)</h2>
      <p className="muted">
        Correction rate, coupling drift, discrete structural change, and ADC clip count mean three
        different things and must be visually separable at a glance.
      </p>

      <Trace label="Coupling drift (broad, smooth → recalibrate)" color="#4a90d9"
             values={series.map((p) => p.coupling)} />
      <Trace label="Structural change (discrete reflection → leak/rupture alert)" color="#d9534f"
             values={series.map((p) => p.structural)} />

      {series.length === 0 && (
        <p className="muted">
          No chirp history yet. The nightly exciter sweep (Phase 4) populates this; drift is only
          meaningful as a long series.
        </p>
      )}

      <h2>Alerts</h2>
      <table className="events">
        <thead><tr><th>kind</th><th>trigger</th><th>ack</th></tr></thead>
        <tbody>
          <tr><td>Leak</td><td>either detector fires (passive band energy or active chirp change)</td><td>—</td></tr>
          <tr><td>Drift</td><td>coupling metric exceeds threshold</td><td>—</td></tr>
          <tr><td>Node offline</td><td>heartbeat missed</td><td>—</td></tr>
          <tr><td>ADC clipping</td><td>clip count rising (water hammer past the clamps)</td><td>—</td></tr>
        </tbody>
      </table>
      <p className="muted">
        Local notification only — no cloud push. Every alert requires acknowledgement; one that can
        be ignored silently is not an alert.
      </p>
    </section>
  );
}

function Trace({ label, color, values }: { label: string; color: string; values: number[] }) {
  const w = 600, h = 60;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${h - (v / max) * h}`);
  return (
    <div className="trace">
      <div className="trace-label" style={{ color }}>{label}</div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark">
        {values.length > 1 && <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2} />}
      </svg>
    </div>
  );
}
