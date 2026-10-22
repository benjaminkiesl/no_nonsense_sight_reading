import { describe, it, expect } from 'vitest';
import { SpeedController } from '../../src/engine/speed';

describe('SpeedController physics & transitions', () => {
  it('starts at 15 BPM actual and ramps to 20 BPM target over 4.0 seconds', () => {
    const sc = new SpeedController();
    expect(sc.actualBpm).toBe(15.0);
    expect(sc.targetBpm).toBe(20.0);
    expect(sc.getSpeedStepIndex()).toBe(0);

    // Halfway through ramp (2.0s)
    sc.tick(2.0, false);
    expect(sc.actualBpm).toBeCloseTo(17.5, 1);
    expect(sc.targetBpm).toBe(20.0);

    // End of ramp (another 2.0s)
    sc.tick(2.0, false);
    expect(sc.actualBpm).toBe(20.0);
    expect(sc.targetBpm).toBe(20.0);
  });

  it('increases targetBpm by 0.3 on each correct hit, reaching 90 BPM after 234 hits', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false); // Finish initial ramp to 20 BPM

    for (let i = 1; i <= 233; i++) {
      const res = sc.onCorrectHit('SPEED_UP');
      expect(res.nextPhase).toBe('SPEED_UP');
      expect(sc.targetBpm).toBeCloseTo(20.0 + i * 0.3, 2);
    }

    // 234th hit reaches 90 BPM and enters HOLD
    const finalRes = sc.onCorrectHit('SPEED_UP');
    expect(sc.targetBpm).toBe(90.0);
    expect(sc.actualBpm).toBe(90.0);
    expect(finalRes.nextPhase).toBe('HOLD');
    expect(sc.getSpeedStepIndex()).toBe(24);
  });

  it('reduces targetBpm by 10% on failure, drops to 15 BPM on recovery ramp', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false); // At 20 BPM

    // Build up to 50 BPM (100 hits: 20 + 100 * 0.3 = 50)
    for (let i = 0; i < 100; i++) {
      sc.onCorrectHit('SPEED_UP');
    }
    expect(sc.targetBpm).toBeCloseTo(50.0, 1);

    // Trigger failure
    const failRes = sc.onFailure('SPEED_UP');
    expect(failRes.nextPhase).toBe('SPEED_UP');

    // 50 * (1 - 0.10) = 45.0 BPM
    expect(sc.targetBpm).toBeCloseTo(45.0, 1);

    // Start recovery ramp
    sc.startRecoveryRamp();
    expect(sc.actualBpm).toBe(15.0);

    // Ramps to 45.0 over 4 seconds
    sc.tick(4.0, false);
    expect(sc.actualBpm).toBeCloseTo(45.0, 1);
  });

  it('applies dampened penalties for rapid subsequent misses', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false);

    // Build up speed to 50 BPM (100 hits)
    for (let i = 0; i < 100; i++) {
      sc.onCorrectHit('SPEED_UP');
    }
    const bpmBeforeFirstFail = sc.targetBpm; // 50 BPM

    // First miss: full 10% penalty
    sc.onFailure('SPEED_UP');
    const bpmAfterFirstFail = sc.targetBpm;
    expect(bpmAfterFirstFail).toBeCloseTo(bpmBeforeFirstFail * 0.90, 1);

    // Immediate second miss without intervening hits: 2.5% penalty (d = 0.25)
    sc.onFailure('SPEED_UP');
    const bpmAfterSecondFail = sc.targetBpm;
    expect(bpmAfterSecondFail).toBeCloseTo(bpmAfterFirstFail * (1 - 0.10 * 0.25), 1);
  });

  it('throws back to SPEED_UP from HOLD on a mistake, resetting hold count', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false);

    // Progress to HOLD (234 hits)
    for (let i = 0; i < 234; i++) {
      sc.onCorrectHit('SPEED_UP');
    }
    expect(sc.targetBpm).toBe(90.0);

    // Hit 31 correct notes in HOLD
    for (let i = 0; i < 31; i++) {
      const res = sc.onCorrectHit('HOLD');
      expect(res.nextPhase).toBe('HOLD');
      expect(sc.holdNotesRemaining).toBe(32 - (i + 1));
    }
    expect(sc.holdNotesRemaining).toBe(1);

    // Mistake on the 32nd note
    const failRes = sc.onFailure('HOLD');
    expect(failRes.nextPhase).toBe('SPEED_UP');
    // Target speed reduced by 10%: 90 * 0.90 = 81.0
    expect(sc.targetBpm).toBeCloseTo(81.0, 1);
    // Hold count reset to 32
    expect(sc.holdNotesRemaining).toBe(32);
  });

  it('finishes level on 32 consecutive hits in HOLD', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false);
    for (let i = 0; i < 234; i++) {
      sc.onCorrectHit('SPEED_UP');
    }

    for (let i = 0; i < 31; i++) {
      const res = sc.onCorrectHit('HOLD');
      expect(res.nextPhase).toBe('HOLD');
    }

    // 32nd hit finishes level
    const finalRes = sc.onCorrectHit('HOLD');
    expect(finalRes.nextPhase).toBe('LEVEL_COMPLETE');
  });
});
