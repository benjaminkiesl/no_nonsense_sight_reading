import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { playMutedFeltThud, playSanctuaryRestChime, playSanctuaryWakeChime } from '../../src/audio/recoveryAudio';
import { GrandStaffCanvas } from '../../src/components/GrandStaffCanvas';
import { getLevelById } from '../../src/curriculum/graph';
import { SightReadingEngine } from '../../src/engine/engine';
import { EngineSnapshot } from '../../src/types/engine';

function createEngineInSpeedUp(): SightReadingEngine {
  const level = getLevelById('treble-1');
  const engine = new SightReadingEngine(level);

  // Fast-forward through LEARN phase with correct hits
  while (engine.getSnapshot().phase === 'LEARN') {
    const active = engine.getSnapshot().activeNotes.find(
      (n) => n.state === 'approaching' || n.state === 'failed'
    );
    if (!active) break;
    engine.handleNoteInput({ source: 'piano_click', midi: active.target.pitch.midi });
  }

  // Fast-forward through COUNTDOWN phase (3.0s)
  engine.tick(3000);
  expect(engine.getSnapshot().phase).toBe('SPEED_UP');
  return engine;
}

function hitNextApproachingNote(engine: SightReadingEngine): void {
  while (true) {
    const snap = engine.getSnapshot();
    const frontmost = snap.activeNotes.find((n) => n.state === 'approaching');
    if (frontmost && frontmost.x <= 184 && frontmost.x >= 120) {
      const res = engine.handleNoteInput({
        source: 'piano_click',
        midi: frontmost.target.pitch.midi,
      });
      expect(res.outcome).toBe('correct_hit');
      return;
    }
    engine.tick(20);
  }
}

function wrongHitNextApproachingNote(engine: SightReadingEngine): void {
  while (true) {
    const snap = engine.getSnapshot();
    const frontmost = snap.activeNotes.find((n) => n.state === 'approaching');
    if (frontmost && frontmost.x <= 184 && frontmost.x >= 120) {
      const wrongMidi = frontmost.target.pitch.midi === 60 ? 62 : 60;
      const res = engine.handleNoteInput({
        source: 'piano_click',
        midi: wrongMidi,
      });
      expect(res.outcome).toBe('wrong_hit');
      return;
    }
    engine.tick(20);
  }
}

function correctFailedNote(engine: SightReadingEngine) {
  const snap = engine.getSnapshot();
  const failed = snap.activeNotes.find((n) => n.state === 'failed');
  if (!failed) throw new Error('No failed note found in snapshot');
  return engine.handleNoteInput({
    source: 'piano_click',
    midi: failed.target.pitch.midi,
  });
}

