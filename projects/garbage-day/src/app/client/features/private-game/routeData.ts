import {
  createdGame,
  joinedGame,
  type GameRefusal,
  type MatchSettings,
} from '@garbage-day/protocol';
import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { GAME_CODE } from '../../state/appMachine';
import { keepSeat, seatFor } from './seats';

// The server side of a private game's screens (GD-STORY-010): `/new` makes a game, and `/g/:code`
// finds this browser's seat in one, joining it if the browser has none yet.

/** Why there is no seat to show: the game's own refusals, or no answer at all. */
export type SeatRefusal = GameRefusal | 'unreachable';

/** A seat in game `code`, or why there is none. */
export type GameSeat =
  | { readonly code: string; readonly token: string }
  | { readonly code: string; readonly refused: SeatRefusal };

/** `/new`'s action: makes the game on the settings posted, keeps the host's seat, goes to it. */
export async function createGameAction({ request }: ActionFunctionArgs) {
  const { settings } = (await request.json()) as { settings: MatchSettings };
  try {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    const made = createdGame.safeParse(await res.json());
    if (!res.ok || !made.success) return { failed: true } as const;
    keepSeat(made.data.code, made.data.token);
    return redirect(`/g/${made.data.code}`);
  } catch {
    return { failed: true } as const;
  }
}

/**
 * `/g/:code`'s loader: anything that isn't a game code is a 404, so the error screen explains.
 * A code this browser holds a seat in takes that seat; any other asks to join.
 */
export async function gameLoader({ params }: LoaderFunctionArgs): Promise<GameSeat> {
  const code = params.code ?? '';
  if (!GAME_CODE.test(code)) {
    throw new Response('Not a game code', { status: 404, statusText: 'That link is not a game' });
  }
  const kept = seatFor(code);
  if (kept) return { code, token: kept };
  try {
    const res = await fetch(`/api/games/${code}/join`, { method: 'POST' });
    const joined = joinedGame.safeParse(await res.json());
    if (!joined.success) return { code, refused: 'unreachable' };
    if ('error' in joined.data) return { code, refused: joined.data.error };
    keepSeat(code, joined.data.token);
    return { code, token: joined.data.token };
  } catch {
    return { code, refused: 'unreachable' };
  }
}
