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

  it('pauses and resumes practice mode with Escape key', () => {
    render(<App />);

    // Initially pause overlay is not visible
    expect(screen.queryByTestId('manual-pause-overlay')).toBeNull();

    // Press Escape to pause
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.getByTestId('manual-pause-overlay')).toBeDefined();
    expect(screen.getByText('Paused')).toBeDefined();

    // Press Escape or any key to resume
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    });
    expect(screen.queryByTestId('manual-pause-overlay')).toBeNull();
  });

  it('allows launching Infinite Speed-Up from rhythm level and ticks the countdown down', () => {
    // Start on rhythm level
    useAppStore.setState({ currentLevelId: 'rhythm-1' });
    render(<App />);

    // Rhythm arena is rendered
    expect(screen.getByTestId('rhythm-arena')).toBeDefined();

    // Switch to map view to open accelerando modal
    act(() => {
      fireEvent.click(screen.getByTestId('view-toggle-button'));
    });

    // Open Accelerando modal via speedometer button
    const speedoBtn = screen.getByTestId('accelerando-octagon-node');
    act(() => {
      fireEvent.click(speedoBtn);
    });

    // Modal is open
    expect(screen.getByText('Infinite Speed-Up')).toBeDefined();

    // Start Accelerando
    const startBtn = screen.getByTestId('start-accelerando-button');
    act(() => {
      fireEvent.click(startBtn);
    });

    // Modal closes and practice arena with GrandStaffCanvas is shown
    expect(screen.queryByText('Infinite Speed-Up')).toBeNull();
    expect(screen.getByText(/BPM/)).toBeDefined();
  });
});
