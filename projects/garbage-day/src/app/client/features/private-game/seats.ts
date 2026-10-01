// The join tokens this browser holds for private games (GD-STORY-010), by code. The host's comes
// with the game, the guest's with joining, and each is handed out once, so the browser keeps it:
// a reload or a second visit to the link takes the same seat again.

const KEY = 'garbage-day:games';
/** Enough for a few games' links; older seats are forgotten first. */
const KEEP = 20;

/** localStorage, or this page's memory where storage is blocked (a private window). */
let memory: string | null = null;
const load = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return memory;
  }
};
const save = (text: string): void => {
  try {
    localStorage.setItem(KEY, text);
  } catch {
    memory = text;
  }
};

function read(): [string, string][] {
  try {
    const v: unknown = JSON.parse(load() ?? '[]');
    return Array.isArray(v)
      ? v.filter(
          (e): e is [string, string] =>
            Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

const write = (seats: [string, string][]) => save(JSON.stringify(seats.slice(-KEEP)));

/** This browser's token for game `code`, if it has one. */
export const seatFor = (code: string): string | null =>
  read().find(([c]) => c === code)?.[1] ?? null;

/** Keeps this browser's token for game `code`. */
export const keepSeat = (code: string, token: string) =>
  write([...read().filter(([c]) => c !== code), [code, token]]);

/** Forgets game `code`'s token: the game is gone. */
export const forgetSeat = (code: string) => write(read().filter(([c]) => c !== code));
