import { describe, it, expect } from 'vitest';
import {
  createPitch,
  parsePitch,
  createTarget,
  getPitchClass,
  getStaffStepOffset,
  LETTER_INDEX,
  LETTER_SEMITONE,
} from '../../src/music/pitch';

describe('pitch & diatonic math', () => {
  it('correctly exports letter constants', () => {
    expect(LETTER_INDEX.C).toBe(0);
    expect(LETTER_INDEX.B).toBe(6);
    expect(LETTER_SEMITONE.C).toBe(0);
    expect(LETTER_SEMITONE.A).toBe(9);
    expect(LETTER_SEMITONE.B).toBe(11);
  });

  it('calculates correct MIDI numbers and IDs', () => {
    expect(createPitch('C', 0, 4).midi).toBe(60);
    expect(createPitch('C', 0, 4).id).toBe('C4');

    expect(createPitch('C', 0, 2).midi).toBe(36);
    expect(createPitch('A', 0, 4).midi).toBe(69);
    expect(createPitch('C', 0, 6).midi).toBe(84);

    const fSharp4 = createPitch('F', 1, 4);
    expect(fSharp4.midi).toBe(66);
    expect(fSharp4.id).toBe('F#4');

    const bFlat3 = createPitch('B', -1, 3);
    expect(bFlat3.midi).toBe(58);
    expect(bFlat3.id).toBe('Bb3');
  });

  it('preserves enharmonic differences', () => {
    const fSharp4 = createPitch('F', 1, 4);
    const gFlat4 = createPitch('G', -1, 4);

    expect(fSharp4.midi).toBe(gFlat4.midi); // Both 66
    expect(fSharp4.id).toBe('F#4');
    expect(gFlat4.id).toBe('Gb4');
    expect(fSharp4.diatonicStep).not.toBe(gFlat4.diatonicStep);
  });

  it('parses pitch string accurately', () => {
    expect(parsePitch('C4')).toEqual(createPitch('C', 0, 4));
    expect(parsePitch('F#4')).toEqual(createPitch('F', 1, 4));
    expect(parsePitch('Bb3')).toEqual(createPitch('B', -1, 3));
    expect(parsePitch('Eb2')).toEqual(createPitch('E', -1, 2));
    expect(() => parsePitch('H4')).toThrow();
    expect(() => parsePitch('C9')).toThrow();
  });

  it('creates staff note target correctly', () => {
    const target = createTarget('treble', 'C4');
    expect(target.targetId).toBe('treble:C4');
    expect(target.clef).toBe('treble');
    expect(target.pitch.id).toBe('C4');

    const bassTarget = createTarget('bass', 'C4');
    expect(bassTarget.targetId).toBe('bass:C4');
    expect(bassTarget.clef).toBe('bass');
    expect(bassTarget.pitch.id).toBe('C4');
    expect(target.targetId).not.toBe(bassTarget.targetId);
  });

  it('computes pitch class modulo 12', () => {
    expect(getPitchClass(parsePitch('C4'))).toBe(0);
    expect(getPitchClass(parsePitch('C#4'))).toBe(1);
    expect(getPitchClass(parsePitch('Db4'))).toBe(1);
    expect(getPitchClass(parsePitch('F#4'))).toBe(6);
    expect(getPitchClass(parsePitch('Bb3'))).toBe(10);
    expect(getPitchClass(parsePitch('B3'))).toBe(11);
  });

  describe('staffStepOffset', () => {
    it('calculates treble step offsets accurately', () => {
      // E4 is bottom line (0)
      expect(getStaffStepOffset(parsePitch('E4'), 'treble')).toBe(0);
      expect(getStaffStepOffset(parsePitch('F4'), 'treble')).toBe(1);
      expect(getStaffStepOffset(parsePitch('B4'), 'treble')).toBe(4);
      expect(getStaffStepOffset(parsePitch('F5'), 'treble')).toBe(8);
      // Below staff
      expect(getStaffStepOffset(parsePitch('C4'), 'treble')).toBe(-2);
      expect(getStaffStepOffset(parsePitch('A3'), 'treble')).toBe(-4);
      // Above staff
      expect(getStaffStepOffset(parsePitch('A5'), 'treble')).toBe(10);
      expect(getStaffStepOffset(parsePitch('C6'), 'treble')).toBe(12);
    });

    it('calculates bass step offsets accurately', () => {
      // G2 is bottom line (0)
      expect(getStaffStepOffset(parsePitch('G2'), 'bass')).toBe(0);
      expect(getStaffStepOffset(parsePitch('D3'), 'bass')).toBe(4);
      expect(getStaffStepOffset(parsePitch('A3'), 'bass')).toBe(8);
      // Above staff
      expect(getStaffStepOffset(parsePitch('C4'), 'bass')).toBe(10);
      expect(getStaffStepOffset(parsePitch('E4'), 'bass')).toBe(12);
      // Below staff
      expect(getStaffStepOffset(parsePitch('E2'), 'bass')).toBe(-2);
      expect(getStaffStepOffset(parsePitch('C2'), 'bass')).toBe(-4);
    });
  });
});
