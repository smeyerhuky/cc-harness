import { encodeLobbyToClient, parseClientToLobby, type ClientToLobby } from '@garbage-day/protocol';
import type { GuardLimits } from './guard';
import { SocketDO, type RefusalCode } from './sockets';

// The quick-match queue (kb/design/architecture.md, "Components"). Its socket is guarded; pairing
// arrives with GD-STORY-009.

/** The lobby hears a `queue` and a `cancel` (pings are answered without it). */
const LOBBY_LIMITS: GuardLimits = { rate: 2, burst: 5, strikes: 10 };

export class LobbyDO extends SocketDO<ClientToLobby> {
  protected readonly limits = LOBBY_LIMITS;

  protected parse(text: string) {
    return parseClientToLobby(text);
  }

  protected encodeError(code: RefusalCode, message: string): string {
    return encodeLobbyToClient({ type: 'error', code, message });
  }

  protected received(): void {
    // Pairing arrives with GD-STORY-009.
  }

  health(): 'ok' {
    return 'ok';
  }
}
