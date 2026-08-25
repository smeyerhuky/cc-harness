// Thin API client for the LAN server. The frontend holds NO business logic —
// every decision is a server call (protocol/http-endpoints.md).

export interface Fixture {
  id: number;
  name: string;
  location?: string;
  type?: string;
  hot_cold?: "hot" | "cold" | "na";
  branch_material?: string;
}

export interface Session { id: number; kind: string; ended_at: number | null; }
export interface Coverage { session_id: number; cells: Record<string, number>; populated: number; }
export interface ModelInfo { version: string; kind: string; active: boolean; metrics: Record<string, unknown>; }

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

export const api = {
  createSession: (kind: string, ambient_temp_c?: number, note?: string) =>
    fetch("/api/v1/sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ambient_temp_c, note }),
    }).then(j<Session>),

  // NOTE: no timestamp — the server stamps the label on this call (that is the
  // whole point of the wizard; it bounds alignment error to reaction time).
  addLabel: (sid: number, fixture_id: number | null, action: string, valve_position?: string) =>
    fetch(`/api/v1/sessions/${sid}/labels`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixture_id, action, valve_position }),
    }).then(j),

  endSession: (sid: number) => fetch(`/api/v1/sessions/${sid}/end`, { method: "POST" }).then(j),
  coverage: (sid: number) => fetch(`/api/v1/sessions/${sid}/coverage`).then(j<Coverage>),
  state: () => fetch("/api/v1/state").then(j<{ open_set: string[] }>),
  events: () => fetch("/api/v1/events").then(j<{ events: any[] }>),
  drift: () => fetch("/api/v1/drift").then(j<{ series: any[] }>),
  models: () => fetch("/api/v1/models").then(j<ModelInfo[]>),
};
