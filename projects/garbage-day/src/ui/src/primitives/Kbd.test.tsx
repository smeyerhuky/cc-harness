import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('renders the key name in a kbd element', () => {
    render(<Kbd>Space</Kbd>);
    expect(screen.getByText('Space').tagName).toBe('KBD');
  });
});
