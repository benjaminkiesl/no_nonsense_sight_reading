import { describe, it, expect } from 'vitest';
import { AdaptiveDistribution } from '../../src/engine/distribution';
import { createTarget } from '../../src/music/pitch';

// Deterministic 32-bit PRNG
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('AdaptiveDistribution', () => {
  it('weights new notes 2.5x more heavily than old notes at baseline', () => {
    const old1 = createTarget('treble', 'C4');
    const old2 = createTarget('treble', 'D4');
    const newNote = createTarget('treble', 'E4');

    const dist = new AdaptiveDistribution([old1, old2, newNote], [newNote]);
    const probs = dist.getProbabilities();

    const pOld = probs.get('treble:C4')!;
    const pNew = probs.get('treble:E4')!;

    // Baseline: old = 1.0, new = 2.5. Ratio should be 2.5
    expect(pNew / pOld).toBeCloseTo(2.5, 2);
  });

  it('boosts failure note and predecessor, including Markov bigram boost', () => {
    const noteX = createTarget('treble', 'F4');
    const noteY = createTarget('treble', 'G4');
    const noteZ = createTarget('treble', 'A4');

    const dist = new AdaptiveDistribution([noteX, noteY, noteZ], []);

    const pXBefore = dist.getProbabilities().get('treble:F4')!;

    // Record failure of X preceded by Y
    dist.recordFailure(noteX, noteY);

    const probsAfter = dist.getProbabilities();
    const pXAfter = probsAfter.get('treble:F4')!;
    const pYAfter = probsAfter.get('treble:G4')!;

    expect(pXAfter).toBeGreaterThan(pXBefore);
    // Predecessor note Y is boosted significantly over unaffected note Z
    const pZAfter = probsAfter.get('treble:A4')!;
    expect(pYAfter / pZAfter).toBeGreaterThan(2.5);
  });

  it('decays boosted urgency back towards baseline over consecutive spawns and correct hits', () => {
    const noteX = createTarget('treble', 'F4');
    const noteY = createTarget('treble', 'G4');

    const rng = mulberry32(12345);
    const dist = new AdaptiveDistribution([noteX, noteY], [], rng);

    // Initial equal probabilities
    expect(dist.getProbabilities().get('treble:F4')).toBeCloseTo(0.5, 2);

    // Fail X heavily
    dist.recordFailure(noteX);
    expect(dist.getProbabilities().get('treble:F4')).toBeGreaterThan(0.7);

    // Hit correctly once (active decay)
    dist.recordCorrectHit(noteX);

    // Spawn 35 notes to allow exponential decay (0.92^35 < 0.05)
    for (let i = 0; i < 35; i++) {
      dist.sampleNextNote();
    }

    // Should have decayed back to near 0.5 (or baseline ratio)
    const pXAfter = dist.getProbabilities().get('treble:F4')!;
    expect(pXAfter).toBeLessThan(0.65);
  });
});
