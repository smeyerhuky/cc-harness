import {
  GARBAGE,
  PIECE_TYPES,
  POWER_KINDS,
  emptyBoard,
  gemCell,
  pieceCell,
  setCell,
  spawnPos,
  type ActivePiece,
  type Board,
} from '@garbage-day/engine';
import { useState } from 'react';
import { BoardCanvas } from '../game/BoardCanvas';
import type { BoardView } from '../game/draw';
import { Meter } from '../game/Meter';
import { AttackFlight, BoardCover, Countdown, Popup, ShowdownBanner } from '../game/Overlays';
import { PieceGlyph } from '../game/PieceGlyph';
import { PowerIcon } from '../game/PowerIcon';
import { PresenceChip } from '../game/PresenceChip';
import { HoldSlot, NextQueue, PowerSlot } from '../game/Slots';
import { SpeedChip } from '../game/SpeedChip';
import { useInterval } from '../hooks/useInterval';
import { StageLayout } from '../layout/StageLayout';
import { Button, IconButton } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { Chip } from '../primitives/Chip';
import { Dialog, Sheet } from '../primitives/Dialog';
import { Kbd } from '../primitives/Kbd';
import { Popover } from '../primitives/Popover';
import { Select } from '../primitives/Select';
import { Slider } from '../primitives/Slider';
import { Stepper } from '../primitives/Stepper';
import { Toast } from '../primitives/Toast';
import { Toggle } from '../primitives/Toggle';
import { COLORS, EFFECTS, type ColorToken } from '../tokens/tokens';
import styles from './Gallery.module.css';

/** A sample stack: pieces with their marks, a gem, and two garbage rows with a hole. */
function sampleBoard(): Board {
  const b = emptyBoard();
  for (let x = 0; x < 10; x++) if (x !== 6) setCell(b, x, 0, GARBAGE);
  for (let x = 0; x < 10; x++) if (x !== 6) setCell(b, x, 1, GARBAGE);
  PIECE_TYPES.forEach((t, i) => {
    setCell(b, i, 2, pieceCell(t));
    setCell(b, i + 1, 3, pieceCell(t));
  });
  setCell(b, 8, 2, gemCell('shield'));
  setCell(b, 9, 2, pieceCell('I'));
  setCell(b, 3, 4, gemCell('rush'));
  return b;
}

type ThemeChoice = 'system' | 'light' | 'dark';

/**
 * Every token and commons component in its states, on the page and on the stage: the visual
 * check for GD-TICKET-023. The app serves it at `/gallery`.
 */
