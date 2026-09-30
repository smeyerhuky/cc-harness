/**
 * Why a message was rejected: longer than MAX_MESSAGE_LENGTH, not a JSON object, another
 * protocol version, a type this side doesn't accept, or a field that fails its schema.
 */
export type ProtocolErrorCode = 'too-large' | 'malformed' | 'version' | 'unknown-type' | 'invalid';

export class ProtocolError extends Error {
  override readonly name = 'ProtocolError';

  constructor(
    readonly code: ProtocolErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** The outcome of parsing one message; parsing never throws. */
export type ParseResult<T> =
  { readonly ok: true; readonly msg: T } | { readonly ok: false; readonly error: ProtocolError };
