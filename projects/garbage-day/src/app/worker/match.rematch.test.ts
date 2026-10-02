import { snapshot, type PlayerStats } from '@garbage-day/engine';
import { CLOSE, encodeClientToMatch } from '@garbage-day/protocol';
import { describe, expect, it } from 'vitest';
import { connect, openMatch, read, seat, TOKENS, until } from './testkit';

const stats: PlayerStats = {
  pieces: 1, lines: 0, sent: 0, received: 0, cancelled: 0, fourLineClears: 0,
  tspins: 0, perfectClears: 0, powersUsed: 0, powersGot: 0, maxCombo: 0, garbageRows: 0,
};

describe('Match DO rematch', () => {
  it('agrees to a rematch and starts a new game', async () => {
    const id = 'M-rematch-1';
    await openMatch(id);
    const a = await seat(id, 0);
    const b = await seat(id, 1);
    await until(a, 'start');
    await until(b, 'start');

    // End the match
    a.ws.send(encodeClientToMatch({
      type: 'topout',
      why: 'block out',
    }));
    await until(a, 'result');
    await until(b, 'result');

    a.ws.send(encodeClientToMatch({ type: 'rematch' }));
    let msgB = await until(b, 'rematch');
    expect(msgB.msg.type).toBe('rematch');

    b.ws.send(encodeClientToMatch({ type: 'rematch' }));
    
    // Both agreed
    const agreedA = await until(a, 'agreed');
    expect(agreedA.msg.type).toBe('agreed');
    const agreedB = await until(b, 'agreed');
    expect(agreedB.msg.type).toBe('agreed');

    // A new start
    const startA = await until(a, 'start');
    expect(startA.msg.type).toBe('start');
  });
});
