import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../src/App';
import { useAppStore } from '../../src/store/useAppStore';

describe('App Integration Test', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    useAppStore.setState({
      currentLevelId: 'treble-1',
      directlyCompletedLevelIds: [],
      allFinishedLevelIds: new Set(),
      midiDeviceName: null,
    });
  });

  it('renders the complete sight reading application workspace', () => {
    render(<App />);

    // Header title
    expect(screen.getByText('No-Nonsense Sight-Reading')).toBeDefined();
    expect(screen.getByText(/No device connected/)).toBeDefined();

    // Progress bar sections
    expect(screen.getByText('Learn')).toBeDefined();
    expect(screen.getByText('Speed Up')).toBeDefined();
    expect(screen.getByText('Hold')).toBeDefined();

    // Level graph headers
    expect(screen.getByText('Treble')).toBeDefined();
    expect(screen.getByText('Both')).toBeDefined();
    expect(screen.getByText('Bass')).toBeDefined();
  });

  it('responds to keyboard input and level graph switching', () => {
    render(<App />);

    // Switch level via graph
    const bassNode = screen.getByLabelText(/Bass Clef - Tier 1\b/);
    act(() => {
      fireEvent.click(bassNode);
    });

    expect(useAppStore.getState().currentLevelId).toBe('bass-1');

    // Press a note key (e.g. 'c')
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    });
  });
});
