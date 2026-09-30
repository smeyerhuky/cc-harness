import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScreenFrame } from './ScreenFrame';
import { StageLayout } from './StageLayout';
import { ThumbZone } from './ThumbZone';

describe('layout', () => {
  it('StageLayout marks the stage and labels both sides', () => {
    const { container } = render(
      <StageLayout
        left="mine"
        centre="1:24"
        right="theirs"
        feed="feed"
        banner="Sudden death"
        leftLabel="Brisk Heron 42"
        rightLabel="Bot · Regular"
      />,
    );
    expect(container.querySelector('[data-stage]')).not.toBeNull();
    expect(screen.getByRole('region', { name: 'Brisk Heron 42' }).textContent).toBe('mine');
    expect(screen.getByRole('region', { name: 'Bot · Regular' }).textContent).toBe('theirs');
    expect(screen.getByRole('complementary', { name: 'Match feed' })).toBeDefined();
    expect(screen.getByText('Sudden death')).toBeDefined();
  });

  it('ScreenFrame lays out a header, the body and a footer', () => {
    render(
      <ScreenFrame header="GARBAGE DAY" footer={<ThumbZone>power</ThumbZone>} locked>
        body
      </ScreenFrame>,
    );
    expect(screen.getByRole('banner').textContent).toBe('GARBAGE DAY');
    expect(screen.getByRole('main').textContent).toBe('body');
    expect(screen.getByRole('contentinfo').textContent).toBe('power');
  });
});
