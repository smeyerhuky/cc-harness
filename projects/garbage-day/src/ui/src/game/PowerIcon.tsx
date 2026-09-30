import type { PowerKind } from '@garbage-day/engine';
import { POWER_COLOR } from '../tokens/tokens';

export const POWER_NAME: Readonly<Record<PowerKind, string>> = {
  shield: 'Shield',
  bomb: 'Bomb',
  fog: 'Fog',
  rush: 'Rush',
};

const PATHS: Readonly<Record<PowerKind, string>> = {
  shield: 'M12 2 20 5v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z',
  bomb: 'M10 7a7 7 0 1 0 .01 0M14 6l3-3m-1 5 3-1',
  fog: 'M3 9h14M5 13h16M3 17h13M7 5h10',
  rush: 'M13 2 4 14h7l-1 8 9-12h-7z',
};

/** A power-up's icon in its colour, named for screen readers unless `decorative`. */
export function PowerIcon({
  kind,
  size = 24,
  decorative = false,
}: {
  kind: PowerKind;
  size?: number;
  decorative?: boolean;
}) {
  const filled = kind === 'shield' || kind === 'rush';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : POWER_NAME[kind]}
    >
      <path
        d={PATHS[kind]}
        fill={filled ? POWER_COLOR[kind] : 'none'}
        stroke={POWER_COLOR[kind]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