export function Gallery() {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  const [reduced, setReduced] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [fog, setFog] = useState(false);
  const [paused, setPaused] = useState(false);
  const [count, setCount] = useState(3);
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [popup, setPopup] = useState<string | null>(null);
  const [flight, setFlight] = useState(0);
  const [skill, setSkill] = useState(6);
  const [pauses, setPauses] = useState(2);
  const [sound, setSound] = useState(false);
  const [mode, setMode] = useState<'standard' | 'classic'>('standard');
  const [board] = useState(sampleBoard);
  const piece: ActivePiece = { t: 'T', r: 0, ...spawnPos('T'), gem: { i: 1, type: 'bomb' } };

  useInterval(() => setCount((c) => (c <= 0 ? 3 : c - 1)), 1000);

  const mine = (): BoardView => ({
    board,
    piece,
    ghost: true,
    clearing: clearing ? [2] : null,
    fog,
  });
  const theirs = (): BoardView => ({ board, dead: paused });
  const swatch = (t: ColorToken) => (
    <div key={t} className={styles.swatch}>
      <span className={styles.chipOf} style={{ background: `var(--${t})` }} />
      <span>
        --{t}
        <br />
        {COLORS[t].light.toLowerCase()} / {COLORS[t].dark.toLowerCase()}
      </span>
    </div>
  );
  // Effects are translucent, so each is shown over the cabinet, where most of them sit.
  const effect = (t: keyof typeof EFFECTS) => (
    <div key={t} className={styles.swatch}>
      <span
        className={styles.chipOf}
        style={{ background: `linear-gradient(var(--${t}), var(--${t})), var(--cabinet)` }}
      />
      <span>
        --{t}
        <br />
        {EFFECTS[t]}
      </span>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>Garbage Day · ui commons</h1>
        <div className={styles.controls}>
          <Select
            label="Theme"
            value={theme}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={(v) => {
              setTheme(v);
              if (v === 'system') delete document.documentElement.dataset.theme;
              else document.documentElement.dataset.theme = v;
            }}
          />
          <Toggle label="Reduced motion (boards)" checked={reduced} onChange={setReduced} />
        </div>
      </div>

      <Card title="Type">
        <div className={styles.type}>
          <span className={styles.display}>Garbage Day</span>
          <span>
            Public Sans for running text and controls: press <Kbd>Space</Kbd> to drop.
          </span>
          <span className={styles.data}>1:24 · GD-7KQ4 · 1.8 pieces/s</span>
        </div>
      </Card>

      <Card title="Colours">
        <div className={styles.swatches}>{(Object.keys(COLORS) as ColorToken[]).map(swatch)}</div>
        <div className={styles.swatches}>
          {(Object.keys(EFFECTS) as (keyof typeof EFFECTS)[]).map(effect)}
        </div>
        <div className={styles.row}>
          {PIECE_TYPES.map((t) => (
            <PieceGlyph key={t} type={t} cell={18} />
          ))}
          {POWER_KINDS.map((k) => (
            <PowerIcon key={k} kind={k} size={28} />
          ))}
        </div>
      </Card>

      <Card title="Primitives">
        <div className={styles.row}>
          <Button variant="primary" size="large">
            Quick match
          </Button>
          <Button>Create game</Button>
          <Button variant="ghost">Cancel</Button>
          <Button disabled>Disabled</Button>
          <IconButton label="Settings" onClick={() => setSheet(true)}>
            ⚙
          </IconButton>
          <Button onClick={() => setDialog(true)}>Open a popover card</Button>
          <Button onClick={() => setToast('Link copied')}>Show a toast</Button>
          <button type="button" popoverTarget="gallery-help">
            Help (popover)
          </button>
        </div>
        <div className={styles.row}>
          <Chip tone="ok">online</Chip>
          <Chip tone="warn">away</Chip>
          <Chip tone="bad">gone</Chip>
          <Chip tone="accent">you</Chip>
          <Chip tone="rival">rival</Chip>
          <Toggle label="Sound" checked={sound} onChange={setSound} />
        </div>
        <div className={styles.row}>
          <Select
            label="Mode"
            value={mode}
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'classic', label: 'Classic' },
            ]}
            onChange={setMode}
          />
          <Slider label="Bot skill" value={skill} min={1} max={10} onChange={setSkill} />
          <Stepper label="Pauses" value={pauses} min={0} max={3} onChange={setPauses} />
        </div>
      </Card>

      <div className={styles.row}>
        <Toggle label="Line clear" checked={clearing} onChange={setClearing} />
        <Toggle label="Fog" checked={fog} onChange={setFog} />
        <Toggle label="Paused (cover, grey rival)" checked={paused} onChange={setPaused} />
        <Button onClick={() => setPopup('T-spin double')}>Clear label</Button>
        <Button onClick={() => setFlight((n) => n + 1)}>Send an attack</Button>
      </div>

      <div className={styles.stageBox}>
        <StageLayout
          leftLabel="Brisk Heron 42"
          rightLabel="Bot · Regular"
          banner={
            <ShowdownBanner
              kind={count % 2 ? 'double' : 'sudden'}
              {...(count > 0 ? { startsIn: count } : {})}
            />
          }
          left={
            <div className={styles.panel}>
              <div className={styles.side}>
                <HoldSlot piece="L" used />
                <PowerSlot kind="shield" hint="E" />
                <NextQueue
                  pieces={(['I', 'O', 'S', 'Z', 'J'] as const).map((t) => ({ t, gem: null }))}
                />
              </div>
              <div className={styles.boardWrap}>
                <BoardCanvas source={mine} label="Your board" reducedMotion={reduced} />
                {popup && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '40%' }}>
                    <Popup text={popup} onDone={() => setPopup(null)} />
                  </div>
                )}
              </div>
              <Meter total={7} ready={3} shielded />
            </div>
          }
          centre={
            <div className={styles.lane}>
              <span>1:24</span>
              <SpeedChip level={7} progress={0.4} />
              <SpeedChip level={11} progress={0.8} hot />
              <Countdown value={count} />
              <PresenceChip state="online" />
              <PresenceChip state="reconnecting" />
            </div>
          }
          right={
            <div className={styles.panel}>
              <Meter total={2} ready={0} />
              <div className={styles.boardWrap}>
                <BoardCanvas
                  source={theirs}
                  label="Bot · Regular's board"
                  reducedMotion={reduced}
                />
                {paused && <BoardCover reason="Bot left the game tab" timeLeft="1:43" />}
              </div>
              <div className={styles.side}>
                <HoldSlot piece={null} />
                <PowerSlot kind={null} />
                <NextQueue pieces="hidden" />
              </div>
            </div>
          }
          feed={
            <div className={styles.feed}>
              <span>0:58 · You sent 4</span>
              <span>1:00 · Double garbage</span>
              <span>1:07 · Bot cancelled 2</span>
            </div>
          }
        />
      </div>

      {flight > 0 && (
        <AttackFlight
          key={flight}
          from={{ x: 200, y: 400 }}
          to={{ x: 700, y: 400 }}
          onDone={() => undefined}
        />
      )}
      <Dialog open={dialog} onClose={() => setDialog(false)} title="Bot left the game tab" band>
        <p>Both boards are hidden and frozen, so nobody loses time.</p>
        <Button variant="primary" onClick={() => setDialog(false)}>
          Wait
        </Button>
      </Dialog>
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Settings">
        <Toggle label="Sound" checked={sound} onChange={setSound} />
        <Button onClick={() => setSheet(false)}>Done</Button>
      </Sheet>
      <Popover id="gallery-help" label="How to play">
        Swipe to move, tap to rotate, flick down to drop.
      </Popover>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
