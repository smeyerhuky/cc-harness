import { Button } from '@garbage-day/ui';
import { useState } from 'react';
import type { LobbyMessage } from '../../net/MatchClient';
import type { OnlineSession } from '../../state/OnlineSession';
import { usePrefs } from '../../state/prefs';
import { MatchSettingsForm, SettingsSummary } from '../match-settings';
import styles from './PrivateGame.module.css';

/**
 * A private game's lobby (PRD US-02): the link and code to send, both players and whether each is
 * ready, and the settings, which only the host can change. The match starts when both are ready.
 */
export function LobbyScreen({
  code,
  session,
  lobby,
  onLeave,
}: {
  code: string;
  session: OnlineSession;
  lobby: LobbyMessage | null;
  onLeave: () => void;
}) {
  const remember = usePrefs((s) => s.setSettings);
  const handle = usePrefs((s) => s.handle);
  const [copied, setCopied] = useState<'copied' | 'failed' | null>(null);
  const link = new URL(`/g/${code}`, globalThis.location.href).href;
  const you = lobby?.you ?? 0;
  const rival = lobby?.handles[you === 0 ? 1 : 0] ?? null;
  const ready = lobby?.ready ?? [false, false];
  const youReady = ready[you];
  const rivalReady = ready[you === 0 ? 1 : 0];
  const canShare = typeof navigator.share === 'function';
  const copy = () => {
    navigator.clipboard.writeText(link).then(
      () => setCopied('copied'),
      () => setCopied('failed'),
    );
  };
  const share = () => {
    navigator
      .share({ title: 'Garbage Day', text: `Play me at Garbage Day: game ${code}`, url: link })
      .catch(() => undefined);
  };
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Game {code}</h1>
      <section className={styles.section} aria-labelledby="lobby-invite">
        <h2 id="lobby-invite" className={styles.heading}>
          Invite a friend
        </h2>
        <p className={styles.note}>
          Send this link to one friend, or the code <strong>{code}</strong> for their home screen.
          The game closes after 30 minutes if nobody joins.
        </p>
        <input className={styles.link} readOnly value={link} aria-label="Game link" />
        <div className={styles.actions}>
          <Button onClick={copy}>Copy link</Button>
          {canShare && <Button onClick={share}>Share</Button>}
        </div>
        <p className={styles.note} role="status">
          {copied === 'copied'
            ? 'Link copied.'
            : copied === 'failed'
              ? 'Couldn’t copy: select the link instead.'
              : ''}
        </p>
      </section>
      <section className={styles.section} aria-labelledby="lobby-players">
        <h2 id="lobby-players" className={styles.heading}>
          Players
        </h2>
        {lobby ? (
          <ul className={styles.players}>
            <li className={styles.player}>
              <span>{lobby.handles[you] ?? handle} (you)</span>
              <span className={youReady ? styles.ready : styles.waiting}>
                {youReady ? 'Ready' : 'Not ready'}
              </span>
            </li>
            <li className={styles.player}>
              <span className={rival ? undefined : styles.waiting}>
                {rival ?? 'Waiting for your friend…'}
              </span>
              {rival && (
                <span className={rivalReady ? styles.ready : styles.waiting}>
                  {rivalReady ? 'Ready' : 'Not ready'}
                </span>
              )}
            </li>
          </ul>
        ) : (
          <p role="status">Connecting…</p>
        )}
      </section>
      {lobby && (
        <section
          className={styles.section}
          aria-labelledby={you === 0 ? undefined : 'lobby-settings'}
        >
          {you === 0 ? (
            <>
              <MatchSettingsForm
                value={lobby.settings}
                onChange={(settings) => {
                  remember(settings);
                  session.changeSettings(settings);
                }}
              />
              <p className={styles.note}>A change asks you both to be ready again.</p>
            </>
          ) : (
            <>
              <h2 id="lobby-settings" className={styles.heading}>
                Match settings
              </h2>
              <SettingsSummary settings={lobby.settings} />
              <p className={styles.note}>The player who made the game sets these.</p>
            </>
          )}
        </section>
      )}
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="large"
          disabled={!lobby || youReady}
          onClick={() => session.ready()}
        >
          {youReady ? (rival ? `Waiting for ${rival}` : 'Ready') : 'Ready'}
        </Button>
        <Button variant="ghost" onClick={onLeave}>
          Leave
        </Button>
      </div>
    </main>
  );
}
