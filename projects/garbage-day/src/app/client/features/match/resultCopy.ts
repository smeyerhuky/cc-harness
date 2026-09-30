import { TPS, type RefereeResult } from '@garbage-day/engine';
import { mmss } from './format';

/**
 * The result's title and reason, from the player's side (UI language, "Voice and copy"):
 * "You win. Bot · Regular topped out at 2:14." / "No contest. You left while … was away."
 */
export function resultCopy(r: RefereeResult, opponent: string): { title: string; why: string } {
  const title = r.winner === 0 ? 'You win' : r.winner === 1 ? `${opponent} wins` : 'No contest';
  const who = r.by === 0 ? 'You' : opponent;
  const other = r.by === 0 ? opponent : 'you';
  const at = mmss(Math.floor(r.activeTicks / TPS));
  switch (r.reason) {
    case 'topout':
      return { title, why: `${who} topped out at ${at}.` };
    case 'timeout':
      return { title, why: `${who} didn't come back before the pause ran out.` };
    case 'grace':
      return { title, why: `${who} stayed away with no pauses left.` };
    case 'left':
      return { title, why: `${who} left the match at ${at}.` };
    case 'left-while-paused':
      return { title, why: `${who} left while ${other} ${r.by === 0 ? 'was' : 'were'} away.` };
    case 'abandoned':
      return { title, why: 'Both players were away until the session ended.' };
  }
}