describe('Recovery Pause ("Acoustic Sanctuary")', () => {
  it('audio synthesis functions execute safely without throwing in test/headless environments', () => {
    expect(() => playSanctuaryRestChime()).not.toThrow();
    expect(() => playSanctuaryWakeChime()).not.toThrow();
    expect(() => playMutedFeltThud()).not.toThrow();
  });

  // Test 1: Isolated Slip Does Not Trigger Break
  it('Test 1: isolated slip in SPEED_UP does not trigger recovery pause upon correction', () => {
    const engine = createEngineInSpeedUp();

    hitNextApproachingNote(engine);
    wrongHitNextApproachingNote(engine);

    expect(engine.getSnapshot().substate).toBe('WAITING_FOR_CORRECTION');

    const res = correctFailedNote(engine);
    expect(res.outcome).toBe('correction_complete');
    expect(engine.getSnapshot().substate).toBe('NORMAL');
    expect(engine.getSnapshot().recoveryRemainingMs).toBe(0);
    expect(engine.speedController.actualBpm).toBe(15.0);
  });

  // Test 2: Clustered Mistake <= 6 Notes Triggers Break Post-Correction
  it('Test 2: clustered mistake within <= 6 notes triggers recovery pause post-correction', () => {
    const engine = createEngineInSpeedUp();

    // 1st mistake and immediate correction
    wrongHitNextApproachingNote(engine);
    expect(engine.getSnapshot().substate).toBe('WAITING_FOR_CORRECTION');
    const corr1 = correctFailedNote(engine);
    expect(corr1.outcome).toBe('correction_complete');
    expect(engine.getSnapshot().substate).toBe('NORMAL');

    // Hit 3 correct notes (<= 6 threshold)
    for (let i = 0; i < 3; i++) {
      hitNextApproachingNote(engine);
    }

    // 2nd mistake occurs within 3 notes of previous failure
    wrongHitNextApproachingNote(engine);
    expect(engine.getSnapshot().substate).toBe('WAITING_FOR_CORRECTION');

    // Strike correct note to resolve mistake -> transitions to RECOVERY_PAUSE
    const corr2 = correctFailedNote(engine);
    expect(corr2.outcome).toBe('correction_complete');
    expect(engine.getSnapshot().substate).toBe('RECOVERY_PAUSE');
    expect(engine.getSnapshot().recoveryRemainingMs).toBe(6500);
  });

  // Test 3: Correction Double-Fault Triggers Break
  it('Test 3: hitting >= 2 wrong keys during correction triggers recovery pause', () => {
    const engine = createEngineInSpeedUp();

    // Hit 10 clean notes
    for (let i = 0; i < 10; i++) {
      hitNextApproachingNote(engine);
    }

    // Make an isolated mistake
    wrongHitNextApproachingNote(engine);
    expect(engine.getSnapshot().substate).toBe('WAITING_FOR_CORRECTION');

    const snap = engine.getSnapshot();
    const failed = snap.activeNotes.find((n) => n.state === 'failed')!;
    const wrongMidi = failed.target.pitch.midi === 60 ? 62 : 60;

    // First wrong key during correction
    const w1 = engine.handleNoteInput({ source: 'piano_click', midi: wrongMidi });
    expect(w1.outcome).toBe('wrong_hit');
    expect(engine.getSnapshot().substate).toBe('WAITING_FOR_CORRECTION');

    // Second wrong key during correction (double fault!)
    const w2 = engine.handleNoteInput({ source: 'piano_click', midi: wrongMidi });
    expect(w2.outcome).toBe('wrong_hit');
    expect(engine.getSnapshot().substate).toBe('WAITING_FOR_CORRECTION');

    // Now resolve with the correct key
    const corr = correctFailedNote(engine);
    expect(corr.outcome).toBe('correction_complete');
    expect(engine.getSnapshot().substate).toBe('RECOVERY_PAUSE');
    expect(engine.getSnapshot().recoveryRemainingMs).toBe(6500);
  });

  // Test 4: HOLD Phase Mistake Triggers Break Post-Correction
  it('Test 4: any mistake in HOLD phase triggers recovery pause post-correction', () => {
    const engine = createEngineInSpeedUp();

    // Fast-track speed controller to 90.0 BPM (Hold threshold)
    engine.speedController.tick(4.0, false); // Complete initial 4.0s recovery ramp
    engine.speedController.targetBpm = 89.9;
    engine.speedController.actualBpm = 89.9;

    // Single hit reaches 90.0 BPM and enters HOLD phase
    hitNextApproachingNote(engine);
    expect(engine.getSnapshot().phase).toBe('HOLD');

    // Mistake in HOLD phase
    wrongHitNextApproachingNote(engine);
    expect(engine.getSnapshot().substate).toBe('WAITING_FOR_CORRECTION');

    // Resolve with correct key -> enters RECOVERY_PAUSE
    const corr = correctFailedNote(engine);
    expect(corr.outcome).toBe('correction_complete');
    expect(engine.getSnapshot().substate).toBe('RECOVERY_PAUSE');
    expect(engine.getSnapshot().recoveryRemainingMs).toBe(6500);
  });

  // Test 5: Impatient Key Presses During Break Are Muted & Non-Punitive
  it('Test 5: key inputs during RECOVERY_PAUSE return recovery_muted without penalties', () => {
    const engine = createEngineInSpeedUp();

    // Trigger recovery pause via double-fault
    wrongHitNextApproachingNote(engine);
    const snap = engine.getSnapshot();
    const failed = snap.activeNotes.find((n) => n.state === 'failed')!;
    const wrongMidi = failed.target.pitch.midi === 60 ? 62 : 60;
    engine.handleNoteInput({ source: 'piano_click', midi: wrongMidi });
    engine.handleNoteInput({ source: 'piano_click', midi: wrongMidi });
    correctFailedNote(engine);
    expect(engine.getSnapshot().substate).toBe('RECOVERY_PAUSE');

    // Send impatient inputs
    const r1 = engine.handleNoteInput({ source: 'piano_click', midi: 60 });
    expect(r1.outcome).toBe('recovery_muted');

    const r2 = engine.handleNoteInput({ source: 'midi', midi: 72 });
    expect(r2.outcome).toBe('recovery_muted');

    // Verify recovery timer was not altered
    expect(engine.getSnapshot().recoveryRemainingMs).toBe(6500);

    // Verify no notes became failed
    expect(engine.getSnapshot().activeNotes.every((n) => n.state !== 'failed')).toBe(true);
  });

  // Test 6: 6.5s Timeline & Resumption
  it('Test 6: 6.5s timeline keeps notes stationary and resumes NORMAL scrolling at 0ms', () => {
    const engine = createEngineInSpeedUp();

    wrongHitNextApproachingNote(engine);
    const snap0 = engine.getSnapshot();
    const failed = snap0.activeNotes.find((n) => n.state === 'failed')!;
    const wrongMidi = failed.target.pitch.midi === 60 ? 62 : 60;
    engine.handleNoteInput({ source: 'piano_click', midi: wrongMidi });
    engine.handleNoteInput({ source: 'piano_click', midi: wrongMidi });
    correctFailedNote(engine);

    expect(engine.getSnapshot().substate).toBe('RECOVERY_PAUSE');
    expect(engine.getSnapshot().recoveryRemainingMs).toBe(6500);

    const xBefore = engine.getSnapshot().activeNotes.find((n) => n.state === 'approaching')!.x;

    // Advance 5500 ms (5.5s) to the lookahead boundary
    engine.tick(5500);
    const snap5500 = engine.getSnapshot();
    expect(snap5500.substate).toBe('RECOVERY_PAUSE');
    expect(snap5500.recoveryRemainingMs).toBe(1000);
    const xAt5500 = snap5500.activeNotes.find((n) => n.state === 'approaching')!.x;
    expect(xAt5500).toBe(xBefore); // completely stationary

    // Advance remaining 1000 ms (1.0s)
    engine.tick(1000);
    const snap6500 = engine.getSnapshot();
    expect(snap6500.substate).toBe('NORMAL');
    expect(snap6500.recoveryRemainingMs).toBe(0);
    expect(snap6500.actualBpm).toBe(15.0); // Recovery ramp started at 15.0 BPM

    // Advance 100 ms further in NORMAL substate
    engine.tick(100);
    const xAfter = engine.getSnapshot().activeNotes.find((n) => n.state === 'approaching')!.x;
    expect(xAfter).toBeLessThan(xBefore); // scrolling resumed
  });

  // Test 7: UI Overlay Verification
  it('Test 7: GrandStaffCanvas renders sanctuary overlay with text and zero numeric countdown digits', () => {
    const level = getLevelById('treble-1');
    const sanctuarySnapshot: EngineSnapshot = {
      levelId: 'treble-1',
      phase: 'SPEED_UP',
      substate: 'RECOVERY_PAUSE',
      recoveryRemainingMs: 5000,
      countdownRemainingSec: 0,
      actualBpm: 15,
      targetBpm: 60,
      learnStepIndex: 15,
      learnTotalSteps: 15,
      speedStepIndex: 10,
      speedTotalSteps: 24,
      holdCompletedCount: 0,
      holdTotalCount: 32,
      activeNotes: [],
      emptyZonePulseRemainingMs: 0,
      levelCompleteGuardRemainingMs: 0,
    };

    const { container, rerender } = render(
      React.createElement(GrandStaffCanvas, { snapshot: sanctuarySnapshot, level })
    );

    const overlay = container.querySelector('[data-testid="recovery-sanctuary-overlay"]');
    expect(overlay).not.toBeNull();
    expect(overlay?.classList.contains('active')).toBe(true);
    expect(overlay?.classList.contains('lookahead')).toBe(false);
    expect(overlay?.getAttribute('aria-hidden')).toBe('false');

    // Prompt text verification
    expect(overlay?.textContent).toContain('Close your eyes. Drop your shoulders.');
    expect(overlay?.textContent).toContain('A chime will wake the staff.');

    // Strict constraint: zero digits
    expect(overlay?.textContent).not.toMatch(/\d/);

    // Lookahead phase (recoveryRemainingMs <= 1000)
    const lookaheadSnapshot: EngineSnapshot = {
      ...sanctuarySnapshot,
      recoveryRemainingMs: 800,
    };
    rerender(React.createElement(GrandStaffCanvas, { snapshot: lookaheadSnapshot, level }));
    expect(overlay?.classList.contains('active')).toBe(false);
    expect(overlay?.classList.contains('lookahead')).toBe(true);
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');

    // Normal phase (recoveryRemainingMs === 0, substate NORMAL)
    const normalSnapshot: EngineSnapshot = {
      ...sanctuarySnapshot,
      substate: 'NORMAL',
      recoveryRemainingMs: 0,
    };
    rerender(React.createElement(GrandStaffCanvas, { snapshot: normalSnapshot, level }));
    expect(overlay?.classList.contains('active')).toBe(false);
    expect(overlay?.classList.contains('lookahead')).toBe(false);
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
  });
});
