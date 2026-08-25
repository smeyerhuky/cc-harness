import { useState } from "react";
import { CalibrationWizard } from "./components/CalibrationWizard";
import { LiveMonitor } from "./components/LiveMonitor";
import { DriftDashboard } from "./components/DriftDashboard";

type Tab = "wizard" | "monitor" | "drift";

export function App() {
  const [tab, setTab] = useState<Tab>("wizard");
  return (
    <div className="app">
      <header>
        <h1>Acoustic Pipe Monitor</h1>
        <nav>
          <button className={tab === "wizard" ? "on" : ""} onClick={() => setTab("wizard")}>
            Calibration
          </button>
          <button className={tab === "monitor" ? "on" : ""} onClick={() => setTab("monitor")}>
            Live monitor
          </button>
          <button className={tab === "drift" ? "on" : ""} onClick={() => setTab("drift")}>
            Drift &amp; alerts
          </button>
        </nav>
      </header>
      <main>
        {tab === "wizard" && <CalibrationWizard />}
        {tab === "monitor" && <LiveMonitor />}
        {tab === "drift" && <DriftDashboard />}
      </main>
      <footer>
        Server-side inference · LAN only · no cloud. The frontend holds no business logic.
      </footer>
    </div>
  );
}
