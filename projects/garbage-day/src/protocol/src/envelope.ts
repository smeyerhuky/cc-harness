import { z } from 'zod';

/** Bumped when a message changes shape; the server rejects other versions. */
export const PROTOCOL_VERSION = 1;

/** Every message carries the protocol version `v` and its type `t` (kb/design/architecture.md, "Messages"). */
export const envelope = z.object({
  v: z.literal(PROTOCOL_VERSION),
  t: z.string().min(1).max(32),
});

export type Envelope = z.infer<typeof envelope>;
