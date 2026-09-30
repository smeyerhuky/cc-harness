// @garbage-day/ui — the commons (kb/design/client-architecture.md, "Packages and folders").
// Tokens and fonts are also exported as CSS: `@garbage-day/ui/tokens.css`, `@garbage-day/ui/fonts.css`.

export {
  COLORS,
  CONTRAST_PAIRS,
  FONTS,
  HAPTICS,
  MOTION,
  PIECE_COLOR,
  PIECE_MARK,
  POWER_COLOR,
  THEMES,
  TYPE_SCALE,
  boardPalette,
  type BoardPalette,
  type ColorToken,
  type Mark,
  type Theme,
} from './tokens/tokens';
export { contrast, luminance } from './tokens/contrast';

export { Button, IconButton, type ButtonProps, type IconButtonProps } from './primitives/Button';
export { Card } from './primitives/Card';
export { Chip, type ChipTone } from './primitives/Chip';
export { Dialog, Sheet, type DialogProps } from './primitives/Dialog';
export { Kbd } from './primitives/Kbd';
export { Popover } from './primitives/Popover';
export { Select, type SelectOption } from './primitives/Select';
export { Slider } from './primitives/Slider';
export { Stepper } from './primitives/Stepper';
export { Toast } from './primitives/Toast';
export { Toggle } from './primitives/Toggle';
export { VisuallyHidden } from './primitives/VisuallyHidden';

export { BoardCanvas, type BoardCanvasProps } from './game/BoardCanvas';
export { drawBoard, ghostY, type BoardView, type DrawOptions } from './game/draw';
export { Meter } from './game/Meter';
export {
  AttackFlight,
  BoardCover,
  Countdown,
  Popup,
  ShowdownBanner,
  type Point,
  type ShowdownKind,
} from './game/Overlays';
export { PieceGlyph } from './game/PieceGlyph';
export { POWER_NAME, PowerIcon } from './game/PowerIcon';
export { PresenceChip, presenceState, type PresenceState } from './game/PresenceChip';
export { HoldSlot, NextQueue, PowerSlot } from './game/Slots';
export { SpeedChip } from './game/SpeedChip';

export { ScreenFrame } from './layout/ScreenFrame';
export { StageLayout } from './layout/StageLayout';
export { ThumbZone } from './layout/ThumbZone';

export { useAnimationFrame } from './hooks/useAnimationFrame';
export { useColorScheme } from './hooks/useColorScheme';
export { useHaptics } from './hooks/useHaptics';
export { useInterval } from './hooks/useInterval';
export { useKeyBindings, type KeyHandlers } from './hooks/useKeyBindings';
export { useMediaQuery } from './hooks/useMediaQuery';
export { usePageVisibility } from './hooks/usePageVisibility';
export {
  setMotionPreference,
  useReducedMotion,
  type MotionPreference,
} from './hooks/useReducedMotion';
export { useResizeObserver, type Size } from './hooks/useResizeObserver';
export { useWakeLock } from './hooks/useWakeLock';
