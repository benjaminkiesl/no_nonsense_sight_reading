import { describe, it, expect } from 'vitest';
import { SpeedController } from '../../src/engine/speed';
import { SightReadingEngine } from '../../src/engine/engine';
import { getLevelById } from '../../src/curriculum/graph';
import { createTarget } from '../../src/music/pitch';

describe('Accelerando Perpetuo Engine & SpeedController', () => {
  describe('SpeedController in Accelerando Mode', () => {
    it('initializes at starting tempo and caps at 240 BPM', () => {
      const sc = new SpeedController({ mode: 'accelerando', startingBpm: 50 });
      expect(sc.isAccelerando).toBe(true);
      expect(sc.targetBpm).toBe(50);
      expect(sc.actualBpm).toBe(50);
      expect(sc.maxBpm).toBe(240);
    });

    it('accelerates by +0.2 BPM per correct hit and stays in SPEED_UP indefinitely', () => {
      const sc = new SpeedController({ mode: 'accelerando', startingBpm: 238 });
      for (let i = 1; i <= 9; i++) {
        const res = sc.onCorrectHit('SPEED_UP');
        expect(res.nextPhase).toBe('SPEED_UP');
        expect(sc.targetBpm).toBeCloseTo(238 + i * 0.2, 2);
      }

      // Reaching 240 BPM cap
      const hit10 = sc.onCorrectHit('SPEED_UP');
      expect(hit10.nextPhase).toBe('SPEED_UP');
      expect(sc.targetBpm).toBe(240);

      // Extra hit remains capped at 240 BPM
      const hit11 = sc.onCorrectHit('SPEED_UP');
      expect(hit11.nextPhase).toBe('SPEED_UP');
      expect(sc.targetBpm).toBe(240);
    });

    it('implements standard failure mechanics (8% slowdown, cooldown dampening, 4s ramp from 15 BPM)', () => {
      const sc = new SpeedController({ mode: 'accelerando', startingBpm: 100 });
      // Build up consecutive hits
      for (let i = 0; i < 10; i++) {
        sc.onCorrectHit('SPEED_UP');
      }
      expect(sc.targetBpm).toBeCloseTo(102, 1);

      // Miss 1: full 8% penalty
      const fail1 = sc.onFailure('SPEED_UP');
      expect(fail1.nextPhase).toBe('SPEED_UP');
      // 102 * 0.92 = 93.84
      expect(sc.targetBpm).toBeCloseTo(93.84, 1);

      // Recovery ramp drops actual to 15 BPM and ramps to 93.84 over 4s
      sc.startRecoveryRamp();
      expect(sc.actualBpm).toBe(15.0);
      sc.tick(2.0, false);
      expect(sc.actualBpm).toBeCloseTo(15.0 + (93.84 - 15.0) * 0.5, 1);
      sc.tick(2.0, false);
      expect(sc.actualBpm).toBeCloseTo(93.84, 1);

      // Subsequent immediate miss without intervening hits: dampened penalty (d = 0.25 => 2% penalty)
      sc.onFailure('SPEED_UP');
      expect(sc.targetBpm).toBeCloseTo(93.84 * (1 - 0.08 * 0.25), 1);
    });
  });

  describe('SightReadingEngine in Accelerando Mode', () => {
    it('skips learn session and initializes with countdown and custom notes', () => {
      const level = getLevelById('treble-1');
      const customNotes = [createTarget('treble', 'C4'), createTarget('treble', 'G4')];
      const engine = new SightReadingEngine(level, Math.random, {
        mode: 'accelerando',
        accelerandoStartingBpm: 60,
        customNotes,
      });

      const snap = engine.getSnapshot();
      expect(snap.isAccelerando).toBe(true);
      expect(snap.accelerandoStartBpm).toBe(60);
      expect(snap.phase).toBe('COUNTDOWN');
      expect(snap.targetBpm).toBe(60);
      expect(snap.actualBpm).toBe(60);

      // After countdown expires (3s), phase transitions to SPEED_UP
      engine.tick(3000);
      const activeSnap = engine.getSnapshot();
      expect(activeSnap.phase).toBe('SPEED_UP');
    });
  });
});
