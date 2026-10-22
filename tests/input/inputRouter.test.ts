import { describe, it, expect } from 'vitest';
import { matchesTarget, resolveVisualPianoMidi } from '../../src/input/inputRouter';
import { createTarget } from '../../src/music/pitch';
import { ExactNoteInput, PitchClassInput } from '../../src/types/input';

describe('inputRouter', () => {
  describe('matchesTarget', () => {
    it('requires exact MIDI note match for MIDI and piano click inputs', () => {
      const targetC4 = createTarget('treble', 'C4'); // midi 60
      const exactC4: ExactNoteInput = { source: 'midi', midi: 60 };
      const wrongOctaveC5: ExactNoteInput = { source: 'midi', midi: 72 };
      const wrongPitchD4: ExactNoteInput = { source: 'piano_click', midi: 62 };

      expect(matchesTarget(exactC4, targetC4)).toBe(true);
      expect(matchesTarget(wrongOctaveC5, targetC4)).toBe(false);
      expect(matchesTarget(wrongPitchD4, targetC4)).toBe(false);
    });

    it('auto-adapts octaves for computer keyboard inputs', () => {
      const targetC5 = createTarget('treble', 'C5'); // midi 72, pitchClass 0
      const targetC2 = createTarget('bass', 'C2');   // midi 36, pitchClass 0
      const targetD4 = createTarget('treble', 'D4'); // midi 62, pitchClass 2

      const keyInputC: PitchClassInput = {
        source: 'computer_keyboard',
        letter: 'C',
        accidental: 0,
        pitchClass: 0,
      };

      // Key 'c' matches any octave of C
      expect(matchesTarget(keyInputC, targetC5)).toBe(true);
      expect(matchesTarget(keyInputC, targetC2)).toBe(true);
      expect(matchesTarget(keyInputC, targetD4)).toBe(false);

      // Key 'Shift+f' (F#) matches F#4
      const targetFSharp4 = createTarget('treble', 'F#4');
      const keyInputFSharp: PitchClassInput = {
        source: 'computer_keyboard',
        letter: 'F',
        accidental: 1,
        pitchClass: 6,
      };
      expect(matchesTarget(keyInputFSharp, targetFSharp4)).toBe(true);
      expect(matchesTarget(keyInputFSharp, createTarget('treble', 'F4'))).toBe(false);
    });
  });

  describe('resolveVisualPianoMidi', () => {
    it('returns exact MIDI number for MIDI and piano click', () => {
      expect(resolveVisualPianoMidi({ source: 'midi', midi: 64 }, null)).toBe(64);
      expect(resolveVisualPianoMidi({ source: 'piano_click', midi: 48 }, null)).toBe(48);
    });

    it('resolves computer keyboard input to reference target octave', () => {
      const keyInputC: PitchClassInput = {
        source: 'computer_keyboard',
        letter: 'C',
        accidental: 0,
        pitchClass: 0,
      };

      // Reference note in octave 5 -> lights up C5 (midi 72)
      const refC5 = createTarget('treble', 'C5');
      expect(resolveVisualPianoMidi(keyInputC, refC5)).toBe(72);

      // Reference note in octave 2 -> lights up C2 (midi 36)
      const refG2 = createTarget('bass', 'G2');
      expect(resolveVisualPianoMidi(keyInputC, refG2)).toBe(36);

      // No reference note -> defaults to octave 4 (midi 60)
      expect(resolveVisualPianoMidi(keyInputC, null)).toBe(60);
    });
  });
});
