import { DEFAULT_SETTINGS, isMatchSettings, type MatchSettings } from '@garbage-day/protocol';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MatchSettingsForm, settingsSummary } from './MatchSettingsForm';

describe('MatchSettingsForm', () => {
  it('offers each setting’s choices, and changes one setting at a time', () => {
    const onChange = vi.fn<(s: MatchSettings) => void>();
    render(<MatchSettingsForm value={DEFAULT_SETTINGS} onChange={onChange} />);
    const options = (name: string) =>
      Array.from(screen.getByRole<HTMLSelectElement>('combobox', { name }).options).map(
        (o) => o.textContent,
      );
    expect(options('Mode')).toEqual(['Standard: power-ups and showdowns', 'Classic: neither']);
    expect(options('Speed-up every')).toEqual([
      '10 s of play',
      '15 s of play',
      '20 s of play',
      '30 s of play',
    ]);
    expect(options('Pauses')).toEqual(['None', '1 each', '2 each', '3 each']);
    expect(options('Pause timer')).toEqual(['1:00', '2:00', '3:00']);
    expect(options('If the waiting player leaves')).toEqual(['No contest', 'Counts as their win']);
    fireEvent.change(screen.getByRole('combobox', { name: 'Pause timer' }), {
      target: { value: '180' },
    });
    const changed = onChange.mock.calls[0]?.[0];
    expect(changed).toEqual({ ...DEFAULT_SETTINGS, pauseSec: 180 });
    expect(isMatchSettings(changed)).toBe(true);
  });

  it('shows only the settings it is told to, as a bot game asks', () => {
    render(
      <MatchSettingsForm
        value={DEFAULT_SETTINGS}
        onChange={() => undefined}
        only={['mode', 'rampSec']}
      />,
    );
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Mode' })).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'Speed-up every' })).toBeDefined();
  });

  it('reads back the settings for a guest, in the form’s words', () => {
    expect(settingsSummary({ ...DEFAULT_SETTINGS, mode: 'classic', pauseBudget: 0 })).toEqual([
      ['Mode', 'Classic: neither'],
      ['Speed-up every', '15 s of play'],
      ['Pauses', 'None'],
      ['Pause timer', '2:00'],
      ['If the waiting player leaves', 'No contest'],
    ]);
  });
});
