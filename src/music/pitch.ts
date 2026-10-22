import { Accidental, Clef, LetterName, Octave, SpelledPitch, StaffNoteTarget } from '../types/music';

export const LETTER_INDEX: Record<LetterName, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

export const LETTER_SEMITONE: Record<LetterName, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function createPitch(letter: LetterName, accidental: Accidental, octave: Octave): SpelledPitch {
  const accidentalStr = accidental === 1 ? '#' : accidental === -1 ? 'b' : '';
  const id = `${letter}${accidentalStr}${octave}`;
  const midi = (octave + 1) * 12 + LETTER_SEMITONE[letter] + accidental;
  const diatonicStep = octave * 7 + LETTER_INDEX[letter];

  return {
    letter,
    accidental,
    octave,
    midi,
    id,
    diatonicStep,
  };
}

export function parsePitch(id: string): SpelledPitch {
  const match = id.match(/^([A-G])([#b]?)([1-7])$/);
  if (!match) {
    throw new Error(`Invalid pitch string: "${id}"`);
  }

  const letter = match[1] as LetterName;
  const accSymbol = match[2];
  const octave = Number(match[3]) as Octave;
  const accidental: Accidental = accSymbol === '#' ? 1 : accSymbol === 'b' ? -1 : 0;

  return createPitch(letter, accidental, octave);
}

export function createTarget(clef: Clef, pitchId: string): StaffNoteTarget {
  const pitch = parsePitch(pitchId);
  return {
    targetId: `${clef}:${pitch.id}`,
    clef,
    pitch,
  };
}

export function getPitchClass(pitch: SpelledPitch): number {
  return ((LETTER_SEMITONE[pitch.letter] + pitch.accidental) % 12 + 12) % 12;
}

export function getStaffStepOffset(pitch: SpelledPitch, clef: Clef): number {
  // Treble bottom line is E4 (diatonicStep = 4 * 7 + 2 = 30)
  // Bass bottom line is G2 (diatonicStep = 2 * 7 + 4 = 18)
  const baseDiatonicStep = clef === 'treble' ? 30 : 18;
  return pitch.diatonicStep - baseDiatonicStep;
}
