import { describe, it, expect } from 'vitest';
import { SpeedController } from '../../src/engine/speed';

describe('SpeedController physics & transitions', () => {
  it('starts at 40 BPM actual and ramps to 60 BPM target over 4.0 seconds', () => {
    const sc = new SpeedController();
    expect(sc.actualBpm).toBe(40.0);
    expect(sc.targetBpm).toBe(60.0);
    expect(sc.getSpeedStepIndex()).toBe(0);

    // Halfway through ramp (2.0s)
    sc.tick(2.0, false);
    expect(sc.actualBpm).toBeCloseTo(50.0, 1);
    expect(sc.targetBpm).toBe(60.0);

    // End of ramp (another 2.0s)
    sc.tick(2.0, false);
    expect(sc.actualBpm).toBe(60.0);
    expect(sc.targetBpm).toBe(60.0);
  });

  it('increases targetBpm by 1.25 on each correct hit, reaching 90 BPM after 24 hits', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false); // Finish initial ramp to 60 BPM

    for (let i = 1; i <= 23; i++) {
      const res = sc.onCorrectHit('SPEED_UP');
      expect(res.nextPhase).toBe('SPEED_UP');
      expect(sc.targetBpm).toBeCloseTo(60 + i * 1.25, 2);
    }

    // 24th hit reaches 90 BPM and enters HOLD
    const finalRes = sc.onCorrectHit('SPEED_UP');
    expect(sc.targetBpm).toBe(90.0);
    expect(sc.actualBpm).toBe(90.0);
    expect(finalRes.nextPhase).toBe('HOLD');
    expect(sc.getSpeedStepIndex()).toBe(24);
  });

  it('reduces targetBpm by 8% on failure, drops to 40 BPM on recovery ramp', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false); // At 60 BPM

    // Build up to 80 BPM (16 hits)
    for (let i = 0; i < 16; i++) {
      sc.onCorrectHit('SPEED_UP');
    }
    expect(sc.targetBpm).toBe(80.0);

    // Trigger failure
    const failRes = sc.onFailure('SPEED_UP');
    expect(failRes.nextPhase).toBe('SPEED_UP');

    // 80 * (1 - 0.08) = 73.6 BPM
    expect(sc.targetBpm).toBeCloseTo(73.6, 1);

    // Start recovery ramp
    sc.startRecoveryRamp();
    expect(sc.actualBpm).toBe(40.0);

    // Ramps to 73.6 over 4 seconds
    sc.tick(4.0, false);
    expect(sc.actualBpm).toBeCloseTo(73.6, 1);
  });

  it('applies dampened penalties for rapid subsequent misses', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false);

    // Build up speed
    for (let i = 0; i < 20; i++) {
      sc.onCorrectHit('SPEED_UP');
    }
    const bpmBeforeFirstFail = sc.targetBpm; // 85 BPM

    // First miss: full 8% penalty
    sc.onFailure('SPEED_UP');
    const bpmAfterFirstFail = sc.targetBpm;
    expect(bpmAfterFirstFail).toBeCloseTo(bpmBeforeFirstFail * 0.92, 1);

    // Immediate second miss without any intervening hits: 2% penalty (d = 0.25)
    sc.onFailure('SPEED_UP');
    const bpmAfterSecondFail = sc.targetBpm;
    expect(bpmAfterSecondFail).toBeCloseTo(bpmAfterFirstFail * (1 - 0.08 * 0.25), 1);
  });

  it('throws back to SPEED_UP from HOLD on a mistake, resetting hold count', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false);

    // Progress to HOLD
    for (let i = 0; i < 24; i++) {
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

    // Mistake on the 32nd note!
    const failRes = sc.onFailure('HOLD');
    expect(failRes.nextPhase).toBe('SPEED_UP');
    // Target speed reduced by 8%: 90 * 0.92 = 82.8
    expect(sc.targetBpm).toBeCloseTo(82.8, 1);
    // Hold count reset to 32
    expect(sc.holdNotesRemaining).toBe(32);
  });

  it('finishes level on 32 consecutive hits in HOLD', () => {
    const sc = new SpeedController();
    sc.tick(4.0, false);
    for (let i = 0; i < 24; i++) {
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
