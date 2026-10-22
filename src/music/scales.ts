import { Accidental, LetterName } from '../types/music';

export type KeySignatureId = 'C_MAJOR' | 'G_MAJOR' | 'F_MAJOR' | 'D_MAJOR' | 'BB_MAJOR';

export interface KeySignatureSpec {
  readonly id: KeySignatureId;
  readonly label: string;
  readonly accidentalType: 'sharp' | 'flat' | 'none';
  /** Step offsets where the key signature symbols are drawn on each staff */
  readonly trebleStepOffsets: readonly number[];
  readonly bassStepOffsets: readonly number[];
  /** Map of letter name -> accidental applied by this key signature */
  readonly alteredLetters: Partial<Record<LetterName, Accidental>>;
}

export const KEY_SIGNATURES: Record<KeySignatureId, KeySignatureSpec> = {
  C_MAJOR: {
    id: 'C_MAJOR',
    label: 'C Major',
    accidentalType: 'none',
    trebleStepOffsets: [],
    bassStepOffsets: [],
    alteredLetters: {},
  },
  G_MAJOR: {
    id: 'G_MAJOR',
    label: 'G Major / E Minor',
    accidentalType: 'sharp',
    trebleStepOffsets: [8], // F5
    bassStepOffsets: [6],   // F3
    alteredLetters: { F: 1 },
  },
  D_MAJOR: {
    id: 'D_MAJOR',
    label: 'D Major / B Minor',
    accidentalType: 'sharp',
    trebleStepOffsets: [8, 5], // F5, C5
    bassStepOffsets: [6, 3],   // F3, C3
    alteredLetters: { F: 1, C: 1 },
  },
  F_MAJOR: {
    id: 'F_MAJOR',
    label: 'F Major / D Minor',
    accidentalType: 'flat',
    trebleStepOffsets: [4], // B4
    bassStepOffsets: [2],   // B2
    alteredLetters: { B: -1 },
  },
  BB_MAJOR: {
    id: 'BB_MAJOR',
    label: 'Bb Major / G Minor',
    accidentalType: 'flat',
    trebleStepOffsets: [4, 7], // B4, E5
    bassStepOffsets: [2, 5],   // B2, E3
    alteredLetters: { B: -1, E: -1 },
  },
};
