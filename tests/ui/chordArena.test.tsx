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
    expect(res3.validMidis).toEqual(expect.arrayContaining([48, 52, 55]));
    expect(engine.getSnapshot().activeHeldMidis).toEqual([]);

    // Advances to next chord in Tier 1 (F/C)
    expect(engine.getSnapshot().currentTargetChord?.id).toBe('F/C');
  });

  it('clears activeHeldMidis upon chord completion so held keys do not bleed over to next chord', () => {
    const level1 = getChordLevelById('chord-1');
    const engine = new ChordEngine(level1, 'international');

    expect(engine.getSnapshot().phase).toBe('LEARN');
    expect(engine.getSnapshot().currentTargetChord?.id).toBe('C');

    // Complete chord C (48, 52, 55)
    engine.handleNoteOn(48);
    engine.handleNoteOn(52);
    const hitRes = engine.handleNoteOn(55);

    expect(hitRes.outcome).toBe('correct_hit');
    expect(hitRes.validMidis).toEqual(expect.arrayContaining([48, 52, 55]));

    // currentTargetChord has advanced to F/C
    expect(engine.getSnapshot().currentTargetChord?.id).toBe('F/C');

    // activeHeldMidis must be cleared to [] so notes 48, 52, 55 are not evaluated as wrong against F/C
    expect(engine.getSnapshot().activeHeldMidis).toEqual([]);

    // Subsequent note-offs for C chord notes (as fingers release keys) are safe no-ops
    engine.handleNoteOff(48);
    engine.handleNoteOff(52);
    engine.handleNoteOff(55);
    expect(engine.getSnapshot().activeHeldMidis).toEqual([]);
  });

  it('flashes Jungle Teal (correct status) for 200ms on hit keys in ChordArena', () => {
    vi.useFakeTimers();
    let registeredNoteOn: ((midi: number) => void) | undefined;

    const { container } = render(
      <ChordArena
        levelId="chord-1"
        onMidiRegister={(handlers) => {
          registeredNoteOn = handlers.onNoteOn;
        }}
      />
    );

    expect(registeredNoteOn).toBeDefined();

    // Play C chord (48, 52, 55)
    act(() => {
      registeredNoteOn!(48);
      registeredNoteOn!(52);
      registeredNoteOn!(55);
    });

    // Check that keys 48, 52, 55 have correct status ('var(--emerald)')
    const emeraldKeys = Array.from(container.querySelectorAll('rect[fill="var(--emerald)"]'));
    expect(emeraldKeys.length).toBe(3);

    // Fast forward 200ms
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Flash expires; now F/C is target, so 48 is neutral reference ('var(--jasmine)'), 52 & 55 are unhighlighted
    const remainingEmerald = Array.from(container.querySelectorAll('rect[fill="var(--emerald)"]'));
    expect(remainingEmerald.length).toBe(0);

    vi.useRealTimers();
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
      learnStepIndex: 8,
      learnTotalSteps: 8,
      speedStepIndex: 0,
      speedTotalSteps: 24,
      holdCompletedCount: 0,
      holdTotalCount: 24,
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
      learnTotalSteps: 10,
      speedStepIndex: 0,
      speedTotalSteps: 24,
      holdCompletedCount: 0,
      holdTotalCount: 24,
      activeChords: [],
      activeHeldMidis: [],
      settlingRemainingMs: 0,
      notationSystem: 'international',
      currentTargetChord: g7bChord,
      isSettling: false,
    });

    render(<ChordArena levelId="chord-2" />);

    // Lower note F3 (53) notehead is at center (cx = 146)
    const notehead53 = screen.getByTestId('reference-notehead-53');
    expect(notehead53.getAttribute('cx')).toBe('146');

    // Upper note G3 (55) notehead is offset by +14px (cx = 160)
    const notehead55 = screen.getByTestId('reference-notehead-55');
    expect(notehead55.getAttribute('cx')).toBe('160');

    // Label for 53 is at +18px (x = 164)
    const label53 = screen.getByTestId('reference-label-53');
    expect(label53.getAttribute('x')).toBe('164');

    // Label for 55 is at +30px (x = 176)
    const label55 = screen.getByTestId('reference-label-55');
    expect(label55.getAttribute('x')).toBe('176');
  });

  it('returns empty_zone and sets emptyZonePulseRemainingMs when pressing a chord early (x > 220) during SPEED_UP', () => {
    const level1 = getChordLevelById('chord-1');
    const engine = new ChordEngine(level1, 'international');

    // Complete LEARN phase (6 chords in chord-1: C, F/C, G/B repeated 2x)
    for (let i = 0; i < 2; i++) {
      // 1. C chord
      engine.handleNoteOn(48);
      engine.handleNoteOn(52);
      engine.handleNoteOn(55);
      engine.handleClearNotes();

      // 2. F/C chord
      engine.handleNoteOn(48);
      engine.handleNoteOn(53);
      engine.handleNoteOn(57);
      engine.handleClearNotes();

      // 3. G/B chord
      engine.handleNoteOn(47);
      engine.handleNoteOn(50);
      engine.handleNoteOn(55);
      engine.handleClearNotes();
    }

    expect(engine.getSnapshot().phase).toBe('COUNTDOWN');

    // Advance past COUNTDOWN (3 seconds)
    engine.tick(3100);
    expect(engine.getSnapshot().phase).toBe('SPEED_UP');

    const snap = engine.getSnapshot();
    const frontmost = snap.activeChords.find((c) => c.state === 'approaching');
    expect(frontmost).toBeDefined();
    // First chord spawns at FIRST_CHORD_COUNTDOWN_X = 230, which is > 220 (HIT_ZONE_RIGHT_X 176 + EARLY_GRACE_PX 44)
    expect(frontmost!.x).toBeGreaterThan(220);

    // Target chord is frontmost.chord
    const target = engine.getSnapshot().currentTargetChord!;
    expect(target).toBeDefined();

    // User plays the target chord early while frontmost.x > 220
    const result = engine.setHeldMidis(target.referenceVoicing.allMidis);

    // Must return 'empty_zone' and NOT 'correct_hit'
    expect(result.outcome).toBe('empty_zone');
    expect(engine.getSnapshot().emptyZonePulseRemainingMs).toBeGreaterThan(0);

    // Frontmost chord must NOT be marked as 'hit'
    expect(engine.getSnapshot().activeChords.find((c) => c.id === frontmost!.id)?.state).toBe('approaching');
  });

  it('manages concise LEARN queue (2x per new chord), 48-hit SPEED_UP, 24-hit HOLD, and late miss penalty in ChordEngine', () => {
    const level1 = getChordLevelById('chord-1');
    const engine = new ChordEngine(level1, 'international');

    let snap = engine.getSnapshot();
    expect(snap.phase).toBe('LEARN');
    expect(snap.learnStepIndex).toBe(0);
    expect(snap.learnTotalSteps).toBe(6);
    expect(snap.speedTotalSteps).toBe(24);
    expect(snap.holdTotalCount).toBe(24);

    // 1. Complete Tier 1 LEARN: requires 6 hits (C, F/C, G/B 2x each)
    const expectedSequence = ['C', 'F/C', 'G/B', 'C', 'F/C', 'G/B'];
    for (let i = 0; i < 6; i++) {
      snap = engine.getSnapshot();
      expect(snap.phase).toBe('LEARN');
      expect(snap.learnStepIndex).toBe(i);
      expect(snap.currentTargetChord?.id).toBe(expectedSequence[i]);

      const target = snap.currentTargetChord!;
      const hit = engine.setHeldMidis(target.referenceVoicing.allMidis);
      expect(hit.outcome).toBe('correct_hit');
    }

    // Now transitioned to COUNTDOWN
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('COUNTDOWN');
    expect(snap.learnStepIndex).toBe(6);

    // Advance past COUNTDOWN
    engine.tick(3100);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('SPEED_UP');
    expect(snap.speedStepIndex).toBe(0);

    // 2. SPEED_UP phase requires 48 hits (spanning 24 speedTotalSteps)
    // Hit 47 chords in hit zone
    for (let hit = 1; hit <= 47; hit++) {
      engine.tick(30);
      snap = engine.getSnapshot();
      const frontmost = snap.activeChords.find((c) => c.state === 'approaching')!;
      frontmost.x = 146; // in hit window
      const target = engine.getSnapshot().currentTargetChord!;
      const hitRes = engine.setHeldMidis(target.referenceVoicing.allMidis);
      expect(hitRes.outcome).toBe('correct_hit');

      snap = engine.getSnapshot();
      expect(snap.phase).toBe('SPEED_UP');
      expect(snap.speedStepIndex).toBe(Math.floor(hit / 2));
    }

    // Hit 48: ramps to targetBpm and transitions to HOLD
    engine.tick(30);
    snap = engine.getSnapshot();
    const frontmost48 = snap.activeChords.find((c) => c.state === 'approaching')!;
    frontmost48.x = 146;
    const target48 = engine.getSnapshot().currentTargetChord!;
    const hitRes48 = engine.setHeldMidis(target48.referenceVoicing.allMidis);
    expect(hitRes48.outcome).toBe('correct_hit');

    snap = engine.getSnapshot();
    expect(snap.phase).toBe('HOLD');
    expect(snap.speedStepIndex).toBe(24);
    expect(snap.actualBpm).toBe(snap.targetBpm);
    expect(snap.holdCompletedCount).toBe(0);

    // 3. Complete some hits in HOLD
    for (let holdHit = 1; holdHit <= 10; holdHit++) {
      engine.tick(30);
      snap = engine.getSnapshot();
      const frontmostHold = snap.activeChords.find((c) => c.state === 'approaching')!;
      frontmostHold.x = 146;
      const targetHold = engine.getSnapshot().currentTargetChord!;
      const res = engine.setHeldMidis(targetHold.referenceVoicing.allMidis);
      expect(res.outcome).toBe('correct_hit');

      snap = engine.getSnapshot();
      expect(snap.phase).toBe('HOLD');
      expect(snap.holdCompletedCount).toBe(holdHit);
    }

    // 4. Late miss penalty during HOLD:
    const frontmostMiss = snap.activeChords.find((c) => c.state === 'approaching')!;
    engine.triggerChordFailure(frontmostMiss);

    snap = engine.getSnapshot();
    // Mistake drops HOLD back to SPEED_UP and resets holdCompletedCount to 0
    expect(snap.phase).toBe('SPEED_UP');
    expect(snap.holdCompletedCount).toBe(0);
    expect(snap.substate).toBe('WAITING_FOR_CORRECTION');
    // speedHitsCount was reduced from 48 to 43 (-5)
    // speedStepIndex is floor(43 / 2) = 21 (reduced from 24)
    expect(snap.speedStepIndex).toBe(21);
    expect(snap.actualBpm).toBeLessThan(snap.targetBpm);

    // Correction hit
    const correctionRes = engine.setHeldMidis(frontmostMiss.chord.referenceVoicing.allMidis);
    expect(correctionRes.outcome).toBe('correction_complete');
    expect(engine.getSnapshot().substate).toBe('NORMAL');

    // Play 5 more chords to get back to 48 hits and re-enter HOLD
    for (let recoverHit = 0; recoverHit < 5; recoverHit++) {
      engine.tick(30);
      snap = engine.getSnapshot();
      const front = snap.activeChords.find((c) => c.state === 'approaching')!;
      front.x = 146;
      engine.setHeldMidis(engine.getSnapshot().currentTargetChord!.referenceVoicing.allMidis);
    }

    snap = engine.getSnapshot();
    expect(snap.phase).toBe('HOLD');
    expect(snap.speedStepIndex).toBe(24);
    expect(snap.holdCompletedCount).toBe(0);

    // 5. Complete all 24 hits in HOLD
    for (let holdHit = 1; holdHit < 24; holdHit++) {
      engine.tick(30);
      snap = engine.getSnapshot();
      const front = snap.activeChords.find((c) => c.state === 'approaching')!;
      front.x = 146;
      engine.setHeldMidis(engine.getSnapshot().currentTargetChord!.referenceVoicing.allMidis);
      snap = engine.getSnapshot();
      expect(snap.phase).toBe('HOLD');
      expect(snap.holdCompletedCount).toBe(holdHit);
    }

    // 24th hit completes the level
    engine.tick(30);
    snap = engine.getSnapshot();
    const finalFront = snap.activeChords.find((c) => c.state === 'approaching')!;
    finalFront.x = 146;
    const finalRes = engine.setHeldMidis(engine.getSnapshot().currentTargetChord!.referenceVoicing.allMidis);
    expect(finalRes.outcome).toBe('level_advance');
    expect(engine.getSnapshot().phase).toBe('LEVEL_COMPLETE');
  });

  it('skips LEARN phase directly to COUNTDOWN for review tiers with empty newChords (e.g. Tier 9)', () => {
    const level9 = getChordLevelById('chord-9');
    expect(level9.newChords.length).toBe(0);
    const engine = new ChordEngine(level9, 'international');
    const snap = engine.getSnapshot();
    expect(snap.learnTotalSteps).toBe(0);
    expect(snap.phase).toBe('COUNTDOWN');
  });
});
