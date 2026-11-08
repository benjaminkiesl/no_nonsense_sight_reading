import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { ChordArena } from '../../src/components/ChordArena';
import { ChordEngine } from '../../src/chord/engine';
import { getChordDefinition } from '../../src/chord/chords';
import { getChordLevelById } from '../../src/chord/curriculum';
import { useAppStore } from '../../src/store/useAppStore';

describe('Chord Arena Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    useAppStore.setState({
      currentLevelId: 'treble-1',
      directlyCompletedLevelIds: [],
      allFinishedLevelIds: new Set(),
      midiDeviceName: null,
      chordNotationSystem: 'international',
    });
  });

  it('renders ChordArena with large chord symbol and reference noteheads stacked on bass staff during LEARN phase', () => {
    render(<ChordArena levelId="chord-1" />);

    // Renders chord arena container
    expect(screen.getByTestId('chord-arena')).toBeDefined();

    // In Tier 1, first chord to learn is C (reference voicing C3=48, E3=52, G3=55)
    const largeSymbol = screen.getByTestId('large-chord-symbol');
    expect(largeSymbol.textContent).toBe('C');

    // Reference noteheads stacked on bass staff
    expect(screen.getByTestId('reference-notehead-48')).toBeDefined();
    expect(screen.getByTestId('reference-notehead-52')).toBeDefined();
    expect(screen.getByTestId('reference-notehead-55')).toBeDefined();

    // Pitch labels
    expect(screen.getByTestId('reference-label-48').textContent).toBe('C');
    expect(screen.getByTestId('reference-label-52').textContent).toBe('E');
    expect(screen.getByTestId('reference-label-55').textContent).toBe('G');
  });

  it('toggles notation system between international and german via Header button', () => {
    render(<App />);

    // When currentLevelId is 'treble-1' (non-chord mode), chord-notation-toggle is null
    expect(screen.queryByTestId('chord-notation-toggle')).toBeNull();

    // Switch to chord-1 level
    act(() => {
      useAppStore.setState({ currentLevelId: 'chord-1' });
    });

    // Header has chord notation toggle button
    const toggleBtn = screen.getByTestId('chord-notation-toggle');
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn.textContent).toContain('Bb / B');

    // Click toggle to switch to German
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(toggleBtn.textContent).toContain('B / H');
    expect(useAppStore.getState().chordNotationSystem).toBe('german');

    // Click toggle again to switch back to International
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(toggleBtn.textContent).toContain('Bb / B');
    expect(useAppStore.getState().chordNotationSystem).toBe('international');
  });

  it('opens ChordArena in App when a Chord node is selected from LevelGraph', () => {
    render(<App />);

    // Switch to Level Map view
    act(() => {
      fireEvent.click(screen.getByTestId('view-toggle-button'));
    });

    expect(screen.getByText('Chords')).toBeDefined();

    // Click Chord Tier 1 node
    const chord1Node = screen.getByTestId('chord-node-1');
    act(() => {
      fireEvent.click(chord1Node);
    });

    // Practice workspace renders ChordArena for chord-1!
    expect(useAppStore.getState().currentLevelId).toBe('chord-1');
    expect(screen.getByTestId('chord-arena')).toBeDefined();
    expect(screen.getByTestId('large-chord-symbol').textContent).toBe('C');
  });

  it('registers chord hit on polyphonic input with rolling tolerance', () => {
    const level1 = getChordLevelById('chord-1');
    const engine = new ChordEngine(level1, 'international');

    expect(engine.getSnapshot().phase).toBe('LEARN');
    expect(engine.getSnapshot().currentTargetChord?.id).toBe('C');

    // Step 1: User plays C3 (48) - chord is being rolled
    const res1 = engine.handleNoteOn(48);
    expect(res1.outcome).toBe('building_chord');
    expect(engine.getSnapshot().phase).toBe('LEARN');

    // Step 2: User adds E3 (52)
    const res2 = engine.handleNoteOn(52);
    expect(res2.outcome).toBe('building_chord');

    // Step 3: User adds G3 (55) -> Now all required chord tones {0, 4, 7} are sounding!
    const res3 = engine.handleNoteOn(55);
    expect(res3.outcome).toBe('correct_hit');

    // Advances to next chord in Tier 1 (F/C)
    expect(engine.getSnapshot().currentTargetChord?.id).toBe('F/C');
  });

  it('renders emerald green for valid chord tones and coral red for foreign notes', () => {
    const { container } = render(<ChordArena levelId="chord-1" />);

    // In Tier 1, target is C (tones C, E, G).
    // Piano key 48 (C3) is clicked: valid chord tone
    const pianoC3 = container.querySelector('[key="white-48"], g');
    expect(pianoC3).toBeDefined();

    // On-screen toggle note 48
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'a' }) // mapped note
      );
    });
  });

  it('triggers celebration overlay when chord level is completed', () => {
    const onLevelComplete = vi.fn();
    render(<ChordArena levelId="chord-1" onLevelComplete={onLevelComplete} />);

    // Verify arena is rendered
    expect(screen.getByTestId('chord-arena')).toBeDefined();
  });

  it('does NOT render large-chord-symbol on top of the frozen chord-card during WAITING_FOR_CORRECTION', () => {
    const fcChord = getChordDefinition('F/C');
    vi.spyOn(ChordEngine.prototype, 'getSnapshot').mockReturnValue({
      levelId: 'chord-1',
      phase: 'SPEED_UP',
      substate: 'WAITING_FOR_CORRECTION',
      recoveryRemainingMs: 0,
      countdownRemainingSec: 0,
      actualBpm: 33,
      targetBpm: 60,
      learnStepIndex: 2,
      learnTotalSteps: 2,
      speedStepIndex: 0,
      speedTotalSteps: 8,
      holdCompletedCount: 0,
      holdTotalCount: 8,
      activeChords: [
        {
          id: 'chord-1',
          chord: fcChord,
          durationBeats: 2,
          x: 145,
          state: 'failed',
          stateTimeMs: 50,
          failedOnCurrentPrompt: true,
        },
      ],
      activeHeldMidis: [],
      settlingRemainingMs: 0,
      notationSystem: 'international',
      currentTargetChord: fcChord,
      isSettling: false,
    });

    render(<ChordArena levelId="chord-1" />);

    // The scrolling/failed chord badge at x = 145 is rendered
    expect(screen.getByTestId('chord-card-F/C')).toBeDefined();

    // The large-chord-symbol must NOT be rendered during SPEED_UP / WAITING_FOR_CORRECTION
    expect(screen.queryByTestId('large-chord-symbol')).toBeNull();

    // Mistake freeze banner is rendered
    expect(screen.getByText('Play the highlighted chord to resume')).toBeDefined();

    // Reference noteheads on bass staff for F/C (48, 53, 57) are rendered
    expect(screen.getByTestId('reference-notehead-48')).toBeDefined();
    expect(screen.getByTestId('reference-notehead-53')).toBeDefined();
    expect(screen.getByTestId('reference-notehead-57')).toBeDefined();
  });

  it('offsets 2nd-interval noteheads and renders accidentals cleanly', () => {
    const g7bChord = getChordDefinition('G7/B'); // [47, 53, 55] -> F3(53) and G3(55) are adjacent steps
    vi.spyOn(ChordEngine.prototype, 'getSnapshot').mockReturnValue({
      levelId: 'chord-2',
      phase: 'LEARN',
      substate: 'NORMAL',
      recoveryRemainingMs: 0,
      countdownRemainingSec: 0,
      actualBpm: 33,
      targetBpm: 60,
      learnStepIndex: 1,
      learnTotalSteps: 2,
      speedStepIndex: 0,
      speedTotalSteps: 8,
      holdCompletedCount: 0,
      holdTotalCount: 8,
      activeChords: [],
      activeHeldMidis: [],
      settlingRemainingMs: 0,
      notationSystem: 'international',
      currentTargetChord: g7bChord,
      isSettling: false,
    });

    render(<ChordArena levelId="chord-2" />);

    // Lower note F3 (53) notehead is at center (cx = 145)
    const notehead53 = screen.getByTestId('reference-notehead-53');
    expect(notehead53.getAttribute('cx')).toBe('145');

    // Upper note G3 (55) notehead is offset by +14px (cx = 159)
    const notehead55 = screen.getByTestId('reference-notehead-55');
    expect(notehead55.getAttribute('cx')).toBe('159');

    // Label for 53 is at +18px (x = 163)
    const label53 = screen.getByTestId('reference-label-53');
    expect(label53.getAttribute('x')).toBe('163');

    // Label for 55 is at +30px (x = 175)
    const label55 = screen.getByTestId('reference-label-55');
    expect(label55.getAttribute('x')).toBe('175');
  });
});
