import { PING } from '@garbage-day/protocol';

// A connection to a Durable Object, as a session sees it: text out, text in, and its end. The
// browser's WebSocket is one; tests pass another (GD-STORY-011). Reconnecting and the outbox
// come with GD-TICKET-013.

export interface Link {
  send(text: string): void;
  close(): void;
}

export interface LinkHandlers {
  open(): void;
  message(text: string): void;
  close(code: number): void;
}

/** Opens a link and wires its handlers. */
export type Connect = (handlers: LinkHandlers) => Link;

/** How often a link pings; the DO's auto-response answers, and the referee counts it as alive. */
export const PING_MS = 1000;

/** A WebSocket link to `url`, pinging every second while open. */
export function webSocketLink(url: string): Connect {
  return (h) => {
    const ws = new WebSocket(url);
    let ping: ReturnType<typeof setInterval> | null = null;
    ws.addEventListener('open', () => {
      ping = setInterval(() => ws.send(PING), PING_MS);
      h.open();
    });
    ws.addEventListener('message', (e: MessageEvent) => h.message(String(e.data)));
    ws.addEventListener('close', (e: CloseEvent) => {
      if (ping !== null) clearInterval(ping);
      h.close(e.code);
    });
    return {
      send: (text) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(text);
      },
      close: () => ws.close(1000),
    };
  };
}

/** The socket URL for `path` on the page's own host. */
export function socketUrl(path: string, location: Pick<Location, 'protocol' | 'host'>): string {
  return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${path}`;
}
