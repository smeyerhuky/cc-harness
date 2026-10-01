import { PING } from '@garbage-day/protocol';

// A connection to a Durable Object, as a session sees it: text out, text in, and its end. The
// browser's WebSocket is one; tests pass another (GD-STORY-011). `Socket` (Socket.ts) reconnects
// one when it drops (GD-TICKET-013).

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

/**
 * With nothing heard for this long, not even a pong, a link takes its connection for dead. A
 * connection that dies without closing (a phone changing networks) can otherwise look open for
 * minutes. It is under the referee's 5 s, so the player freezes before the referee notices.
 */
export const SILENT_MS = 3000;

/** The close code a link reports for a connection it gave up on: silent, or the device offline. */
export const CLOSE_SILENT = 4100;

/**
 * A WebSocket link to `url`: it pings on opening and every second after, and reports a close as
 * soon as the connection goes silent or the browser goes offline, not when the socket gets round
 * to closing.
 */
export function webSocketLink(url: string): Connect {
  return (h) => {
    const ws = new WebSocket(url);
    let ping: ReturnType<typeof setInterval> | null = null;
    let heard = 0;
    let ended = false;
    const stop = () => {
      if (ping !== null) clearInterval(ping);
      ping = null;
      globalThis.removeEventListener('offline', giveUp);
    };
    const end = (code: number) => {
      if (ended) return;
      ended = true;
      stop();
      h.close(code);
    };
    function giveUp() {
      end(CLOSE_SILENT);
      ws.close();
    }
    ws.addEventListener('open', () => {
      heard = Date.now();
      ws.send(PING);
      ping = setInterval(() => {
        if (Date.now() - heard > SILENT_MS) giveUp();
        else ws.send(PING);
      }, PING_MS);
      globalThis.addEventListener('offline', giveUp);
      h.open();
    });
    ws.addEventListener('message', (e: MessageEvent) => {
      if (ended) return;
      heard = Date.now();
      h.message(String(e.data));
    });
    ws.addEventListener('close', (e: CloseEvent) => end(e.code));
    return {
      send: (text) => {
        if (!ended && ws.readyState === WebSocket.OPEN) ws.send(text);
      },
      close: () => {
        stop();
        ws.close(1000);
      },
    };
  };
}

/** The socket URL for `path` on the page's own host. */
export function socketUrl(path: string, location: Pick<Location, 'protocol' | 'host'>): string {
  return `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${path}`;
}
