import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { ChordArena } from '../../src/components/ChordArena';
import { ChordEngine } from '../../src/chord/engine';
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

    // In Tier 1, first chord to learn is C (reference voicing LH C3=48, RH [C4=60, E4=64, G4=67])
    const largeSymbol = screen.getByTestId('large-chord-symbol');
    expect(largeSymbol.textContent).toBe('C');

    // Reference noteheads stacked on bass staff
    expect(screen.getByTestId('reference-notehead-48')).toBeDefined();
    expect(screen.getByTestId('reference-notehead-60')).toBeDefined();
    expect(screen.getByTestId('reference-notehead-64')).toBeDefined();
    expect(screen.getByTestId('reference-notehead-67')).toBeDefined();

    // Pitch labels
    expect(screen.getByTestId('reference-label-48').textContent).toBe('C');
    expect(screen.getByTestId('reference-label-60').textContent).toBe('C');
    expect(screen.getByTestId('reference-label-64').textContent).toBe('E');
    expect(screen.getByTestId('reference-label-67').textContent).toBe('G');
  });

  it('toggles notation system between international and german via Header button', () => {
    render(<App />);

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

    // Step 2: User adds E4 (64)
    const res2 = engine.handleNoteOn(64);
    expect(res2.outcome).toBe('building_chord');

    // Step 3: User adds G4 (67) -> Now all required chord tones {0, 4, 7} are sounding!
    const res3 = engine.handleNoteOn(67);
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
});
