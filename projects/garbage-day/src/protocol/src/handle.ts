// A handle's shape, with no Zod: the client checks stored handles with it on its first page,
// and the `handle` schema is built from it, so both sides agree on what a handle is.

/** Two capitalized words and a number, such as "Brisk Heron 42" (PRD US-04). */
export const HANDLE_PATTERN = /^[A-Z][a-z]+ [A-Z][a-z]+ [0-9]{1,2}$/;
export const HANDLE_MAX_LENGTH = 32;

/** Whether a value is a handle the server will accept. */
export function isHandle(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length <= HANDLE_MAX_LENGTH && HANDLE_PATTERN.test(value)
  );
}
