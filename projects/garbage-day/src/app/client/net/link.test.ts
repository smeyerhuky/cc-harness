import { PING } from '@garbage-day/protocol';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOSE_SILENT, PING_MS, SILENT_MS, socketUrl, webSocketLink } from './link';

/** A WebSocket stand-in that records what is sent and lets the test open and close it. */
class FakeSocket extends EventTarget {
  static readonly OPEN = 1;
  static last: FakeSocket | null = null;
  readyState = 0;
  readonly sent: string[] = [];
  closedWith: number | null = null;

  constructor(readonly url: string) {
    super();
    FakeSocket.last = this;
  }

  send(text: string): void {
    this.sent.push(text);
  }

  close(code?: number): void {
    this.closedWith = code ?? 1005;
  }

  open(): void {
    this.readyState = 1;
    this.dispatchEvent(new Event('open'));
  }

  receive(text: string): void {
    this.dispatchEvent(new MessageEvent('message', { data: text }));
  }

  end(code: number): void {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent('close', { code }));
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('WebSocket', FakeSocket);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const handlers = () => ({ open: vi.fn(), message: vi.fn(), close: vi.fn() });

describe('webSocketLink', () => {
  it('sends only once open, and pings at once and every second until it closes', () => {
    const h = handlers();
    const link = webSocketLink('wss://example/ws/match/GD-7KQ4')(h);
    const ws = FakeSocket.last;
    if (!ws) throw new Error('no socket');
    expect(ws.url).toBe('wss://example/ws/match/GD-7KQ4');
    link.send('early');
    expect(ws.sent).toEqual([]);
    ws.open();
    expect(h.open).toHaveBeenCalledOnce();
    link.send('hello');
    vi.advanceTimersByTime(PING_MS * 3);
    expect(ws.sent).toEqual([PING, 'hello', PING, PING, PING]);
    ws.receive('{"v":1,"t":"pong"}');
    expect(h.message).toHaveBeenCalledWith('{"v":1,"t":"pong"}');
    ws.end(1006);
    expect(h.close).toHaveBeenCalledWith(1006);
    vi.advanceTimersByTime(PING_MS * 3);
    expect(ws.sent).toHaveLength(5);
  });

  it('gives up on a connection gone silent at once, not when the socket gets round to closing', () => {
    const h = handlers();
    webSocketLink('wss://example/ws/lobby')(h);
    const ws = FakeSocket.last;
    if (!ws) throw new Error('no socket');
    ws.open();
    // Pongs keep it alive.
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(PING_MS);
      ws.receive('{"v":1,"t":"pong"}');
    }
    expect(h.close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(SILENT_MS + PING_MS);
    expect(h.close).toHaveBeenCalledExactlyOnceWith(CLOSE_SILENT);
    expect(ws.closedWith).not.toBeNull();
    // What the dead socket says later is too late.
    ws.receive('{"v":1,"t":"pong"}');
    ws.end(1006);
    expect(h.close).toHaveBeenCalledOnce();
    expect(h.message).toHaveBeenCalledTimes(5);
  });

  it('gives up when the browser goes offline', () => {
    const h = handlers();
    webSocketLink('wss://example/ws/lobby')(h);
    FakeSocket.last?.open();
    globalThis.dispatchEvent(new Event('offline'));
    expect(h.close).toHaveBeenCalledExactlyOnceWith(CLOSE_SILENT);
  });

  it('closes normally when asked', () => {
    const link = webSocketLink('wss://example/ws/lobby')(handlers());
    link.close();
    expect(FakeSocket.last?.closedWith).toBe(1000);
  });
});

describe('socketUrl', () => {
  it('uses wss on a secure page and ws otherwise, on the page’s own host', () => {
    expect(socketUrl('/ws/lobby', { protocol: 'https:', host: 'garbage-day.example' })).toBe(
      'wss://garbage-day.example/ws/lobby',
    );
    expect(socketUrl('/ws/lobby', { protocol: 'http:', host: 'localhost:5173' })).toBe(
      'ws://localhost:5173/ws/lobby',
    );
  });
});
