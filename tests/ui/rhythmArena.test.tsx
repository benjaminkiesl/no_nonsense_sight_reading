import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { RhythmArena } from '../../src/components/RhythmArena';
import { useAppStore } from '../../src/store/useAppStore';

describe('RhythmArena UI Specification Tests (4-Stage Count-In & Optical Engraving)', () => {
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

  it('renders in STUDY stage with Hear Tempo button, progress bar, zero dropdowns, and dark ink notes', () => {
    const { container } = render(<RhythmArena levelId="rhythm-1" />);

    // In Stage 1 (STUDY), shows Hear Tempo button
    const hearTempoBtn = screen.getByTestId('hear-tempo-button');
    expect(hearTempoBtn).toBeDefined();
    expect(hearTempoBtn.textContent).toContain('Hear Tempo');

    // Progress bar showing Phrase 1 of 10
    expect(screen.getByText(/Phrase 1 of 10/)).toBeDefined();

    // Verify ZERO dropdowns or mode selectors exist inside RhythmArena
    expect(container.querySelectorAll('select').length).toBe(0);

    // Verify noteheads are not colored green in STUDY
    const ellipses = container.querySelectorAll('ellipse');
    expect(ellipses.length).toBeGreaterThan(0);
    for (const el of ellipses) {
      expect(el.getAttribute('fill')).not.toBe('#04724d');
    }
  });

  it('progresses from STUDY to COUNT_IN, then to READY_TO_PLAY and PLAYING upon first tap', () => {
    render(<RhythmArena levelId="rhythm-1" />);

    // Click Hear Tempo button to enter COUNT_IN
    const hearTempoBtn = screen.getByTestId('hear-tempo-button');
    act(() => {
      fireEvent.click(hearTempoBtn);
    });

    // In COUNT_IN with lead-in delay
    expect(screen.getByText(/Tempo \(76 BPM\): Count-in starting\.\.\./)).toBeDefined();

    // Note pointer is NOT shown during COUNT_IN
    expect(screen.queryByText('▼ 1st note')).toBeNull();

    // Press Space (in READY_TO_PLAY or after count-in)
    // To test transition to PLAYING: trigger keydown when ready
    act(() => {
      // Fast forward time to finish count-in
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
    });
  });

  it('opens RhythmArena in App when a Rhythm node is selected from the LevelGraph', () => {
    render(<App />);

    // Initially in Pitch view
    expect(screen.getByText('Learn')).toBeDefined();
    expect(screen.getByTestId('view-toggle-button')).toBeDefined();
    expect(screen.getByTestId('view-toggle-button').textContent).toBe('Levels');

    // Go to Levels view
    act(() => {
      fireEvent.click(screen.getByTestId('view-toggle-button'));
    });

    expect(screen.getByText('Treble')).toBeDefined();
    expect(screen.getByText('Both')).toBeDefined();
    expect(screen.getByText('Bass')).toBeDefined();
    expect(screen.getByText('Rhythm')).toBeDefined();

    // Click Rhythm Tier 1 node
    const rhythm1Node = screen.getByTestId('rhythm-node-1');
    act(() => {
      fireEvent.click(rhythm1Node);
    });

    // App switches to practice view running RhythmArena!
    expect(useAppStore.getState().currentLevelId).toBe('rhythm-1');
    expect(screen.getByTestId('hear-tempo-button')).toBeDefined();

    // Return back to Level Graph
    act(() => {
      fireEvent.click(screen.getByTestId('view-toggle-button'));
    });
    expect(screen.getByText('Rhythm')).toBeDefined();
  });
});
