import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { RhythmArena } from '../../src/components/RhythmArena';
import { useAppStore } from '../../src/store/useAppStore';

describe('RhythmArena & Rhythm View UI Tests', () => {
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

  it('renders RhythmArena in Sandbox rehearsal mode by default and supports beat previews', () => {
    render(<RhythmArena initialLevelId="rhythm-1" initialPhraseIndex={0} />);

    // Sandbox guidance and start CTA
    expect(screen.getByText('Sandbox Rehearsal')).toBeDefined();
    expect(
      screen.getByText(/Internalize the rhythm pattern at your own pace/)
    ).toBeDefined();

    const startBtn = screen.getByTestId('rhythm-start-perform-btn');
    expect(startBtn).toBeDefined();
    expect(startBtn.textContent).toContain('Count-In & Play (Enter) →');

    // 1-Beat Word Boxes are present and clickable
    const beatBox0 = screen.getByTestId('beat-box-0');
    expect(beatBox0).toBeDefined();
    act(() => {
      fireEvent.click(beatBox0);
    });

    // Start Count-In
    act(() => {
      fireEvent.click(startBtn);
    });

    // Count-in view becomes active
    expect(screen.getByText('Count-In')).toBeDefined();
    expect(screen.getByText('Schwer')).toBeDefined();
  });

  it('handles 2x Metric Zoom toggle on Tier 4/5 phrases', () => {
    // Initialized on gallop-1x in Tier 4 (phrase index 1)
    render(<RhythmArena initialLevelId="rhythm-4" initialPhraseIndex={1} />);

    const zoomBtn = screen.getByTestId('rhythm-metric-zoom-btn');
    expect(zoomBtn).toBeDefined();
    expect(zoomBtn.textContent).toContain('2× Metric Zoom');

    // Select box displays Gallop Gesture (68 BPM)
    const phraseSelect = screen.getByTestId('rhythm-phrase-select') as HTMLSelectElement;
    expect(phraseSelect.value).toBe('gallop-1x');

    // Click Metric Zoom
    act(() => {
      fireEvent.click(zoomBtn);
    });

    // Should now be on gallop-2x (136 BPM)
    expect(phraseSelect.value).toBe('gallop-2x');

    // Click Metric Zoom again to toggle back
    act(() => {
      fireEvent.click(zoomBtn);
    });
    expect(phraseSelect.value).toBe('gallop-1x');
  });

  it('switches seamlessly between Pitch Practice and Rhythm Module in App', () => {
    render(<App />);

    // Pitch Practice mode is active initially
    expect(screen.getByText('Learn')).toBeDefined();
    expect(screen.getByTestId('rhythm-mode-button')).toBeDefined();
    expect(screen.getByTestId('rhythm-mode-button').textContent).toBe('Rhythm');
    expect(screen.getByTestId('view-toggle-button').textContent).toBe('Levels');

    // Click 'Rhythm' to switch to Rhythm Arena
    act(() => {
      fireEvent.click(screen.getByTestId('rhythm-mode-button'));
    });

    // Rhythm view is active
    expect(screen.getByText('Sandbox Rehearsal')).toBeDefined();
    expect(screen.getByTestId('rhythm-start-perform-btn')).toBeDefined();
    expect(screen.getByTestId('rhythm-mode-button').textContent).toBe('← Pitch');
    expect(screen.getByTestId('view-toggle-button').textContent).toBe('← Practice');

    // Click '← Pitch' to return to Pitch Practice
    act(() => {
      fireEvent.click(screen.getByTestId('rhythm-mode-button'));
    });

    expect(screen.getByText('Learn')).toBeDefined();
    expect(screen.getByTestId('rhythm-mode-button').textContent).toBe('Rhythm');
    expect(screen.getByTestId('view-toggle-button').textContent).toBe('Levels');
  });

  it('supports keyboard tapping Space, F, and Enter in RhythmArena', () => {
    render(<RhythmArena initialLevelId="rhythm-1" initialPhraseIndex={0} />);

    // Tap Left Hand pulse 'F'
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'f' }));
    });

    // Tap Rhythm note 'Space'
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space' }));
    });

    // Press Enter to start count-in
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(screen.getByText('Count-In')).toBeDefined();
  });
});
