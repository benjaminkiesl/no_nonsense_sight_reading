import { describe, it, expect } from 'vitest';
import {
  getAllLevels,
  getLevelById,
  getNextRecommendedLevel,
  getTransitiveCompletedLevels,
} from '../../src/curriculum/graph';

describe('Curriculum Graph & Traversal', () => {
  it('retrieves all levels and individual levels by id', () => {
    const all = getAllLevels();
    expect(all.length).toBe(36);

    const level = getLevelById('treble-5');
    expect(level.id).toBe('treble-5');
    expect(level.tier).toBe(5);
    expect(level.lane).toBe('treble');

    expect(() => getLevelById('non-existent')).toThrow();
  });

  it('contains valid directed edges across tiers and into both lane', () => {
    // Check tier 1
    const t1 = getLevelById('treble-1');
    expect(t1.prerequisiteIds).toEqual([]);
    expect(t1.nextIds).toContain('treble-2');
    expect(t1.nextIds).toContain('both-1');

    const b1 = getLevelById('bass-1');
    expect(b1.prerequisiteIds).toEqual([]);
    expect(b1.nextIds).toContain('bass-2');
    expect(b1.nextIds).toContain('both-1');

    const m1 = getLevelById('both-1');
    expect(m1.prerequisiteIds).toContain('treble-1');
    expect(m1.prerequisiteIds).toContain('bass-1');
    expect(m1.nextIds).toEqual(['both-2']);

    // Check tier 2
    const m2 = getLevelById('both-2');
    expect(m2.prerequisiteIds).toContain('treble-2');
    expect(m2.prerequisiteIds).toContain('bass-2');
    expect(m2.prerequisiteIds).toContain('both-1');
  });

  describe('getTransitiveCompletedLevels', () => {
    it('returns empty set if empty input', () => {
      expect(getTransitiveCompletedLevels([])).toEqual(new Set());
    });

    it('marks single-clef ancestors when a single clef level is completed', () => {
      const completed = getTransitiveCompletedLevels(['treble-3']);
      expect(completed.has('treble-3')).toBe(true);
      expect(completed.has('treble-2')).toBe(true);
      expect(completed.has('treble-1')).toBe(true);
      expect(completed.has('treble-4')).toBe(false);
      expect(completed.has('bass-1')).toBe(false);
      expect(completed.has('both-1')).toBe(false);
    });

    it('marks all treble, bass, and both ancestors when a both level is completed', () => {
      const completed = getTransitiveCompletedLevels(['both-3']);
      // Both ancestors
      expect(completed.has('both-3')).toBe(true);
      expect(completed.has('both-2')).toBe(true);
      expect(completed.has('both-1')).toBe(true);

      // Treble ancestors
      expect(completed.has('treble-3')).toBe(true);
      expect(completed.has('treble-2')).toBe(true);
      expect(completed.has('treble-1')).toBe(true);

      // Bass ancestors
      expect(completed.has('bass-3')).toBe(true);
      expect(completed.has('bass-2')).toBe(true);
      expect(completed.has('bass-1')).toBe(true);

      // Higher tiers should not be marked
      expect(completed.has('both-4')).toBe(false);
      expect(completed.has('treble-4')).toBe(false);
      expect(completed.has('bass-4')).toBe(false);
    });

    it('isolates wing branches in transitive completion closure', () => {
      // Completed Flat Wing Tier 10
      const flatCompleted = getTransitiveCompletedLevels(['both-10']);
      expect(flatCompleted.has('both-10')).toBe(true);
      expect(flatCompleted.has('treble-10')).toBe(true);
      expect(flatCompleted.has('bass-10')).toBe(true);
      expect(flatCompleted.has('both-8')).toBe(true);
      expect(flatCompleted.has('treble-8')).toBe(true);
      expect(flatCompleted.has('bass-8')).toBe(true);

      // Sharp wing levels must NOT be marked
      expect(flatCompleted.has('both-9')).toBe(false);
      expect(flatCompleted.has('treble-9')).toBe(false);
      expect(flatCompleted.has('bass-9')).toBe(false);
      expect(flatCompleted.has('both-11')).toBe(false);

      // Completed Sharp Wing Tier 11
      const sharpCompleted = getTransitiveCompletedLevels(['both-11']);
      expect(sharpCompleted.has('both-11')).toBe(true);
      expect(sharpCompleted.has('treble-11')).toBe(true);
      expect(sharpCompleted.has('both-9')).toBe(true);
      expect(sharpCompleted.has('both-8')).toBe(true);

      // Flat wing levels must NOT be marked
      expect(sharpCompleted.has('both-10')).toBe(false);
      expect(sharpCompleted.has('treble-10')).toBe(false);
      expect(sharpCompleted.has('both-12')).toBe(false);
    });
  });

  describe('getNextRecommendedLevel', () => {
    it('recommends bass-k when treble-k is finished and bass-k is not yet finished', () => {
      const finished = new Set(['treble-1']);
      expect(getNextRecommendedLevel('treble-1', finished)).toBe('bass-1');
    });

    it('recommends both-k when treble-k is finished and bass-k is already finished', () => {
      const finished = new Set(['treble-1', 'bass-1']);
      expect(getNextRecommendedLevel('treble-1', finished)).toBe('both-1');
    });

    it('recommends both-k when bass-k is finished and treble-k is already finished', () => {
      const finished = new Set(['treble-2', 'bass-2']);
      expect(getNextRecommendedLevel('bass-2', finished)).toBe('both-2');
    });

    it('recommends treble-k when bass-k is finished but treble-k is not yet finished', () => {
      const finished = new Set(['bass-2']);
      expect(getNextRecommendedLevel('bass-2', finished)).toBe('treble-2');
    });

    it('recommends treble-(k+1) when both-k is finished in central trunk', () => {
      const finished = new Set(['both-1', 'treble-1', 'bass-1']);
      expect(getNextRecommendedLevel('both-1', finished)).toBe('treble-2');
    });

    it('recommends Sharp wing (treble-9) when both-8 is finished, or Flat wing if Sharp wing is done', () => {
      const finished8 = new Set(['both-8']);
      expect(getNextRecommendedLevel('both-8', finished8)).toBe('treble-9');

      const finished8And9 = new Set(['both-8', 'both-9']);
      expect(getNextRecommendedLevel('both-8', finished8And9)).toBe('treble-10');
    });

    it('recommends treble-11 when both-9 is finished, and treble-12 when both-10 is finished', () => {
      expect(getNextRecommendedLevel('both-9', new Set(['both-9']))).toBe('treble-11');
      expect(getNextRecommendedLevel('both-10', new Set(['both-10']))).toBe('treble-12');
    });

    it('recommends uncompleted Flat wing when both-11 is finished', () => {
      expect(getNextRecommendedLevel('both-11', new Set(['both-11']))).toBe('treble-10');
      expect(getNextRecommendedLevel('both-11', new Set(['both-11', 'both-12']))).toBe('both-11');
    });

    it('remains on both-12 when both-12 is finished', () => {
      const finished = new Set(['both-12']);
      expect(getNextRecommendedLevel('both-12', finished)).toBe('both-12');
    });
  });
});
