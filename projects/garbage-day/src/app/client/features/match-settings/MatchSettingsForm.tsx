import { SETTING_CHOICES, type MatchSettings } from '@garbage-day/protocol';
import { Select } from '@garbage-day/ui';
import styles from './MatchSettings.module.css';

// A match's settings (PRD, "Match settings"): the form a private game's host fills in, and the
// summary its guest reads (GD-STORY-010). A bot game takes the same form (GD-TICKET-026).

const MODE: Readonly<Record<MatchSettings['mode'], string>> = {
  standard: 'Standard: power-ups and showdowns',
  classic: 'Classic: neither',
};
const LEAVE: Readonly<Record<MatchSettings['leaveResult'], string>> = {
  nocontest: 'No contest',
  win: 'Counts as their win',
};
const minutes = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const pauses = (n: number) => (n === 0 ? 'None' : `${n} each`);

/** Each setting's name and how it reads, in the form's order. */
export function settingsSummary(s: MatchSettings): readonly (readonly [string, string])[] {
  return [
    ['Mode', MODE[s.mode]],
    ['Speed-up every', `${s.rampSec} s of play`],
    ['Pauses', pauses(s.pauseBudget)],
    ['Pause timer', minutes(s.pauseSec)],
    ['If the waiting player leaves', LEAVE[s.leaveResult]],
  ];
}

/** Picks the choice whose text a select gave back. */
const pick = <T extends string | number>(choices: readonly T[], text: string, fallback: T): T =>
  choices.find((c) => String(c) === text) ?? fallback;

/** The five settings, each a native select of the PRD's choices. */
export function MatchSettingsForm({
  value,
  onChange,
}: {
  value: MatchSettings;
  onChange: (settings: MatchSettings) => void;
}) {
  const C = SETTING_CHOICES;
  return (
    <fieldset className={styles.form}>
      <legend className={styles.legend}>Match settings</legend>
      <Select
        label="Mode"
        value={value.mode}
        options={C.mode.map((m) => ({ value: m, label: MODE[m] }))}
        onChange={(mode) => onChange({ ...value, mode })}
      />
      <Select
        label="Speed-up every"
        value={String(value.rampSec)}
        options={C.rampSec.map((s) => ({ value: String(s), label: `${s} s of play` }))}
        onChange={(v) => onChange({ ...value, rampSec: pick(C.rampSec, v, value.rampSec) })}
      />
      <Select
        label="Pauses"
        value={String(value.pauseBudget)}
        options={C.pauseBudget.map((n) => ({ value: String(n), label: pauses(n) }))}
        onChange={(v) =>
          onChange({ ...value, pauseBudget: pick(C.pauseBudget, v, value.pauseBudget) })
        }
      />
      <Select
        label="Pause timer"
        value={String(value.pauseSec)}
        options={C.pauseSec.map((s) => ({ value: String(s), label: minutes(s) }))}
        onChange={(v) => onChange({ ...value, pauseSec: pick(C.pauseSec, v, value.pauseSec) })}
      />
      <Select
        label="If the waiting player leaves"
        value={value.leaveResult}
        options={C.leaveResult.map((l) => ({ value: l, label: LEAVE[l] }))}
        onChange={(leaveResult) => onChange({ ...value, leaveResult })}
      />
    </fieldset>
  );
}

/** The settings as a guest reads them: a list of names and values. */
export function SettingsSummary({ settings }: { settings: MatchSettings }) {
  return (
    <dl className={styles.summary}>
      {settingsSummary(settings).map(([name, text]) => (
        <div key={name} className={styles.row}>
          <dt>{name}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  );
}
