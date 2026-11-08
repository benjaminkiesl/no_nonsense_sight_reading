import { describe, expect, it } from 'vitest';
import {
  CHORD_LIBRARY,
  convertToGermanNotation,
  convertToInternationalNotation,
  formatChordLabel,
  getChordDefinition,
  toPitchClass,
  validateChordMidis,
} from '../../src/chord/chords';
import {
  CHORD_LEVELS,
  CHORD_LEVELS_BY_ID,
  getChordLevelById,
  getNextMarkovChord,
  isChordLevelId,
} from '../../src/chord/curriculum';

describe('Chord Symbols Mode - Curriculum & Data Structures', () => {
  describe('12-Tier Curriculum Specifications', () => {
    it('defines exactly 12 chord levels (chord-1 through chord-12)', () => {
      expect(CHORD_LEVELS.length).toBe(12);
      expect(CHORD_LEVELS_BY_ID.size).toBe(12);

      const expectedIds = Array.from({ length: 12 }, (_, i) => `chord-${i + 1}`);
      expect(CHORD_LEVELS.map((lvl) => lvl.id)).toEqual(expectedIds);
    });

    it('identifies chord level IDs correctly with isChordLevelId', () => {
      expect(isChordLevelId('chord-1')).toBe(true);
      expect(isChordLevelId('chord-12')).toBe(true);
      expect(isChordLevelId('treble-1')).toBe(false);
      expect(isChordLevelId('bass-5')).toBe(false);
      expect(isChordLevelId('rhythm-3')).toBe(false);
      expect(isChordLevelId('random-id')).toBe(false);
    });

    it('retrieves chord levels by ID or throws if not found', () => {
      const level1 = getChordLevelById('chord-1');
      expect(level1.tier).toBe(1);
      expect(level1.title).toBe('The Tonic Anchor');

      expect(() => getChordLevelById('non-existent')).toThrow(
        /Chord level with ID "non-existent" not found/
      );
    });

    it('maintains strict linear prerequisite chain across all 12 tiers', () => {
      for (let tier = 1; tier <= 12; tier++) {
        const level = getChordLevelById(`chord-${tier}`);
        expect(level.tier).toBe(tier);
        expect(level.title.length).toBeGreaterThan(0);
        expect(level.subtitle.length).toBeGreaterThan(0);
        expect(level.targetBpm).toBeGreaterThanOrEqual(40);
        expect(level.targetBpm).toBeLessThanOrEqual(100);

        if (tier === 1) {
          expect(level.prerequisiteIds).toEqual([]);
          expect(level.nextIds).toEqual(['chord-2']);
        } else if (tier === 12) {
          expect(level.prerequisiteIds).toEqual(['chord-11']);
          expect(level.nextIds).toEqual([]);
        } else {
          expect(level.prerequisiteIds).toEqual([`chord-${tier - 1}`]);
          expect(level.nextIds).toEqual([`chord-${tier + 1}`]);
        }
      }
    });

    it('matches target chords and pedagogical goals per tier', () => {
      // Tier 1: C, F/C
      const chord1 = getChordLevelById('chord-1');
      expect(chord1.targetChords.map((c) => c.id)).toEqual(['C', 'F/C']);
      expect(chord1.newChords.map((c) => c.id)).toEqual(['C', 'F/C']);
      expect(chord1.reviewChords).toEqual([]);

      // Tier 2: Introduces G/B, G7/B
      const chord2 = getChordLevelById('chord-2');
      expect(chord2.newChords.map((c) => c.id)).toEqual(['G/B', 'G7/B']);
      expect(chord2.targetChords.map((c) => c.id)).toEqual(['C', 'F/C', 'G/B', 'G7/B']);

      // Tier 4: Volkslieder singing key (G major)
      const chord4 = getChordLevelById('chord-4');
      expect(chord4.keySignatures).toContain('G_MAJOR');
      expect(chord4.newChords.map((c) => c.id)).toEqual(['C/G', 'D7/F#', 'D7']);

      // Tier 5: Flat key & German B/H pivot (F major)
      const chord5 = getChordLevelById('chord-5');
      expect(chord5.keySignatures).toContain('F_MAJOR');
      expect(chord5.newChords.map((c) => c.id)).toEqual(['Bb/F', 'C7/E', 'Bb', 'C7']);

      // Tier 6: Relative minor triads
      const chord6 = getChordLevelById('chord-6');
      expect(chord6.newChords.map((c) => c.id)).toEqual(['Am', 'Dm', 'Em']);

      // Tier 8: 2-sharp key (D major & Bm)
      const chord8 = getChordLevelById('chord-8');
      expect(chord8.keySignatures).toContain('D_MAJOR');
      expect(chord8.newChords.map((c) => c.id)).toEqual(['D', 'Bm']);

      // Tier 11: Jazz & pop color 7ths (maj7, m7)
      const chord11 = getChordLevelById('chord-11');
      expect(chord11.newChords.map((c) => c.id)).toEqual([
        'Cmaj7',
        'Fmaj7',
        'Dm7',
        'Am7',
        'Em7',
      ]);
    });

    it('ensures every level has valid canonical voicings for all its target chords', () => {
      for (const level of CHORD_LEVELS) {
        for (const target of level.targetChords) {
          const voicing = level.referenceVoicings[target.id]!;
          expect(voicing).toBeDefined();
          expect(voicing.lhMidi).toBeGreaterThanOrEqual(36); // At or above C2
          expect(voicing.lhMidi).toBeLessThanOrEqual(53); // At or below F3
          expect(voicing.rhMidis.length).toBeGreaterThanOrEqual(2);
          expect(voicing.allMidis).toEqual([voicing.lhMidi, ...voicing.rhMidis].sort((a, b) => a - b));
        }
      }
    });

    it('validates Markov transition matrices for all 12 tiers', () => {
      for (const level of CHORD_LEVELS) {
        const targetIds = new Set(level.targetChords.map((c) => c.id));

        // Every target chord must have transition entries
        for (const chordId of targetIds) {
          const transitions = level.markovTransitions[chordId];
          expect(
            transitions,
            `Level ${level.id} missing transitions for chord ${chordId}`
          ).toBeDefined();
          expect(transitions).not.toBeUndefined();
          if (!transitions) continue;

          const destinations = Object.keys(transitions);
          expect(
            destinations.length,
            `Chord ${chordId} in level ${level.id} has no transition targets`
          ).toBeGreaterThan(0);

          for (const [toChord, weight] of Object.entries(transitions)) {
            expect(weight).toBeGreaterThan(0);
            expect(
              targetIds.has(toChord),
              `Transition from ${chordId} to ${toChord} in level ${level.id} targets chord not in level.targetChords`
            ).toBe(true);
          }
        }
      }
    });

    it('generates next chords via Markov transitions smoothly and without dead ends', () => {
      const level1 = getChordLevelById('chord-1');

      // Controlled deterministic RNG test
      const deterministicNext1 = getNextMarkovChord('C', level1, () => 0.1);
      expect(deterministicNext1.id).toBe('F/C');

      const deterministicNext2 = getNextMarkovChord('C', level1, () => 0.95);
      expect(deterministicNext2.id).toBe('C');

      // Test multi-step random walk in Level 3 (C -> F -> G -> C cadences)
      const level3 = getChordLevelById('chord-3');
      let currentChord = 'C';
      for (let i = 0; i < 20; i++) {
        const next = getNextMarkovChord(currentChord, level3);
        expect(level3.targetChords.map((c) => c.id)).toContain(next.id);
        currentChord = next.id;
      }
    });
  });

  describe('Pitch-Class Resolution & Validation Rules', () => {
    it('computes pitch class modulo 12 correctly across registers', () => {
      expect(toPitchClass(48)).toBe(0); // C3
      expect(toPitchClass(60)).toBe(0); // C4 (Middle C)
      expect(toPitchClass(72)).toBe(0); // C5
      expect(toPitchClass(61)).toBe(1); // C#4
      expect(toPitchClass(47)).toBe(11); // B2
      expect(toPitchClass(59)).toBe(11); // B3
      expect(toPitchClass(71)).toBe(11); // B4
      expect(toPitchClass(41)).toBe(5); // F2
      expect(toPitchClass(65)).toBe(5); // F4
    });

    it('validates canonical reference voicings for all chords in the library', () => {
      for (const [id, chord] of Object.entries(CHORD_LIBRARY)) {
        const result = validateChordMidis(chord.referenceVoicing.allMidis, chord);
        expect(
          result.valid,
          `Chord ${id} failed validation with its own reference voicing: ${result.reason}`
        ).toBe(true);
      }
    });

    it('validates free inversion triads in any playable position or octave', () => {
      const cMajor = getChordDefinition('C');

      // Root position: [C4, E4, G4]
      expect(validateChordMidis([60, 64, 67], cMajor).valid).toBe(true);

      // 1st inversion: [E4, G4, C5]
      expect(validateChordMidis([64, 67, 72], cMajor).valid).toBe(true);

      // 2nd inversion: [G3, C4, E4]
      expect(validateChordMidis([55, 60, 64], cMajor).valid).toBe(true);

      // Two-handed spread with doubled root: [C3, G3, C4, E4, G4]
      expect(validateChordMidis([48, 55, 60, 64, 67], cMajor).valid).toBe(true);
    });

    it('rejects triads with non-chord tones or missing notes', () => {
      const cMajor = getChordDefinition('C');

      // Accidental non-chord tone (C#4 = 61): [C4, C#4, E4, G4]
      const wrongNoteResult = validateChordMidis([60, 61, 64, 67], cMajor);
      expect(wrongNoteResult.valid).toBe(false);
      expect(wrongNoteResult.reason).toBe('wrong_notes');
      expect(wrongNoteResult.extraPitchClasses).toEqual([1]);

      // Missing 3rd: [C4, G4]
      const missingResult = validateChordMidis([60, 67], cMajor);
      expect(missingResult.valid).toBe(false);
      expect(missingResult.reason).toBe('missing_notes');
      expect(missingResult.missingPitchClasses).toEqual([4]);

      // Empty input
      const emptyResult = validateChordMidis([], cMajor);
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.reason).toBe('empty');
    });

    it('enforces strict bass note requirement for slash chords', () => {
      const fOverC = getChordDefinition('F/C');

      // Correct: Lowest note is C (MIDI 48 = C3)
      expect(validateChordMidis([48, 60, 65, 69], fOverC).valid).toBe(true);

      // Correct: Lowest note is C in deep bass (MIDI 36 = C2)
      expect(validateChordMidis([36, 60, 65, 69], fOverC).valid).toBe(true);

      // Incorrect: All right-hand notes are correct F major tones, but lowest note is F2 (MIDI 41)
      const wrongBassResult = validateChordMidis([41, 60, 65, 69], fOverC);
      expect(wrongBassResult.valid).toBe(false);
      expect(wrongBassResult.reason).toBe('wrong_bass');
      expect(wrongBassResult.bassPitchClass).toBe(5); // F
      expect(wrongBassResult.expectedBassPitchClass).toBe(0); // C

      // Test G/B: Bass must be B (pitch class 11)
      const gOverB = getChordDefinition('G/B');
      expect(validateChordMidis([47, 59, 62, 67], gOverB).valid).toBe(true); // B2 in bass

      const gOverBWrong = validateChordMidis([43, 59, 62, 67], gOverB); // G2 in bass
      expect(gOverBWrong.valid).toBe(false);
      expect(gOverBWrong.reason).toBe('wrong_bass');

      // Test D7/F#: Bass must be F# (pitch class 6)
      const d7OverFSharp = getChordDefinition('D7/F#');
      expect(validateChordMidis([42, 60, 62, 66], d7OverFSharp).valid).toBe(true);

      const d7WrongBass = validateChordMidis([50, 60, 62, 66], d7OverFSharp); // D3 in bass
      expect(d7WrongBass.valid).toBe(false);
      expect(d7WrongBass.reason).toBe('wrong_bass');
    });

    it('applies the 5th-omission rule to 7th chords without penalty', () => {
      const g7 = getChordDefinition('G7'); // Root G(7), 3rd B(11), 5th D(2), 7th F(5)

      // Full 4-note voicing: [G2, B3, D4, F4, G4]
      expect(validateChordMidis([43, 59, 62, 65, 67], g7).valid).toBe(true);

      // 3-note shell voicing with 5th omitted: [G2, B3, F4] (D omitted)
      expect(validateChordMidis([43, 59, 65], g7).valid).toBe(true);

      // But omitting the 3rd or the 7th must fail!
      const missing7th = validateChordMidis([43, 59, 62], g7); // Missing F
      expect(missing7th.valid).toBe(false);
      expect(missing7th.reason).toBe('missing_notes');
      expect(missing7th.missingPitchClasses).toEqual([5]);

      const missing3rd = validateChordMidis([43, 62, 65], g7); // Missing B
      expect(missing3rd.valid).toBe(false);
      expect(missing3rd.reason).toBe('missing_notes');
      expect(missing3rd.missingPitchClasses).toEqual([11]);

      // Major 7th: Cmaj7 allows 5th (G) omission
      const cmaj7 = getChordDefinition('Cmaj7');
      expect(validateChordMidis([48, 59, 64, 67], cmaj7).valid).toBe(true); // with 5th
      expect(validateChordMidis([48, 59, 64], cmaj7).valid).toBe(true); // without 5th (C, E, B)

      // Minor 7th: Dm7 allows 5th (A) omission
      const dm7 = getChordDefinition('Dm7');
      expect(validateChordMidis([50, 60, 65, 69], dm7).valid).toBe(true); // with 5th (D, F, A, C)
      expect(validateChordMidis([50, 60, 65], dm7).valid).toBe(true); // without 5th (D, F, C)
    });

    it('requires the 5th for standard triads (triads cannot omit the 5th)', () => {
      const cMajor = getChordDefinition('C');
      // Root + 3rd only (no 5th)
      const missing5th = validateChordMidis([48, 64], cMajor);
      expect(missing5th.valid).toBe(false);
      expect(missing5th.reason).toBe('missing_notes');
      expect(missing5th.missingPitchClasses).toEqual([7]);
    });
  });

  describe('International vs. German Notation System', () => {
    it('converts B natural chords to H in German notation', () => {
      expect(convertToGermanNotation('B')).toBe('H');
      expect(convertToGermanNotation('Bm')).toBe('Hm');
      expect(convertToGermanNotation('B7')).toBe('H7');
      expect(convertToGermanNotation('Bm7')).toBe('Hm7');
      expect(convertToGermanNotation('Bmaj7')).toBe('Hmaj7');
    });

    it('converts B-flat chords to B in German notation', () => {
      expect(convertToGermanNotation('Bb')).toBe('B');
      expect(convertToGermanNotation('Bbm')).toBe('Bm');
      expect(convertToGermanNotation('Bb7')).toBe('B7');
      expect(convertToGermanNotation('Bbmaj7')).toBe('Bmaj7');
    });

    it('converts slash chords with B or Bb in bass or root', () => {
      expect(convertToGermanNotation('G/B')).toBe('G/H');
      expect(convertToGermanNotation('G7/B')).toBe('G7/H');
      expect(convertToGermanNotation('Bb/F')).toBe('B/F');
      expect(convertToGermanNotation('F/Bb')).toBe('F/B');
      expect(convertToGermanNotation('Bb/B')).toBe('B/H');
    });

    it('preserves non-B chord names unchanged in German notation', () => {
      expect(convertToGermanNotation('C')).toBe('C');
      expect(convertToGermanNotation('F/C')).toBe('F/C');
      expect(convertToGermanNotation('C/G')).toBe('C/G');
      expect(convertToGermanNotation('D7/F#')).toBe('D7/F#');
      expect(convertToGermanNotation('C7/E')).toBe('C7/E');
      expect(convertToGermanNotation('Am')).toBe('Am');
      expect(convertToGermanNotation('Dm7')).toBe('Dm7');
    });

    it('converts German notation back to International correctly', () => {
      expect(convertToInternationalNotation('H')).toBe('B');
      expect(convertToInternationalNotation('Hm')).toBe('Bm');
      expect(convertToInternationalNotation('H7')).toBe('B7');
      expect(convertToInternationalNotation('B')).toBe('Bb');
      expect(convertToInternationalNotation('Bm')).toBe('Bbm');
      expect(convertToInternationalNotation('B7')).toBe('Bb7');
      expect(convertToInternationalNotation('G/H')).toBe('G/B');
      expect(convertToInternationalNotation('B/F')).toBe('Bb/F');
      expect(convertToInternationalNotation('B/H')).toBe('Bb/B');
    });

    it('formats chord labels according to active notation system', () => {
      const gOverB = getChordDefinition('G/B');
      expect(formatChordLabel(gOverB, 'international')).toBe('G/B');
      expect(formatChordLabel(gOverB, 'german')).toBe('G/H');

      const bb = getChordDefinition('Bb');
      expect(formatChordLabel(bb, 'international')).toBe('Bb');
      expect(formatChordLabel(bb, 'german')).toBe('B');

      const bm = getChordDefinition('Bm');
      expect(formatChordLabel(bm, 'international')).toBe('Bm');
      expect(formatChordLabel(bm, 'german')).toBe('Hm');

      const bbOverF = getChordDefinition('Bb/F');
      expect(formatChordLabel(bbOverF, 'international')).toBe('Bb/F');
      expect(formatChordLabel(bbOverF, 'german')).toBe('B/F');

      // String ID formatting
      expect(formatChordLabel('G7/B', 'german')).toBe('G7/H');
      expect(formatChordLabel('G7/B', 'international')).toBe('G7/B');
      expect(formatChordLabel('Bb7', 'german')).toBe('B7');
    });
  });
});
