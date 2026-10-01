import type { PlayerIndex } from '@garbage-day/engine';
import { Button, Kbd, Toggle } from '@garbage-day/ui';
import { useState, useSyncExternalStore } from 'react';
import { AppActorContext } from '../../state/appActor';
import { useDev } from '../../state/dev';
import type { MatchSession, WireEntry } from '../../state/MatchSession';
import { detail, WireLog } from './wireLog';
import styles from './Dev.module.css';

// The developer overlay (GD-TICKET-024): what the proof of concept's explainer sections showed,
// for whoever builds the game. It is the only screen that names the Durable Object and the
// WebSocket (UI language, "Voice and copy").

/** Rows shown at once: the newest. */
const ROWS = 50;

const seatName = (seat: PlayerIndex) => (seat === 0 ? 'You' : 'Rival');

function route(e: WireEntry): string {
  return e.dir === 'up' ? `${seatName(e.seat)} → Referee` : `Referee → ${seatName(e.seat)}`;
}

/** The overlay: the app machine, the match on screen, and its wire log. */
export function DevOverlay() {
  const setOpen = useDev((s) => s.setOpen);
  const session = useDev((s) => s.session);
  const state = AppActorContext.useSelector((s) => String(s.value));
  const mode = AppActorContext.useSelector((s) => s.context.mode);
  const match = AppActorContext.useSelector((s) => s.context.match);
  const bot = AppActorContext.useSelector((s) => s.context.bot);
  return (
    <aside className={styles.overlay} aria-label="Developer overlay">
      <header className={styles.head}>
        <h2 className={styles.title}>Developer</h2>
        <span className={styles.hint}>
          <Kbd>`</Kbd> closes
        </span>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </header>
      <dl className={styles.facts}>
        <dt>appMachine</dt>
        <dd>{state}</dd>
        <dt>Mode</dt>
        <dd>
          {mode ?? '–'}
          {bot ? ` · skill ${bot.skill}, speed ${bot.speed}` : ''}
        </dd>
        <dt>Match</dt>
        <dd>{match}</dd>
      </dl>
      {session ? (
        <MatchPanel key={match} session={session} />
      ) : (
        <p className={styles.note}>No match on screen.</p>
      )}
    </aside>
  );
}

function MatchPanel({ session }: { session: MatchSession }) {
  const [log] = useState(() => new WireLog(session));
  const wire = useSyncExternalStore(log.subscribe, log.getSnapshot);
  const view = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [chatter, setChatter] = useState(false);
  const rows = (chatter ? wire.all : wire.events).slice(0, ROWS);
  return (
    <>
      <dl className={styles.facts}>
        <dt>Session</dt>
        <dd>
          {view.phase} · tick {wire.tick} · {view.clock} s · level {view.level}
        </dd>
        <dt>Referee</dt>
        <dd>
          {wire.referee}
          {view.showdown ? ` · ${view.showdown.kind}` : ''}
          {view.result ? ` · ${view.result.reason}, winner ${view.result.winner ?? '–'}` : ''}
        </dd>
      </dl>
      <p className={styles.note}>
        The referee runs in this tab. Online it is the Match Durable Object, and these messages
        travel over a WebSocket.
      </p>
      <Toggle label="Positions and heartbeats" checked={chatter} onChange={setChatter} />
      <div className={styles.logBox}>
        <table className={styles.log}>
          <caption>
            Wire log: {rows.length} shown of {wire.total} messages
            {chatter ? '' : ', positions and heartbeats hidden'}
          </caption>
          <thead>
            <tr>
              <th scope="col">Tick</th>
              <th scope="col">Route</th>
              <th scope="col">Type</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={i} data-dir={e.dir}>
                <td>{e.tick}</td>
                <td>{route(e)}</td>
                <td>{e.msg.type}</td>
                <td title={JSON.stringify(e.msg)}>{detail(e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
