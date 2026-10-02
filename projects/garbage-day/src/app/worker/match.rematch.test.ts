import { encodeClientToMatch } from '@garbage-day/protocol';
import { describe, it } from 'vitest';
import { openMatch, seat, until, type Socket } from './testkit';

// Result and rematch over the network (GD-STORY-014; PRD US-15).

/** Opens a match, seats both players and ends it, so both hold a result. */
async function endedMatch(id: string): Promise<[Socket, Socket]> {
  await openMatch(id);
  const a = await seat(id, 0);
  const b = await seat(id, 1);
  await until(a, 'start');
  await until(b, 'start');
  a.ws.send(encodeClientToMatch({ type: 'topout', why: 'block out' }));
  await until(a, 'result');
  await until(b, 'result');
  return [a, b];
}

describe('Match DO rematch', () => {
  it('agrees to a rematch and starts a new game', async () => {
    const [a, b] = await endedMatch('M-rematch-1');

    a.ws.send(encodeClientToMatch({ type: 'rematch' }));
    await until(b, 'rematch');
    b.ws.send(encodeClientToMatch({ type: 'rematch' }));

    await until(a, 'agreed');
    await until(b, 'agreed');
    await until(a, 'start');
    await until(b, 'start');
  });

  it('tells both players when the other does not answer in 30 s', async () => {
    const [a, b] = await endedMatch('M-rematch-2');

    // Real time: the Durable Object's timer is not the test's to fake.
    a.ws.send(encodeClientToMatch({ type: 'rematch' }));
    await until(b, 'rematch');
    await until(a, 'lapsed');
    await until(b, 'lapsed');
  }, 40_000);
});
