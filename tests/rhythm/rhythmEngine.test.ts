import { describe, expect, it } from 'vitest';
import {
  CELL_LIBRARY,
  RHYTHM_LEVELS,
  flattenPhraseToNotes,
} from '../../src/rhythm/curriculum';
import { RhythmEngine } from '../../src/rhythm/engine';
import { RhythmPhrase } from '../../src/types/rhythm';

describe('RhythmEngine & Curriculum Specification Tests', () => {
  // Test 1: Phrase Flattening & "+1 Landing" Rule
  it('Test 1: merges tied cells into continuous durations and marks final note as landing', () => {
    const testPhrase: RhythmPhrase = {
      id: 'test-dotted-tie',
      title: 'Dotted Tie Test',
      timeSignature: '4/4',
      beatsPerBar: 4,
      targetBpm: 76,
      beatCells: [CELL_LIBRARY.q, CELL_LIBRARY.tie_e_note_e, CELL_LIBRARY.q],
    };

    const notes = flattenPhraseToNotes(testPhrase);

    // Expect 3 notes total:
    // 1. Beat 0: q (1.0) merged with tie_e (0.5) = 1.5 beats
    // 2. Beat 1 second eighth: note_e = 0.5 beats starting at 1.5
    // 3. Beat 2 landing: q = 1.0 beats starting at 2.0
    expect(notes.length).toBe(3);

    expect(notes[0]?.startBeat).toBe(0.0);
    expect(notes[0]?.durationBeats).toBe(1.5);
    expect(notes[0]?.isLandingNote).toBe(false);

    expect(notes[1]?.startBeat).toBe(1.5);
    expect(notes[1]?.durationBeats).toBe(0.5);
    expect(notes[1]?.isLandingNote).toBe(false);

    expect(notes[2]?.startBeat).toBe(2.0);
    expect(notes[2]?.durationBeats).toBe(1.0);
    expect(notes[2]?.isLandingNote).toBe(true);

    // Also verify authentic repertoire phrases in curriculum obey "+1 Landing"
    const mozartPhrase = RHYTHM_LEVELS[0]?.phrases[4];
    expect(mozartPhrase).toBeDefined();
    if (mozartPhrase) {
      const mozartNotes = flattenPhraseToNotes(mozartPhrase);
      const lastNote = mozartNotes[mozartNotes.length - 1];
      expect(lastNote?.isLandingNote).toBe(true);
    }
  });

  // Test 2: Sandbox Self-Paced Rehearsal & Left-Hand Pulse
  it('Test 2: advances sandboxMatchedCount in SANDBOX without timeout or penalties and tracks LH pulse', () => {
    const level1 = RHYTHM_LEVELS[0];
    expect(level1).toBeDefined();
    if (!level1) return;

    const engine = new RhythmEngine(level1, 0);
    const snapInit = engine.getSnapshot();
    expect(snapInit.phase).toBe('SANDBOX');
    expect(snapInit.sandboxMatchedCount).toBe(0);
    expect(snapInit.leftHandPulseCount).toBe(0);

    const totalNotes = snapInit.flattenedNotes.length;

    // Simulate tapping through each note at an arbitrary irregular tempo
    for (let i = 0; i < totalNotes; i++) {
      const res = engine.handleNotePress(1000 + i * 1500); // 1.5s per note
      expect(res.noteIndex).toBe(i);
      engine.handleNoteRelease(1000 + i * 1500 + 400);
      expect(engine.getSnapshot().sandboxMatchedCount).toBe((i + 1) % totalNotes);
    }

    // After tapping all notes, count wraps back to 0 for unlimited rehearsal
    expect(engine.getSnapshot().sandboxMatchedCount).toBe(0);
    expect(engine.getSnapshot().phase).toBe('SANDBOX');
    expect(engine.getSnapshot().feedback).toBeNull();

    // Test Left-Hand pulse tracking
    engine.handleLeftHandPulse(5000);
    engine.handleLeftHandPulse(6000);
    expect(engine.getSnapshot().leftHandPulseCount).toBe(2);
  });

  // Test 3: Count-In to Disappearing-Pulse Perform Transition
  it('Test 3: executes 1 bar of count-in clicks and transitions cleanly to PERFORM', () => {
    const level1 = RHYTHM_LEVELS[0];
    expect(level1).toBeDefined();
    if (!level1) return;

    const engine = new RhythmEngine(level1, 0);
    const targetBpm = engine.getSnapshot().phrase.targetBpm;
    const beatPeriodMs = 60000 / targetBpm;
    const beatsPerBar = engine.getSnapshot().phrase.beatsPerBar;

    const tStart = 1000;
    engine.startCountIn(tStart);
    expect(engine.getSnapshot().phase).toBe('COUNT_IN');
    expect(engine.getSnapshot().countInBeatIndex).toBe(0);

    // Tick through the bar
    for (let b = 1; b < beatsPerBar; b++) {
      const tTick = tStart + b * beatPeriodMs + 10;
      const tickRes = engine.tick(tTick);
      expect(engine.getSnapshot().phase).toBe('COUNT_IN');
      expect(engine.getSnapshot().countInBeatIndex).toBe(b);
      expect(tickRes.countInClick?.beatIndex).toBe(b);
    }

    // Tick past the final beat of count-in -> should transition to PERFORM
    const tPerform = tStart + beatsPerBar * beatPeriodMs + 5;
    engine.tick(tPerform);
    expect(engine.getSnapshot().phase).toBe('PERFORM');
    expect(engine.getSnapshot().performTapCount).toBe(0);
  });

  // Test 4: Relative-IOI Groove Grading & Tempo Drift Tolerance
  it('Test 4: evaluates +5% faster tempo with accurate relative IOIs yielding grooveScorePct >= 95% and passed === true', () => {
    const level1 = RHYTHM_LEVELS[0];
    expect(level1).toBeDefined();
    if (!level1) return;

    // Phrase 1: "Quarter Stride" (4/4, 76 BPM -> target beat period 789.47 ms)
    const engine = new RhythmEngine(level1, 0);
    const notes = engine.getSnapshot().flattenedNotes;
    const beatsPerBar = engine.getSnapshot().phrase.beatsPerBar;
    const targetBpm = engine.getSnapshot().phrase.targetBpm;
    const targetBeatPeriod = 60000 / targetBpm;

    const tStart = 0;
    engine.startCountIn(tStart);

    // Advance past count-in
    const tPerformStart = tStart + beatsPerBar * targetBeatPeriod;
    engine.tick(tPerformStart);
    expect(engine.getSnapshot().phase).toBe('PERFORM');

    // Simulate user playing at a steady 80 BPM (beat period = 750 ms)
    // 80 BPM vs 76 BPM = +5.26% tempo drift
    const userBeatPeriod = 60000 / 80;

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]!;
      const pressTime = tPerformStart + n.startBeat * userBeatPeriod;
      const releaseTime = pressTime + n.durationBeats * userBeatPeriod * 0.85;

      engine.handleNotePress(pressTime);
      engine.handleNoteRelease(releaseTime);
    }

    const summary = engine.evaluatePerformance();

    // The user played the rhythmic ratios with 0 relative onset error, breathing slightly faster
    expect(summary.grooveScorePct).toBeGreaterThanOrEqual(95);
    expect(summary.holdScorePct).toBeGreaterThanOrEqual(90);
    expect(summary.passed).toBe(true);
    expect(summary.estimatedUserBpm).toBe(80);
    expect(summary.pulseDriftPct).toBeGreaterThan(4.5);
    expect(summary.pulseDriftPct).toBeLessThan(6.0);
  });

  // Test 5: Hold Duration / Articulation Evaluation
  it('Test 5: distinguishes proper sustained holds from ultra-short staccato touches', () => {
    const level2 = RHYTHM_LEVELS[1]; // Tier 2 (Dotted notes)
    expect(level2).toBeDefined();
    if (!level2) return;

    const phrase = level2.phrases[0]!; // "Dotted Quarter Walk" (1.5 beat sustained note)
    const notes = flattenPhraseToNotes(phrase);

    // Case A: Proper holds (80% duty cycle)
    const engineA = new RhythmEngine(level2, 0);
    const bpm = phrase.targetBpm;
    const beatMs = 60000 / bpm;
    engineA.startCountIn(0);
    engineA.tick(4 * beatMs);

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]!;
      const press = 4 * beatMs + n.startBeat * beatMs;
      const release = press + n.durationBeats * beatMs * 0.8;
      engineA.handleNotePress(press);
      engineA.handleNoteRelease(release);
    }
    const summaryA = engineA.evaluatePerformance();

    // Case B: Ultra-short staccato pokes (35 ms hold on all notes)
    const engineB = new RhythmEngine(level2, 0);
    engineB.startCountIn(0);
    engineB.tick(4 * beatMs);

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]!;
      const press = 4 * beatMs + n.startBeat * beatMs;
      const release = press + 35; // staccato poke!
      engineB.handleNotePress(press);
      engineB.handleNoteRelease(release);
    }
    const summaryB = engineB.evaluatePerformance();

    // Verify holdScorePct reflects articulation difference
    expect(summaryA.holdScorePct).toBeGreaterThanOrEqual(90);
    expect(summaryB.holdScorePct).toBeLessThan(summaryA.holdScorePct);
    expect(summaryB.holdScorePct).toBeLessThan(50);
  });

  // Test 6: 2× Metric Zoom Twin Linking
  it('Test 6: switches between 1× sixteenth pattern and 2× eighth twin groove', () => {
    const level4 = RHYTHM_LEVELS[3]; // Tier 4 (Sixteenths)
    expect(level4).toBeDefined();
    if (!level4) return;

    // Phrase 2 is gallop-1x
    const gallop1xIdx = level4.phrases.findIndex((p) => p.id === 'gallop-1x');
    expect(gallop1xIdx).toBeGreaterThan(-1);

    const engine = new RhythmEngine(level4, gallop1xIdx);
    expect(engine.getSnapshot().phrase.id).toBe('gallop-1x');
    expect(engine.getSnapshot().phrase.targetBpm).toBe(68);

    // Toggle 2x Zoom
    const didZoom = engine.toggleMetricZoom();
    expect(didZoom).toBe(true);
    expect(engine.getSnapshot().phrase.id).toBe('gallop-2x');
    expect(engine.getSnapshot().phrase.targetBpm).toBe(136);

    // Toggle back
    const didZoomBack = engine.toggleMetricZoom();
    expect(didZoomBack).toBe(true);
    expect(engine.getSnapshot().phrase.id).toBe('gallop-1x');
    expect(engine.getSnapshot().phrase.targetBpm).toBe(68);
  });
});
