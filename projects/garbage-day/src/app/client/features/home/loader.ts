import { loadServerStatus, type ServerStatus } from '../../health';

export interface HomeData {
  readonly status: Promise<ServerStatus>;
}

/** Starts the Worker's health check without waiting for it: the status line suspends on it. */
export const homeLoader = (): HomeData => ({ status: loadServerStatus() });
