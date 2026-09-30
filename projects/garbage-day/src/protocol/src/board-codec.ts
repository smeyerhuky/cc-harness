import { H, W } from '@garbage-day/engine';
import { ProtocolError } from './errors';

// A board snapshot is the engine's W × H string, floor row first ('.', piece letters, 'X', and
// gems '1'–'4'). On the wire it is the shorter of two encodings, so a lock message stays small
// whatever the board looks like:
//   'r' + runs: each run is a cell and, if longer than one, its length in decimal, with gems
//        written 'a'–'d' so lengths stay unambiguous. Empty cells after the last block are left
//        out. A stack of garbage rows is a few dozen bytes.
//   'p' + packed: 4 bits a cell up to the last block, base64url. At most 161 bytes for any board.

const CELLS = '.IOTSZJLX1234';
const RUN_CELLS = '.IOTSZJLXabcd';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const SIZE = W * H;

/** The longest encoded board: 'p' plus 240 cells packed. */
export const MAX_ENCODED_BOARD = 1 + Math.ceil((SIZE / 2 / 3) * 4);

const bad = (why: string) => new ProtocolError('invalid', `Bad board encoding: ${why}`);

function used(snapshot: string): number {
  let n = snapshot.length;
  while (n > 0 && snapshot.charAt(n - 1) === '.') n--;
  return n;
}

function runs(snapshot: string, n: number): string {
  let out = 'r';
  for (let i = 0; i < n;) {
    const c = snapshot.charAt(i);
    let j = i + 1;
    while (j < n && snapshot.charAt(j) === c) j++;
    out += RUN_CELLS.charAt(CELLS.indexOf(c));
    if (j - i > 1) out += String(j - i);
    i = j;
  }
  return out;
}

function packed(snapshot: string, n: number): string {
  const bytes: number[] = [];
  for (let i = 0; i < n; i += 2) {
    const hi = CELLS.indexOf(snapshot.charAt(i));
    const lo = i + 1 < n ? CELLS.indexOf(snapshot.charAt(i + 1)) : 0;
    bytes.push((hi << 4) | lo);
  }
  let out = 'p';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a = 0, b = 0, c = 0] = bytes.slice(i, i + 3);
    const chunk = (a << 16) | (b << 8) | c;
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let k = 0; k < chars; k++) out += B64.charAt((chunk >> (18 - 6 * k)) & 63);
  }
  return out;
}

/** Encodes an engine board snapshot for the wire. */
export function encodeBoard(snapshot: string): string {
  if (snapshot.length !== SIZE) throw new RangeError(`A board snapshot has ${SIZE} cells`);
  for (const c of snapshot) if (!CELLS.includes(c)) throw new RangeError(`Unknown cell "${c}"`);
  const n = used(snapshot);
  const r = runs(snapshot, n);
  const p = packed(snapshot, n);
  return p.length < r.length ? p : r;
}

function decodeRuns(s: string): string {
  let out = '';
  let i = 1;
  while (i < s.length) {
    const cell = RUN_CELLS.indexOf(s.charAt(i));
    if (cell < 0) throw bad(`unexpected "${s.charAt(i)}"`);
    i++;
    let digits = '';
    while (i < s.length && s.charAt(i) >= '0' && s.charAt(i) <= '9') digits += s.charAt(i++);
    if (digits.length > 3 || digits.startsWith('0')) throw bad('run length');
    const len = digits ? Number(digits) : 1;
    if (out.length + len > SIZE) throw bad('too many cells');
    out += CELLS.charAt(cell).repeat(len);
  }
  return out;
}

function decodePacked(s: string): string {
  const body = s.slice(1);
  if (body.length % 4 === 1) throw bad('packed length');
  let out = '';
  for (let i = 0; i < body.length; i += 4) {
    const quad = body.slice(i, i + 4);
    let chunk = 0;
    for (let k = 0; k < 4; k++) {
      const v = k < quad.length ? B64.indexOf(quad.charAt(k)) : 0;
      if (v < 0) throw bad(`unexpected "${quad.charAt(k)}"`);
      chunk = (chunk << 6) | v;
    }
    const nBytes = Math.floor((quad.length * 6) / 8);
    for (let k = 0; k < nBytes; k++) {
      const byte = (chunk >> (16 - 8 * k)) & 255;
      for (const nibble of [byte >> 4, byte & 15]) {
        if (nibble >= CELLS.length) throw bad('cell value');
        out += CELLS.charAt(nibble);
      }
    }
  }
  if (out.length > SIZE) throw bad('too many cells');
  return out;
}

/** Decodes a wire board back to the engine's snapshot string; throws a ProtocolError if bad. */
export function decodeBoard(s: string): string {
  if (s.length < 1 || s.length > MAX_ENCODED_BOARD) throw bad('length');
  const cells = s.startsWith('r') ? decodeRuns(s) : s.startsWith('p') ? decodePacked(s) : null;
  if (cells === null) throw bad('unknown format');
  return cells.padEnd(SIZE, '.');
}
