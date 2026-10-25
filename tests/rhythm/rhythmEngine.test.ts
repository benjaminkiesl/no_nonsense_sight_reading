import { describe, expect, it } from 'vitest';
import {
  CELLS,
  RHYTHM_LEVELS,
  flattenPhraseToNotes,
  getRhythmLevelById,
  isRhythmLevelId,
} from '../../src/rhythm/curriculum';
import { RhythmEngine } from '../../src/rhythm/engine';
import { RhythmPhrase } from '../../src/types/rhythm';

describe('RhythmEngine & Curriculum Tests (4-Stage Count-In & Global Shift Flow)', () => {
  // Test 1: 12 Levels & Phrase Flattening & "+1 Landing"
  it('contains 12 progressive rhythm levels and flattens tied subdivisions with isLandingNote: true on final note', () => {
    expect(RHYTHM_LEVELS.length).toBe(12);

    for (let i = 1; i <= 12; i++) {
      const id = `rhythm-${i}`;
      expect(isRhythmLevelId(id)).toBe(true);
      const lvl = getRhythmLevelById(id);
      expect(lvl.tier).toBe(i);
      expect(lvl.phrases.length).toBe(5);
    }

    // Verify tied event flattening
    const testPhrase: RhythmPhrase = {
      id: 'test-tie',
      tier: 4,
      timeSignature: '4/4',
      beatsPerBar: 4,
      beatUnit: 4,
      targetBpm: 76,
      beatCells: [CELLS.q, CELLS.tie_e_note_e, CELLS.q],
    };

    const notes = flattenPhraseToNotes(testPhrase);
    expect(notes.length).toBe(3);

    // Note 0: q (1.0) merged with hold (0.5) = 1.5 beats
    expect(notes[0]?.startBeat).toBe(0.0);
    expect(notes[0]?.durationBeats).toBe(1.5);
    expect(notes[0]?.isLandingNote).toBe(false);

    // Note 1: 0.5 attack at 1.5
    expect(notes[1]?.startBeat).toBe(1.5);
    expect(notes[1]?.durationBeats).toBe(0.5);
    expect(notes[1]?.isLandingNote).toBe(false);

    // Note 2: Landing downbeat note
    expect(notes[2]?.startBeat).toBe(2.0);
    expect(notes[2]?.durationBeats).toBe(1.0);
    expect(notes[2]?.isLandingNote).toBe(true);
  });

  // Test 2: 4-Stage Count-In Workflow ('STUDY' -> 'COUNT_IN' -> 'READY_TO_PLAY' -> 'PLAYING' -> 'FEEDBACK')
  it('progresses through STUDY, COUNT_IN, READY_TO_PLAY, PLAYING, and FEEDBACK', () => {
    const level1 = RHYTHM_LEVELS[0]!;
    const engine = new RhythmEngine(level1, 0);

    // Stage 1: STUDY
    const initSnap = engine.getSnapshot();
    expect(initSnap.phase).toBe('STUDY');
    expect(initSnap.feedback).toBeNull();

    const targetBpm = initSnap.phrase.targetBpm;
    const beatPeriod = 60000 / targetBpm;

    // Stage 2: COUNT_IN
    engine.startCountIn(1000);
    expect(engine.getSnapshot().phase).toBe('COUNT_IN');
    // During 400ms lead-in, countInBeatIndex is -1 (waiting before beat 0 click)
    expect(engine.getSnapshot().countInBeatIndex).toBe(-1);

    const leadIn = RhythmEngine.COUNT_IN_LEAD_IN_MS;

    // After lead-in, Beat 0 clicks
    engine.tick(1000 + leadIn);
    expect(engine.getSnapshot().countInBeatIndex).toBe(0);

    // Tick through 4 beats of count-in
    engine.tick(1000 + leadIn + beatPeriod);
    expect(engine.getSnapshot().countInBeatIndex).toBe(1);

    engine.tick(1000 + leadIn + beatPeriod * 2);
    expect(engine.getSnapshot().countInBeatIndex).toBe(2);

    engine.tick(1000 + leadIn + beatPeriod * 3);
    expect(engine.getSnapshot().countInBeatIndex).toBe(3);

    // After 4 beats, metronome stops and transitions to READY_TO_PLAY
    const resCountInEnd = engine.tick(1000 + leadIn + beatPeriod * 4);
    expect(resCountInEnd.transitionedToReadyToPlay).toBe(true);
    expect(engine.getSnapshot().phase).toBe('READY_TO_PLAY');

    // Stage 3: In READY_TO_PLAY, user starts at any point in time. Very first tap IS Note 0!
    const userStartTime = 5000; // User waits a bit before starting
    const firstPress = engine.handleNotePress(userStartTime);
    expect(firstPress.noteIndex).toBe(0);
    expect(engine.getSnapshot().phase).toBe('PLAYING');
    expect(engine.getSnapshot().currentNoteIndex).toBe(1);

    // Tap remaining notes
    const notes = engine.getSnapshot().flattenedNotes;
    for (let i = 1; i < notes.length; i++) {
      const n = notes[i]!;
      const pressTime = userStartTime + n.startBeat * beatPeriod;
      const releaseTime = pressTime + n.durationBeats * beatPeriod * 0.8;
      engine.handleNoteRelease(pressTime - 50);
      const res = engine.handleNotePress(pressTime);
      expect(res.noteIndex).toBe(i);

      if (i === notes.length - 1) {
        engine.handleNoteRelease(releaseTime);
        // Stage 4: Transitions to FEEDBACK
        expect(engine.getSnapshot().phase).toBe('FEEDBACK');
        expect(engine.getSnapshot().feedback).not.toBeNull();
        expect(engine.getSnapshot().feedback?.passed).toBe(true);
        expect(engine.getSnapshot().feedback?.shiftedTaps.length).toBe(notes.length);
      }
    }
  });

  // Test 3: Global 1-Parameter Least-Squares Shift (t0_hat) Absorbs Constant Latency
  it('absorbs constant latency offset via global shift t0_hat, producing 100% groove score and populated shiftedTaps', () => {
    const level1 = RHYTHM_LEVELS[0]!;
    const engine = new RhythmEngine(level1, 0);
    const phrase = level1.phrases[0]!;
    const beatMs = 60000 / phrase.targetBpm;
    const notes = flattenPhraseToNotes(phrase);

    // Move to READY_TO_PLAY
    engine.startCountIn(1000);
    engine.tick(1000 + RhythmEngine.COUNT_IN_LEAD_IN_MS + phrase.beatsPerBar * beatMs);
    expect(engine.getSnapshot().phase).toBe('READY_TO_PLAY');

    // User plays with a constant 60ms latency on every note
    const baseTime = 10000;
    const latencyOffset = 60;

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]!;
      const press = baseTime + n.startBeat * beatMs + latencyOffset;
      const release = press + n.durationBeats * beatMs * 0.8;
      engine.handleNotePress(press);
      engine.handleNoteRelease(release);
    }

    const feedback = engine.getSnapshot().feedback;
    expect(feedback).not.toBeNull();
    expect(feedback?.passed).toBe(true);
    expect(feedback?.grooveScorePct).toBe(100);

    // All shifted taps should have status 'perfect'
    expect(feedback?.shiftedTaps.length).toBe(notes.length);
    for (const tap of feedback!.shiftedTaps) {
      expect(tap.status).toBe('perfect');
    }
  });

  // Test 4: Nearest-Note Matching & Time Window Timeout on Skipped Notes
  it('matches notes nearest to grid within 0.48 beats, marks skipped note missed, and auto-finishes via time window timeout', () => {
    const level1 = RHYTHM_LEVELS[0]!;
    const engine = new RhythmEngine(level1, 0);
    const phrase = level1.phrases[0]!;
    const beatMs = 60000 / phrase.targetBpm;
    const notes = flattenPhraseToNotes(phrase);

    engine.startCountIn(1000);
    engine.tick(1000 + RhythmEngine.COUNT_IN_LEAD_IN_MS + phrase.beatsPerBar * beatMs);

    const baseTime = 2000;
    // Play Note 0
    engine.handleNotePress(baseTime);
    engine.handleNoteRelease(baseTime + beatMs * 0.8);

    // SKIPPING Note 1!
    // Play Note 2 onwards:
    for (let i = 2; i < notes.length; i++) {
      const n = notes[i]!;
      const press = baseTime + n.startBeat * beatMs;
      const release = press + n.durationBeats * beatMs * 0.8;
      engine.handleNotePress(press);
      engine.handleNoteRelease(release);
    }

    // Engine is still in PLAYING because M < N
    expect(engine.getSnapshot().phase).toBe('PLAYING');

    // Tick forward until phrase time window (totalPhraseBeats + 1.0) * beatMs elapses
    const totalPhraseBeats = phrase.beatCells.length;
    const timeoutTime = baseTime + (totalPhraseBeats + 1.2) * beatMs;
    const tickRes = engine.tick(timeoutTime);

    expect(tickRes.transitionedToFeedback).toBe(true);
    expect(engine.getSnapshot().phase).toBe('FEEDBACK');

    const feedback = engine.getSnapshot().feedback;
    expect(feedback).not.toBeNull();
    expect(feedback?.passed).toBe(false);

    // Note 1 was skipped -> status: 'missed'
    const evalNote1 = feedback?.noteEvaluations[1];
    expect(evalNote1?.status).toBe('missed');
    expect(evalNote1?.errorHint).toBe('missed');

    // Note 2 was played on time -> status: 'perfect'
    const evalNote2 = feedback?.noteEvaluations[2];
    expect(evalNote2?.status).toBe('perfect');

    // In FEEDBACK phase after failure: retrying ALWAYS triggers count-in (never direct PLAYING)
    const retryTime = timeoutTime + 500;
    engine.handleNotePress(retryTime);
    expect(engine.getSnapshot().phase).toBe('COUNT_IN');
  });

  // Test 5: Debounce Retry on Failed Phrase & 5-Phrase Progression
  it('debounces retry presses after feedback and transitions to LEVEL_COMPLETE on 5 passed phrases', () => {
    const level1 = RHYTHM_LEVELS[0]!;
    const engine = new RhythmEngine(level1, 0);

    expect(engine.getSnapshot().phrasesCompletedInLevel).toBe(0);
    expect(engine.getSnapshot().phrasesRequiredForLevel).toBe(5);

    let currentTime = 1000;

    for (let p = 0; p < 5; p++) {
      const phrase = engine.getSnapshot().phrase;
      const beatMs = 60000 / phrase.targetBpm;

      // Start count in
      engine.startCountIn(currentTime);
      currentTime += RhythmEngine.COUNT_IN_LEAD_IN_MS + phrase.beatsPerBar * beatMs;
      engine.tick(currentTime);
      expect(engine.getSnapshot().phase).toBe('READY_TO_PLAY');

      const notes = engine.getSnapshot().flattenedNotes;
      const tapStart = currentTime + 500;
      let lastRelease = tapStart;

      for (let i = 0; i < notes.length; i++) {
        const n = notes[i]!;
        const press = tapStart + n.startBeat * beatMs;
        const release = press + n.durationBeats * beatMs * 0.8;
        engine.handleNotePress(press);
        engine.handleNoteRelease(release);
        lastRelease = release;
      }

      expect(engine.getSnapshot().phase).toBe('FEEDBACK');
      expect(engine.getSnapshot().feedback?.passed).toBe(true);
      expect(engine.getSnapshot().phrasesCompletedInLevel).toBe(p + 1);

      currentTime = lastRelease + 400;

      if (p < 4) {
        // Advance to next phrase
        engine.advanceToNextPhrase();
        expect(engine.getSnapshot().phase).toBe('STUDY');
      } else {
        engine.advanceToNextPhrase();
        expect(engine.getSnapshot().phase).toBe('LEVEL_COMPLETE');
      }
    }

    expect(engine.getSnapshot().phase).toBe('LEVEL_COMPLETE');
  });

  // Test 6: User Screenshot Bug Reproduction & Fix Verification
  // In Level 2 Phrase 2 (r2-p2), eighth notes on beat 5.0 and 5.5 played with slight steady drift
  // must match Tap 8 to Note 8, Tap 9 to Note 9, Tap 10 to Note 10 with 0 orphaned taps!
  it('aligns consecutive eighth notes correctly when played with slight steady tempo drift without greedy cascade or orphaning Note 8', () => {
    const level2 = RHYTHM_LEVELS[1]!; // rhythm-2: Eighth-Note Flow
    const engine = new RhythmEngine(level2, 1); // phrase 2: r2-p2
    const phrase = engine.getSnapshot().phrase;
    expect(phrase.id).toBe('r2-p2');

    const beatMs = 60000 / phrase.targetBpm;
    const notes = engine.getSnapshot().flattenedNotes;
    expect(notes.length).toBe(13);

    // Note 8 is the 3rd note of Bar 2 (startBeat 5.0, eighth note)
    expect(notes[6]?.startBeat).toBe(4.0); // Bar 2, note 1
    expect(notes[7]?.startBeat).toBe(4.5); // Bar 2, note 2
    expect(notes[8]?.startBeat).toBe(5.0); // Bar 2, note 3
    expect(notes[9]?.startBeat).toBe(5.5); // Bar 2, note 4
    expect(notes[10]?.startBeat).toBe(6.0); // Bar 2, note 5 (quarter)

    engine.startCountIn(1000);
    engine.tick(1000 + RhythmEngine.COUNT_IN_LEAD_IN_MS + phrase.beatsPerBar * beatMs);
    expect(engine.getSnapshot().phase).toBe('READY_TO_PLAY');

    const baseTime = 5000;
    // Simulate user playing all 13 notes with a slight steady drift:
    // Bar 1 notes played on time
    // Bar 2 notes played slightly behind (~0.26 beats drift on eighths)
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]!;
      const driftBeats = i >= 8 ? 0.26 : 0.05;
      const press = baseTime + (n.startBeat + driftBeats) * beatMs;
      const release = press + n.durationBeats * beatMs * 0.8;
      engine.handleNotePress(press);
      engine.handleNoteRelease(release);
    }

    const feedback = engine.getSnapshot().feedback;
    expect(feedback).not.toBeNull();

    // Verify 1-to-1 matching: Tap 8 MUST match Note 8, Tap 9 MUST match Note 9, Tap 10 MUST match Note 10!
    const noteEval8 = feedback?.noteEvaluations[8];
    const noteEval9 = feedback?.noteEvaluations[9];
    const noteEval10 = feedback?.noteEvaluations[10];

    expect(noteEval8?.status).not.toBe('missed');
    expect(noteEval9?.status).not.toBe('missed');
    expect(noteEval10?.status).not.toBe('missed');

    // No orphaned taps!
    const orphanedTaps = feedback?.shiftedTaps.filter((t) => t.matchedNoteIndex === null);
    expect(orphanedTaps?.length).toBe(0);

    // Dotted lines connect Tap 8 -> Note 8, Tap 9 -> Note 9, Tap 10 -> Note 10
    expect(feedback?.shiftedTaps[8]?.matchedNoteIndex).toBe(8);
    expect(feedback?.shiftedTaps[9]?.matchedNoteIndex).toBe(9);
    expect(feedback?.shiftedTaps[10]?.matchedNoteIndex).toBe(10);
  });
});
