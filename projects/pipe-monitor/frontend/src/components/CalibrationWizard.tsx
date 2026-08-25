import { useMemo, useRef, useState } from "react";
import { api } from "../api";

// The highest-value screen (frontend/calibration-wizard.md). The wizard DRIVES
// the operator through the coverage matrix; every label is timestamped by the
// SERVER on tap (api.addLabel sends no time). Responsive — used on a phone.

interface Fixture {
  name: string;
  hasHotCold: boolean;      // toilets have neither
  hasValvePos: boolean;
}

// In a real deployment this comes from GET /api/v1/fixtures; seeded here so the
// wizard is usable immediately. Fixture-aware prompting only asks valid cells.
const FIXTURES: Fixture[] = [
  { name: "Kitchen sink", hasHotCold: true, hasValvePos: true },
  { name: "Bathroom sink", hasHotCold: true, hasValvePos: true },
  { name: "Shower", hasHotCold: true, hasValvePos: true },
  { name: "Toilet", hasHotCold: false, hasValvePos: false },
  { name: "Washing machine", hasHotCold: true, hasValvePos: false },
];

interface Cell { fixture: string; hotCold: string; valve: string; }

function buildMatrix(): Cell[] {
  const cells: Cell[] = [];
  for (const f of FIXTURES) {
    const temps = f.hasHotCold ? ["cold", "hot"] : ["na"];
    const valves = f.hasValvePos ? ["trickle", "half", "full"] : ["na"];
    for (const hc of temps) for (const v of valves) cells.push({ fixture: f.name, hotCold: hc, valve: v });
  }
  return cells;
}

export function CalibrationWizard() {
  const matrix = useMemo(buildMatrix, []);
  const [sid, setSid] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [temp, setTemp] = useState("");
  const timer = useRef<number | null>(null);

  const cell = matrix[idx];

  async function start() {
    const s = await api.createSession("calibration", temp ? Number(temp) : undefined);
    setSid(s.id);
  }

  // A live level meter matters: the operator must see the sensor is alive before
  // spending 30 s on a cell. (Fed by the WS in a real build; simulated here.)
  function pulse() {
    timer.current = window.setInterval(() => setLevel(20 + Math.random() * 70), 120);
  }
  function stopPulse() {
    if (timer.current) window.clearInterval(timer.current);
    setLevel(0);
  }

  async function openFixture() {
    if (sid == null) return;
    setRecording(true); pulse();
    await api.addLabel(sid, null, "open", cell.valve === "na" ? undefined : cell.valve);
  }
  async function closeFixture(redo = false) {
    if (sid == null) return;
    await api.addLabel(sid, null, "close", cell.valve === "na" ? undefined : cell.valve);
    setRecording(false); stopPulse();
    if (!redo) {
      setDone((d) => new Set(d).add(idx));
      setIdx((i) => Math.min(i + 1, matrix.length - 1));
    }
  }

  const pct = Math.round((done.size / matrix.length) * 100);

  if (sid == null) {
    return (
      <section className="card">
        <h2>Start a calibration session</h2>
        <p className="muted">
          Calibration must span ≥3 sessions across ≥3 weeks at varied times of day — that is what
          lets the session-holdout gate run. This is one session.
        </p>
        <label>
          Ambient temperature (°C, optional):{" "}
          <input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="14.5" />
        </label>
        <button className="primary" onClick={start}>Start session</button>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <p className="muted">{done.size} / {matrix.length} cells ({pct}%)</p>

      <div className="prompt">
        <div className="fixture">{cell.fixture}</div>
        <div className="sub">
          {cell.hotCold !== "na" && <span className={`tag ${cell.hotCold}`}>{cell.hotCold.toUpperCase()}</span>}
          {cell.valve !== "na" && <span className="tag">{cell.valve.toUpperCase()}</span>}
        </div>
      </div>

      <div className="meter"><div className="bar" style={{ width: `${level}%` }} /></div>

      {!recording ? (
        <button className="primary" onClick={openFixture}>START — open the fixture</button>
      ) : (
        <>
          <p className="rec">● recording…</p>
          <button className="primary" onClick={() => closeFixture(false)}>Now CLOSE it</button>
          <button onClick={() => closeFixture(true)}>Redo this cell</button>
        </>
      )}

      <div className="grid">
        {matrix.map((c, i) => (
          <div key={i}
               className={`gc ${done.has(i) ? "green" : ""} ${i === idx ? "cur" : ""}`}
               title={`${c.fixture} ${c.hotCold} ${c.valve}`}
               onClick={() => setIdx(i)} />
        ))}
      </div>

      <div className="row">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))}>◀ Prev</button>
        <button onClick={async () => { await api.endSession(sid); setSid(null); setDone(new Set()); setIdx(0); }}>
          End session
        </button>
      </div>
    </section>
  );
}
