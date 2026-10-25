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

describe('RhythmEngine & Curriculum Tests (Self-Paced First-Press Flow)', () => {
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

  // Test 2: First-Press Starts Note 0 (READY -> PLAYING -> FEEDBACK)
  it('starts in READY, begins PLAYING on the very first tap as Note 0, and transitions to FEEDBACK', () => {
    const level1 = RHYTHM_LEVELS[0]!;
    const engine = new RhythmEngine(level1, 0);

    const initSnap = engine.getSnapshot();
    expect(initSnap.phase).toBe('READY');
    expect(initSnap.currentNoteIndex).toBe(0);
    expect(initSnap.feedback).toBeNull();

    const notes = initSnap.flattenedNotes;
    const totalNotes = notes.length;

    // Very first press is Note 0!
    const firstPress = engine.handleNotePress(1000);
    expect(firstPress.noteIndex).toBe(0);
    expect(engine.getSnapshot().phase).toBe('PLAYING');
    expect(engine.getSnapshot().currentNoteIndex).toBe(1);

    // Tap through remaining notes
    const beatPeriod = 60000 / 80; // 750ms per beat
    for (let i = 1; i < totalNotes; i++) {
      const n = notes[i]!;
      const pressTime = 1000 + n.startBeat * beatPeriod;
      const releaseTime = pressTime + n.durationBeats * beatPeriod * 0.8;
      engine.handleNoteRelease(pressTime - 50);
      const res = engine.handleNotePress(pressTime);
      expect(res.noteIndex).toBe(i);
      if (i === totalNotes - 1) {
        // Release final note -> should transition to FEEDBACK
        engine.handleNoteRelease(releaseTime);
        expect(engine.getSnapshot().phase).toBe('FEEDBACK');
        expect(engine.getSnapshot().feedback).not.toBeNull();
      }
    }
  });

  // Test 3: Scale-Free Human Tempo Tolerance (65 BPM vs 115 BPM)
  it('evaluates accurate relative rhythms at any comfortable human tempo with 100% groove score', () => {
    const level1 = RHYTHM_LEVELS[0]!;
    const phrase = level1.phrases[0]!; // nominal target 76 BPM
    const notes = flattenPhraseToNotes(phrase);

    // Run A: User plays at 65 BPM (very relaxed)
    const engineA = new RhythmEngine(level1, 0);
    const beatMsA = 60000 / 65;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]!;
      const press = 1000 + n.startBeat * beatMsA;
      const release = press + n.durationBeats * beatMsA * 0.8;
      engineA.handleNotePress(press);
      engineA.handleNoteRelease(release);
    }
    const feedbackA = engineA.getSnapshot().feedback;
    expect(feedbackA).not.toBeNull();
    expect(feedbackA?.grooveScorePct).toBe(100);
    expect(feedbackA?.passed).toBe(true);
    expect(feedbackA?.estimatedUserBpm).toBe(65);

    // Run B: User plays at 115 BPM (brisk)
    const engineB = new RhythmEngine(level1, 0);
    const beatMsB = 60000 / 115;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]!;
      const press = 5000 + n.startBeat * beatMsB;
      const release = press + n.durationBeats * beatMsB * 0.8;
      engineB.handleNotePress(press);
      engineB.handleNoteRelease(release);
    }
    const feedbackB = engineB.getSnapshot().feedback;
    expect(feedbackB).not.toBeNull();
    expect(feedbackB?.grooveScorePct).toBe(100);
    expect(feedbackB?.passed).toBe(true);
    expect(feedbackB?.estimatedUserBpm).toBe(115);
  });

  // Test 4: Error Hints and Fresh Retry on Failed Phrase
  it('marks early/late notes with error hints on missed timing and starts a fresh retry on next press after debounce', () => {
    const level1 = RHYTHM_LEVELS[0]!;
    const phrase = level1.phrases[0]!;
    const notes = flattenPhraseToNotes(phrase);
    const engine = new RhythmEngine(level1, 0);

    const beatMs = 60000 / 80; // 750ms
    const t0 = 1000;

    let lastRelease = 0;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]!;
      let press = t0 + n.startBeat * beatMs;
      // Intentionally rush Note 2 by 250ms early!
      if (i === 2) {
        press -= 250;
      }
      const release = press + n.durationBeats * beatMs * 0.8;
      engine.handleNotePress(press);
      engine.handleNoteRelease(release);
      lastRelease = release;
    }

    const feedback = engine.getSnapshot().feedback;
    expect(feedback).not.toBeNull();
    expect(feedback?.passed).toBe(false);

    // Note 2 should have errorHint 'early' and status 'missed'
    const evalNote2 = feedback?.noteEvaluations[2];
    expect(evalNote2?.status).toBe('missed');
    expect(evalNote2?.errorHint).toBe('early');

    // Debounce check: pressing within 100ms is ignored
    const pressTooSoon = engine.handleNotePress(lastRelease + 100);
    expect(pressTooSoon.noteIndex).toBe(-1);
    expect(engine.getSnapshot().phase).toBe('FEEDBACK');

    // Pressing after 400ms debounce immediately starts Note 0 of a fresh retry!
    const retryPress = engine.handleNotePress(lastRelease + 400);
    expect(retryPress.noteIndex).toBe(0);
    expect(engine.getSnapshot().phase).toBe('PLAYING');
    expect(engine.getSnapshot().currentNoteIndex).toBe(1);
    expect(engine.getSnapshot().feedback).toBeNull();
  });

  // Test 5: Completing 5 phrases in a level transitions to LEVEL_COMPLETE
  it('completing 5 phrases advances progress from 0 to 5 and transitions to LEVEL_COMPLETE', () => {
    const level1 = RHYTHM_LEVELS[0]!;
    const engine = new RhythmEngine(level1, 0);

    expect(engine.getSnapshot().phrasesCompletedInLevel).toBe(0);
    expect(engine.getSnapshot().phrasesRequiredForLevel).toBe(5);

    let currentTime = 1000;

    for (let p = 0; p < 5; p++) {
      const notes = engine.getSnapshot().flattenedNotes;
      const beatMs = 60000 / 80;
      let phraseEndTime = currentTime;

      for (let i = 0; i < notes.length; i++) {
        const n = notes[i]!;
        const press = currentTime + n.startBeat * beatMs;
        const release = press + n.durationBeats * beatMs * 0.8;
        engine.handleNotePress(press);
        engine.handleNoteRelease(release);
        phraseEndTime = release;
      }

      expect(engine.getSnapshot().phase).toBe('FEEDBACK');
      expect(engine.getSnapshot().feedback?.passed).toBe(true);
      expect(engine.getSnapshot().phrasesCompletedInLevel).toBe(p + 1);

      // Press key after 400ms debounce to confirm feedback and advance to next phrase (or LEVEL_COMPLETE)
      currentTime = phraseEndTime + 400;
      engine.handleNotePress(currentTime);
      engine.handleNoteRelease(currentTime + 50);
      currentTime += 100;

      if (p < 4) {
        expect(engine.getSnapshot().phase).toBe('READY');
      } else {
        expect(engine.getSnapshot().phase).toBe('LEVEL_COMPLETE');
      }
    }

    expect(engine.getSnapshot().phase).toBe('LEVEL_COMPLETE');
  });
});
