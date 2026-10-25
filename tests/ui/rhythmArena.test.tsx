import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { RhythmArena } from '../../src/components/RhythmArena';
import { useAppStore } from '../../src/store/useAppStore';

describe('RhythmArena UI Specification Tests (Minimalist Redesign)', () => {
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

  it('renders clean Rhythm Staff Card with prompt and progress bar, and ZERO dropdowns or mode buttons', () => {
    const { container } = render(<RhythmArena levelId="rhythm-1" />);

    // Unmistakable prompt on Note 0
    expect(
      screen.getByText('Play the 1st note (Space or any piano key) to start at your own tempo')
    ).toBeDefined();

    // Visual pointer above Note 0
    expect(screen.getByText('▼ 1st note')).toBeDefined();

    // Progress bar showing Phrase 1 of 5
    expect(screen.getByText(/Phrase 1 of 5/)).toBeDefined();

    // Verify ZERO dropdowns, buttons, or toggles exist inside RhythmArena
    expect(container.querySelectorAll('select').length).toBe(0);
    expect(container.querySelectorAll('button').length).toBe(0);
  });

  it('immediately starts PLAYING on first key press and updates status prompt', () => {
    render(<RhythmArena levelId="rhythm-1" />);

    expect(
      screen.getByText('Play the 1st note (Space or any piano key) to start at your own tempo')
    ).toBeDefined();

    // Press Space
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
    });

    // Prompt updates immediately to steady beat instruction
    expect(screen.getByText('Keep your steady beat through the final note...')).toBeDefined();
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
    expect(
      screen.getByText('Play the 1st note (Space or any piano key) to start at your own tempo')
    ).toBeDefined();

    // Return back to Level Graph
    act(() => {
      fireEvent.click(screen.getByTestId('view-toggle-button'));
    });
    expect(screen.getByText('Rhythm')).toBeDefined();
  });
});
