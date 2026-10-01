// The ids a match is known by (kb/design/architecture.md, "Components"): its id, and a join token
// for each seat. Both come from crypto random bytes, each byte masked to pick one character of an
// alphabet whose length is a power of two, so no character is likelier than another.

/** Crockford base 32: 32 characters, so five bits of a random byte pick one without bias. */
const BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
/** URL-safe base 64: six bits of a random byte pick one. */
const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const randomBytes = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)));

/**
 * A generated match's id: a prefix and ten characters, `Q-` for a quick match and `B-` for a bot
 * match, apart from private codes (`GD-` and four).
 */
export const newMatchId = (prefix: 'Q' | 'B') =>
  `${prefix}-${randomBytes(10)
    .map((b) => BASE32[b & 31] ?? '')
    .join('')}`;

/** A private game's code: `GD-` and four characters, about a million codes (PRD US-02). */
export const newGameCode = () =>
  `GD-${randomBytes(4)
    .map((b) => BASE32[b & 31] ?? '')
    .join('')}`;

/** A join token: 32 URL-safe characters, 192 bits. */
export const newToken = () =>
  randomBytes(32)
    .map((b) => BASE64URL[b & 63] ?? '')
    .join('');
