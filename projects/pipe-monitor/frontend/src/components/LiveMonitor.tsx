import { useEffect, useState } from "react";
import { api } from "../api";

// Live monitor (frontend/monitoring-and-alerts.md): current open set (large and
// legible), event feed with attribution + confidence, and the CORRECTION control
// — the cheapest source of hard-negative training data, since errors arrive
// pre-identified by a human who was standing there.

interface EventRow { event_id: string; direction?: string; kind: string; fixture?: string; confidence?: number; }

export function LiveMonitor() {
  const [openSet, setOpenSet] = useState<string[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Live state + level at 4 Hz over the WS (falls back silently if absent).
    let ws: WebSocket | null = null;
    try {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/api/v1/live`);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (d.state?.open_set) setOpenSet(d.state.open_set);
      };
    } catch { /* server not up in this environment */ }
    const poll = window.setInterval(() => {
      api.events().then((r) => setEvents(r.events ?? [])).catch(() => {});
    }, 2000);
    return () => { ws?.close(); window.clearInterval(poll); };
  }, []);

  async function correct(ev: EventRow) {
    // Marking a misattribution writes a NEW label that feeds the next training
    // run. Prompt for the true fixture (a select in a fuller build).
    const truth = window.prompt(`Correct attribution for event ${ev.event_id}: true fixture?`);
    if (truth) alert(`Would POST a correction label "${truth}" for ${ev.event_id}.`);
  }

  return (
    <section className="card">
      <div className="statusline">
        <span className={connected ? "dot on" : "dot"} /> {connected ? "live" : "offline"}
      </div>

      <h2>Currently open</h2>
      <div className="openset">
        {openSet.length === 0 ? <span className="muted">all closed</span>
          : openSet.map((f) => <span key={f} className="chip">{f}</span>)}
      </div>

      <h2>Recent events</h2>
      <table className="events">
        <thead><tr><th>event</th><th>kind</th><th>dir</th><th>fixture</th><th>conf</th><th></th></tr></thead>
        <tbody>
          {events.length === 0 && <tr><td colSpan={6} className="muted">no events yet</td></tr>}
          {events.map((e) => (
            <tr key={e.event_id}>
              <td className="mono">{e.event_id.slice(0, 8)}</td>
              <td>{e.kind}</td>
              <td>{e.direction ?? "—"}</td>
              <td>{e.fixture ?? <span className="muted">unattributed</span>}</td>
              <td>{e.confidence != null ? e.confidence.toFixed(2) : "—"}</td>
              <td><button onClick={() => correct(e)}>Correct</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        A correction writes a new label. Errors are exactly the examples the model most needs.
      </p>
    </section>
  );
}
