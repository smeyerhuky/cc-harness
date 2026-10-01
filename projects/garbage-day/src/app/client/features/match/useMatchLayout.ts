import { useMediaQuery, type StageArrangement } from '@garbage-day/ui';

/** A phone held upright. */
export const PORTRAIT = '(orientation: portrait) and (max-width: 767px)';
/** A phone on its side: short, not narrow. */
export const PHONE_LANDSCAPE = '(orientation: landscape) and (max-height: 540px)';

/**
 * Which arrangement the match screen takes (controls and layout, "Layout"): a phone upright gets
 * my board large with the rival's small beside it and no centre column; a phone on its side gets
 * the boards side by side without stats or feed; everything else is the desktop arrangement.
 */
export function useMatchLayout(): StageArrangement {
  const portrait = useMediaQuery(PORTRAIT);
  const landscape = useMediaQuery(PHONE_LANDSCAPE);
  return portrait ? 'portrait' : landscape ? 'landscape' : 'desktop';
}
