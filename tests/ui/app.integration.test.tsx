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

  it('renders the complete sight reading application workspace and toggles between views', () => {
    render(<App />);

    // Header title and MIDI
    expect(screen.getByText('No-Nonsense Sight-Reading')).toBeDefined();
    expect(screen.getByText(/No device connected/)).toBeDefined();

    // In practice view, practice arena is rendered
    expect(screen.getByText('Learn')).toBeDefined();
    expect(screen.getByText('Speed Up')).toBeDefined();
    expect(screen.getByText('Hold')).toBeDefined();
    expect(screen.getByTestId('view-toggle-button')).toBeDefined();
    expect(screen.getByText('Levels')).toBeDefined();

    // Toggle to dedicated Level Map view
    act(() => {
      fireEvent.click(screen.getByTestId('view-toggle-button'));
    });

    // Dedicated Map headers
    expect(screen.getByText('Treble')).toBeDefined();
    expect(screen.getByText('Both')).toBeDefined();
    expect(screen.getByText('Bass')).toBeDefined();
    expect(screen.getByText('← Practice')).toBeDefined();

    // Toggle back to practice view
    act(() => {
      fireEvent.click(screen.getByTestId('view-toggle-button'));
    });
    expect(screen.getByText('Learn')).toBeDefined();
  });

  it('responds to keyboard input and level graph switching', () => {
    render(<App />);

    // Switch to map view to pick a level
    act(() => {
      fireEvent.click(screen.getByTestId('view-toggle-button'));
    });

    // Switch level via graph node click
    const bassNode = screen.getByLabelText(/Bass Clef - Tier 1\b/);
    act(() => {
      fireEvent.click(bassNode);
    });

    // Selecting node switches back to practice view and updates store
    expect(useAppStore.getState().currentLevelId).toBe('bass-1');
    expect(screen.getByText('Learn')).toBeDefined();

    // Press a note key (e.g. 'c')
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    });
  });
});
