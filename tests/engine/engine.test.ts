import { describe, it, expect } from 'vitest';
import { getLevelById } from '../../src/curriculum/graph';
import { ENGINE_GEOMETRY, SightReadingEngine } from '../../src/engine/engine';
import { UserNoteInput } from '../../src/types/input';

describe('SightReadingEngine frame simulation', () => {
  it('progresses through LEARN, COUNTDOWN, SPEED_UP, HOLD, and LEVEL_COMPLETE', () => {
    const level1 = getLevelById('treble-1');
    const engine = new SightReadingEngine(level1);

    // Initial state: LEARN
    let snap = engine.getSnapshot();
    expect(snap.phase).toBe('LEARN');
    expect(snap.activeNotes.length).toBe(1);
    expect(snap.activeNotes[0]!.x).toBe(ENGINE_GEOMETRY.HIT_ZONE_CENTER_X);

    // 1. Wrong key in LEARN
    const wrongInput: UserNoteInput = { source: 'piano_click', midi: 80 };
    const failRes = engine.handleNoteInput(wrongInput);
    expect(failRes.outcome).toBe('wrong_hit');
    expect(engine.getSnapshot().activeNotes[0]!.state).toBe('failed');

    // 2. Correct the failed note
    const correctFirstMidi = snap.activeNotes[0]!.target.pitch.midi;
    const corrRes = engine.handleNoteInput({ source: 'piano_click', midi: correctFirstMidi });
    expect(corrRes.outcome).toBe('correction_complete');

    // 3. Clear all required LEARN notes with clean hits
    while (engine.getSnapshot().phase === 'LEARN') {
      const currentActive = engine.getSnapshot().activeNotes.find(
        (n) => n.state === 'approaching' || n.state === 'failed'
      );
      if (!currentActive) break;
      engine.handleNoteInput({ source: 'piano_click', midi: currentActive.target.pitch.midi });
    }

    // Now should be in COUNTDOWN
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('COUNTDOWN');
    expect(snap.countdownRemainingSec).toBe(3.0);
    expect(snap.activeNotes.length).toBeGreaterThan(0);

    // Key presses in COUNTDOWN should be ignored with empty zone pulse
    const countRes = engine.handleNoteInput({ source: 'piano_click', midi: 60 });
    expect(countRes.outcome).toBe('ignored');
    expect(engine.getSnapshot().emptyZonePulseRemainingMs).toBe(150);

    // Advance 3.0 seconds through countdown
    engine.tick(3000);
    snap = engine.getSnapshot();
    expect(snap.phase).toBe('SPEED_UP');

    // Notes are scrolling
    const x0 = snap.activeNotes[0]!.x;
    engine.tick(100);
    expect(engine.getSnapshot().activeNotes[0]!.x).toBeLessThan(x0);

    // Test early hit within grace zone (x <= 184)
    // Advance time until the frontmost note enters the early grace zone
    while (engine.getSnapshot().activeNotes[0]!.x > 180) {
      engine.tick(50);
    }
    const frontNote = engine.getSnapshot().activeNotes[0]!;
    expect(frontNote.x).toBeLessThanOrEqual(184);
    expect(frontNote.x).toBeGreaterThanOrEqual(120);

    const hitRes = engine.handleNoteInput({
      source: 'piano_click',
      midi: frontNote.target.pitch.midi,
    });
    expect(hitRes.outcome).toBe('correct_hit');

    // Test empty-zone hit when next note is far to the right
    const nextFront = engine.getSnapshot().activeNotes.find((n) => n.state === 'approaching')!;
    if (nextFront.x > 184) {
      const emptyRes = engine.handleNoteInput({ source: 'piano_click', midi: 60 });
      expect(emptyRes.outcome).toBe('empty_zone');
    }

    // Test late miss (let note scroll past left border x < 120)
    while (engine.getSnapshot().substate === 'NORMAL') {
      engine.tick(50);
    }
    snap = engine.getSnapshot();
    expect(snap.substate).toBe('WAITING_FOR_CORRECTION');
    const failed = snap.activeNotes.find((n) => n.state === 'failed')!;
    expect(failed).toBeDefined();
    expect(failed.x).toBe(ENGINE_GEOMETRY.HIT_ZONE_LEFT_X);

    // Scrolling is stopped during correction
    const failedX = failed.x;
    engine.tick(200);
    expect(failed.x).toBe(failedX);

    // Correct the missed note
    const corrMissRes = engine.handleNoteInput({
      source: 'piano_click',
      midi: failed.target.pitch.midi,
    });
    expect(corrMissRes.outcome).toBe('correction_complete');
    expect(engine.getSnapshot().substate).toBe('NORMAL');
  });
});
