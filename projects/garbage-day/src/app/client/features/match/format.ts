/** A clock in whole seconds as m:ss. */
export const mmss = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
