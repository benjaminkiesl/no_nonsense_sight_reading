import { describe, it, expect } from 'vitest';
import { getLedgerLines, getStemDirection } from '../../src/music/notation';
import { KEY_SIGNATURES } from '../../src/music/scales';

describe('notation math', () => {
  describe('getLedgerLines', () => {
    it('returns empty array for pitches inside the 5 staff lines or adjacent spaces', () => {
      expect(getLedgerLines(0)).toEqual([]); // Bottom line
      expect(getLedgerLines(4)).toEqual([]); // Middle line
      expect(getLedgerLines(8)).toEqual([]); // Top line
      expect(getLedgerLines(-1)).toEqual([]); // Space directly below staff
      expect(getLedgerLines(9)).toEqual([]);  // Space directly above staff
    });

    it('returns ledger lines below staff (stepOffset <= -2)', () => {
      expect(getLedgerLines(-2)).toEqual([-2]);
      expect(getLedgerLines(-3)).toEqual([-2]);
      expect(getLedgerLines(-4)).toEqual([-2, -4]);
      expect(getLedgerLines(-5)).toEqual([-2, -4]);
      expect(getLedgerLines(-6)).toEqual([-2, -4, -6]);
    });

    it('returns ledger lines above staff (stepOffset >= 10)', () => {
      expect(getLedgerLines(10)).toEqual([10]);
      expect(getLedgerLines(11)).toEqual([10]);
      expect(getLedgerLines(12)).toEqual([10, 12]);
      expect(getLedgerLines(13)).toEqual([10, 12]);
      expect(getLedgerLines(14)).toEqual([10, 12, 14]);
    });
  });

  describe('getStemDirection', () => {
    it('returns "up" for notes strictly below the middle line (stepOffset < 4)', () => {
      expect(getStemDirection(-4)).toBe('up');
      expect(getStemDirection(0)).toBe('up');
      expect(getStemDirection(3)).toBe('up');
    });

    it('returns "down" for notes on or above the middle line (stepOffset >= 4)', () => {
      expect(getStemDirection(4)).toBe('down');
      expect(getStemDirection(5)).toBe('down');
      expect(getStemDirection(8)).toBe('down');
      expect(getStemDirection(12)).toBe('down');
    });
  });

  describe('KEY_SIGNATURES', () => {
    it('defines C major as natural', () => {
      expect(KEY_SIGNATURES.C_MAJOR.accidentalType).toBe('none');
      expect(KEY_SIGNATURES.C_MAJOR.trebleStepOffsets).toEqual([]);
      expect(KEY_SIGNATURES.C_MAJOR.bassStepOffsets).toEqual([]);
      expect(KEY_SIGNATURES.C_MAJOR.alteredLetters).toEqual({});
    });

    it('defines G major with F#', () => {
      expect(KEY_SIGNATURES.G_MAJOR.accidentalType).toBe('sharp');
      expect(KEY_SIGNATURES.G_MAJOR.trebleStepOffsets).toEqual([8]);
      expect(KEY_SIGNATURES.G_MAJOR.bassStepOffsets).toEqual([6]);
      expect(KEY_SIGNATURES.G_MAJOR.alteredLetters).toEqual({ F: 1 });
    });

    it('defines D major with F# and C#', () => {
      expect(KEY_SIGNATURES.D_MAJOR.accidentalType).toBe('sharp');
      expect(KEY_SIGNATURES.D_MAJOR.trebleStepOffsets).toEqual([8, 5]);
      expect(KEY_SIGNATURES.D_MAJOR.bassStepOffsets).toEqual([6, 3]);
      expect(KEY_SIGNATURES.D_MAJOR.alteredLetters).toEqual({ F: 1, C: 1 });
    });

    it('defines F major with Bb', () => {
      expect(KEY_SIGNATURES.F_MAJOR.accidentalType).toBe('flat');
      expect(KEY_SIGNATURES.F_MAJOR.trebleStepOffsets).toEqual([4]);
      expect(KEY_SIGNATURES.F_MAJOR.bassStepOffsets).toEqual([2]);
      expect(KEY_SIGNATURES.F_MAJOR.alteredLetters).toEqual({ B: -1 });
    });

    it('defines Bb major with Bb and Eb', () => {
      expect(KEY_SIGNATURES.BB_MAJOR.accidentalType).toBe('flat');
      expect(KEY_SIGNATURES.BB_MAJOR.trebleStepOffsets).toEqual([4, 7]);
      expect(KEY_SIGNATURES.BB_MAJOR.bassStepOffsets).toEqual([2, 5]);
      expect(KEY_SIGNATURES.BB_MAJOR.alteredLetters).toEqual({ B: -1, E: -1 });
    });
  });
});
