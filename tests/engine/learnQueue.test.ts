import { describe, it, expect } from 'vitest';
import { ALL_LEVELS } from '../../src/curriculum/levels';
import { LearnSessionManager } from '../../src/engine/learnQueue';
import { createTarget } from '../../src/music/pitch';

describe('LearnSessionManager', () => {
  it('guarantees total required counts <= 24 across all 36 levels', () => {
    for (const level of ALL_LEVELS) {
      const manager = new LearnSessionManager(level.newNotes, level.reviewNotes);
      const total = manager.getTotalRequiredCount();
      expect(total).toBeLessThanOrEqual(24);
      expect(total).toBeGreaterThan(0);
    }
  });

  it('assigns 5 required hits for new notes and 1 for review notes in single-clef levels', () => {
    const c4 = createTarget('treble', 'C4');
    const d4 = createTarget('treble', 'D4');
    const b3 = createTarget('treble', 'B3');

    const manager = new LearnSessionManager([c4, d4], [b3]);
    // 2 new notes * 5 = 10, 1 review note * 1 = 1 -> total 11
    expect(manager.getTotalRequiredCount()).toBe(11);
    expect(manager.getCompletedCount()).toBe(0);
  });

  it('does NOT count a hit towards completion if a mistake was made on that prompt', () => {
    const c4 = createTarget('treble', 'C4');
    const manager = new LearnSessionManager([c4], []);

    expect(manager.getTotalRequiredCount()).toBe(5);
    expect(manager.getCompletedCount()).toBe(0);

    // Make a mistake on prompt 1
    const failRes = manager.recordAttempt(false);
    expect(failRes.completedPrompt).toBe(false);
    expect(failRes.sessionFinished).toBe(false);
    expect(manager.getCompletedCount()).toBe(0);

    // Now correct the mistake on prompt 1
    const corrRes = manager.recordAttempt(true);
    expect(corrRes.completedPrompt).toBe(true);
    expect(corrRes.sessionFinished).toBe(false);
    // Because a mistake was made on this prompt, the required hit is NOT fulfilled
    expect(manager.getCompletedCount()).toBe(0);

    // Next attempt: first-attempt clean hit
    const cleanRes = manager.recordAttempt(true);
    expect(cleanRes.completedPrompt).toBe(true);
    expect(manager.getCompletedCount()).toBe(1);
  });

  it('completes the session when all clean hits are fulfilled', () => {
    const c4 = createTarget('treble', 'C4');
    const manager = new LearnSessionManager([c4], []);

    for (let i = 0; i < 4; i++) {
      const res = manager.recordAttempt(true);
      expect(res.sessionFinished).toBe(false);
      expect(manager.getCompletedCount()).toBe(i + 1);
    }

    // 5th clean hit finishes the session
    const finalRes = manager.recordAttempt(true);
    expect(finalRes.sessionFinished).toBe(true);
    expect(manager.getCompletedCount()).toBe(5);
    expect(manager.getCurrentTarget()).toBeNull();
  });
});
