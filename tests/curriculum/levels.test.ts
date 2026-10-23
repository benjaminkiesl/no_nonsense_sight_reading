import { describe, it, expect } from 'vitest';
import { ALL_LEVELS, LEVELS_BY_ID } from '../../src/curriculum/levels';

describe('Curriculum Levels Definition', () => {
  it('creates exactly 36 levels (12 tiers x 3 lanes)', () => {
    expect(ALL_LEVELS.length).toBe(36);
    expect(LEVELS_BY_ID.size).toBe(36);
  });

  it('configures Tier 1 with 3 notes per single clef', () => {
    const treble1 = LEVELS_BY_ID.get('treble-1')!;
    expect(treble1.allNotes.length).toBe(3);
    expect(treble1.newNotes.length).toBe(3);
    expect(treble1.allNotes.map((n) => n.pitch.id)).toEqual(['C4', 'D4', 'E4']);
    expect(treble1.reviewNotes).toEqual([]);

    const bass1 = LEVELS_BY_ID.get('bass-1')!;
    expect(bass1.allNotes.length).toBe(3);
    expect(bass1.newNotes.length).toBe(3);
    expect(bass1.allNotes.map((n) => n.pitch.id)).toEqual(['C3', 'D3', 'E3']);
    expect(bass1.reviewNotes).toEqual([]);

    const both1 = LEVELS_BY_ID.get('both-1')!;
    expect(both1.allNotes.length).toBe(6);
    expect(both1.newNotes.length).toBe(6);
  });

  it('adds exactly 2 new notes per level in Tiers 2 to 8 for single clefs', () => {
    for (let tier = 2; tier <= 8; tier++) {
      const treble = LEVELS_BY_ID.get(`treble-${tier}`)!;
      const bass = LEVELS_BY_ID.get(`bass-${tier}`)!;

      expect(treble.newNotes.length).toBe(2);
      expect(bass.newNotes.length).toBe(2);

      // Total notes should be previous tier's total + 2
      const prevTreble = LEVELS_BY_ID.get(`treble-${tier - 1}`)!;
      const prevBass = LEVELS_BY_ID.get(`bass-${tier - 1}`)!;

      expect(treble.allNotes.length).toBe(prevTreble.allNotes.length + 2);
      expect(bass.allNotes.length).toBe(prevBass.allNotes.length + 2);
    }
  });

  it('satisfies the both-k union invariant across all tiers', () => {
    for (let tier = 1; tier <= 12; tier++) {
      const treble = LEVELS_BY_ID.get(`treble-${tier}`)!;
      const bass = LEVELS_BY_ID.get(`bass-${tier}`)!;
      const both = LEVELS_BY_ID.get(`both-${tier}`)!;

      expect(both.allNotes.length).toBe(treble.allNotes.length + bass.allNotes.length);
      expect(both.newNotes.length).toBe(treble.newNotes.length + bass.newNotes.length);

      const expectedTargetIds = new Set([
        ...treble.allNotes.map((n) => n.targetId),
        ...bass.allNotes.map((n) => n.targetId),
      ]);
      const actualTargetIds = new Set(both.allNotes.map((n) => n.targetId));
      expect(actualTargetIds).toEqual(expectedTargetIds);
    }
  });

  it('replaces accidentals correctly in Scale Tiers 9 to 12', () => {
    // Tier 9: G Major (F#)
    const t9 = LEVELS_BY_ID.get('treble-9')!;
    expect(t9.keySignature).toBe('G_MAJOR');
    expect(t9.newNotes.map((n) => n.pitch.id)).toEqual(['F#4', 'F#5']);
    expect(t9.allNotes.some((n) => n.pitch.letter === 'F' && n.pitch.accidental === 0)).toBe(false);

    // Tier 10: F Major (Bb)
    const t10 = LEVELS_BY_ID.get('treble-10')!;
    expect(t10.keySignature).toBe('F_MAJOR');
    expect(t10.newNotes.map((n) => n.pitch.id)).toEqual(['Bb3', 'Bb4', 'Bb5']);
    expect(t10.allNotes.some((n) => n.pitch.letter === 'B' && n.pitch.accidental === 0)).toBe(false);

    // Tier 11: D Major (F#, C#)
    const t11 = LEVELS_BY_ID.get('treble-11')!;
    expect(t11.keySignature).toBe('D_MAJOR');
    expect(t11.newNotes.map((n) => n.pitch.id)).toEqual(['C#4', 'C#5', 'C#6']);
    expect(t11.allNotes.some((n) => n.pitch.letter === 'C' && n.pitch.accidental === 0)).toBe(false);
    expect(t11.allNotes.some((n) => n.pitch.letter === 'F' && n.pitch.accidental === 1)).toBe(true);

    // Tier 12: Bb Major (Bb, Eb)
    const t12 = LEVELS_BY_ID.get('treble-12')!;
    expect(t12.keySignature).toBe('BB_MAJOR');
    expect(t12.newNotes.map((n) => n.pitch.id)).toEqual(['Eb4', 'Eb5']);
    expect(t12.allNotes.some((n) => n.pitch.letter === 'E' && n.pitch.accidental === 0)).toBe(false);
    expect(t12.allNotes.some((n) => n.pitch.letter === 'B' && n.pitch.accidental === -1)).toBe(true);
  });

  it('correctly provides displayInterval', () => {
    const t1 = LEVELS_BY_ID.get('treble-1')!;
    expect(t1.displayInterval.treble?.[0].pitch.id).toBe('C4');
    expect(t1.displayInterval.treble?.[1].pitch.id).toBe('E4');
    expect(t1.displayInterval.bass).toBeUndefined();

    const m1 = LEVELS_BY_ID.get('both-1')!;
    expect(m1.displayInterval.treble?.[0].pitch.id).toBe('C4');
    expect(m1.displayInterval.treble?.[1].pitch.id).toBe('E4');
    expect(m1.displayInterval.bass?.[0].pitch.id).toBe('C3');
    expect(m1.displayInterval.bass?.[1].pitch.id).toBe('E3');
  });

  it('correctly populates reviewNotes from previous two tiers', () => {
    const t1 = LEVELS_BY_ID.get('treble-1')!;
    expect(t1.reviewNotes).toEqual([]);

    const t2 = LEVELS_BY_ID.get('treble-2')!;
    expect(t2.reviewNotes.map((n) => n.pitch.id)).toEqual(['C4', 'D4', 'E4']);

    const t3 = LEVELS_BY_ID.get('treble-3')!;
    // From tier 2 (F4, G4) and tier 1 (C4, D4, E4)
    const t3ReviewIds = t3.reviewNotes.map((n) => n.pitch.id);
    expect(t3ReviewIds).toContain('F4');
    expect(t3ReviewIds).toContain('G4');
    expect(t3ReviewIds).toContain('C4');
  });

  it('correctly sets two-wing scale prerequisites and next chains above Tier 8', () => {
    // Tier 8 branches into both wings (Tier 9 and Tier 10)
    const t8 = LEVELS_BY_ID.get('treble-8')!;
    expect(t8.nextIds).toContain('treble-9');
    expect(t8.nextIds).toContain('treble-10');
    expect(t8.nextIds).toContain('both-8');

    const b8 = LEVELS_BY_ID.get('bass-8')!;
    expect(b8.nextIds).toContain('bass-9');
    expect(b8.nextIds).toContain('bass-10');
    expect(b8.nextIds).toContain('both-8');

    const m8 = LEVELS_BY_ID.get('both-8')!;
    expect(m8.nextIds).toEqual(['both-9', 'both-10']);

    // Flat Wing: Tier 10 (F Major) depends on Tier 8, and branches into Tier 12
    const t10 = LEVELS_BY_ID.get('treble-10')!;
    expect(t10.prerequisiteIds).toEqual(['treble-8']);
    expect(t10.nextIds).toEqual(['both-10', 'treble-12']);

    const b10 = LEVELS_BY_ID.get('bass-10')!;
    expect(b10.prerequisiteIds).toEqual(['bass-8']);
    expect(b10.nextIds).toEqual(['both-10', 'bass-12']);

    const m10 = LEVELS_BY_ID.get('both-10')!;
    expect(m10.prerequisiteIds).toContain('treble-10');
    expect(m10.prerequisiteIds).toContain('bass-10');
    expect(m10.prerequisiteIds).toContain('both-8');
    expect(m10.nextIds).toEqual(['both-12']);

    // Flat Wing: Tier 12 (Bb Major) depends on Tier 10
    const t12 = LEVELS_BY_ID.get('treble-12')!;
    expect(t12.prerequisiteIds).toEqual(['treble-10']);
    expect(t12.nextIds).toEqual(['both-12']);

    const m12 = LEVELS_BY_ID.get('both-12')!;
    expect(m12.prerequisiteIds).toContain('both-10');
    expect(m12.nextIds).toEqual([]);

    // Sharp Wing: Tier 9 (G Major) depends on Tier 8, and branches into Tier 11
    const t9 = LEVELS_BY_ID.get('treble-9')!;
    expect(t9.prerequisiteIds).toEqual(['treble-8']);
    expect(t9.nextIds).toEqual(['both-9', 'treble-11']);

    const m9 = LEVELS_BY_ID.get('both-9')!;
    expect(m9.prerequisiteIds).toContain('both-8');
    expect(m9.nextIds).toEqual(['both-11']);

    // Sharp Wing: Tier 11 (D Major) depends on Tier 9
    const t11 = LEVELS_BY_ID.get('treble-11')!;
    expect(t11.prerequisiteIds).toEqual(['treble-9']);
    expect(t11.nextIds).toEqual(['both-11']);

    const m11 = LEVELS_BY_ID.get('both-11')!;
    expect(m11.prerequisiteIds).toContain('both-9');
    expect(m11.nextIds).toEqual([]);
  });
});
