/** What the page shows about the server: the Worker's /api/health, or that it can't be reached. */
export type ServerStatus =
  | { readonly ok: true; readonly environment: string; readonly protocol: number }
  | { readonly ok: false };

const isHealth = (v: unknown): v is { ok: true; environment: string; protocol: number } =>
  typeof v === 'object' &&
  v !== null &&
  (v as { ok?: unknown }).ok === true &&
  typeof (v as { environment?: unknown }).environment === 'string' &&
  typeof (v as { protocol?: unknown }).protocol === 'number';

/** Asks the Worker for its health; never rejects. */
export async function loadServerStatus(fetcher: typeof fetch = fetch): Promise<ServerStatus> {
  try {
    const res = await fetcher('/api/health');
    const body: unknown = res.ok ? await res.json() : null;
    return isHealth(body)
      ? { ok: true, environment: body.environment, protocol: body.protocol }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}
