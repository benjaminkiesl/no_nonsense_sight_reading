import { Accidental, LetterName } from '../types/music';

export type KeySignatureId =
  | 'C_MAJOR'
  | 'G_MAJOR'
  | 'D_MAJOR'
  | 'A_MAJOR'
  | 'E_MAJOR'
  | 'B_MAJOR'
  | 'FS_MAJOR'
  | 'F_MAJOR'
  | 'BB_MAJOR'
  | 'EB_MAJOR'
  | 'AB_MAJOR'
  | 'DB_MAJOR';

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

// Standard engraving order for sharps (F C G D A E) and flats (B E A D G)
const TREBLE_SHARPS = [8, 5, 9, 6, 3, 7] as const; // F5, C5, G5, D5, A4, E5
const BASS_SHARPS = [6, 3, 7, 4, 1, 5] as const;   // F3, C3, G3, D3, A2, E3
const TREBLE_FLATS = [4, 7, 3, 6, 2] as const;     // B4, E5, A4, D5, G4
const BASS_FLATS = [2, 5, 1, 4, 0] as const;       // B2, E3, A2, D3, G2

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
    trebleStepOffsets: TREBLE_SHARPS.slice(0, 1),
    bassStepOffsets: BASS_SHARPS.slice(0, 1),
    alteredLetters: { F: 1 },
  },
  D_MAJOR: {
    id: 'D_MAJOR',
    label: 'D Major / B Minor',
    accidentalType: 'sharp',
    trebleStepOffsets: TREBLE_SHARPS.slice(0, 2),
    bassStepOffsets: BASS_SHARPS.slice(0, 2),
    alteredLetters: { F: 1, C: 1 },
  },
  A_MAJOR: {
    id: 'A_MAJOR',
    label: 'A Major / F# Minor',
    accidentalType: 'sharp',
    trebleStepOffsets: TREBLE_SHARPS.slice(0, 3),
    bassStepOffsets: BASS_SHARPS.slice(0, 3),
    alteredLetters: { F: 1, C: 1, G: 1 },
  },
  E_MAJOR: {
    id: 'E_MAJOR',
    label: 'E Major / C# Minor',
    accidentalType: 'sharp',
    trebleStepOffsets: TREBLE_SHARPS.slice(0, 4),
    bassStepOffsets: BASS_SHARPS.slice(0, 4),
    alteredLetters: { F: 1, C: 1, G: 1, D: 1 },
  },
  B_MAJOR: {
    id: 'B_MAJOR',
    label: 'B Major / G# Minor',
    accidentalType: 'sharp',
    trebleStepOffsets: TREBLE_SHARPS.slice(0, 5),
    bassStepOffsets: BASS_SHARPS.slice(0, 5),
    alteredLetters: { F: 1, C: 1, G: 1, D: 1, A: 1 },
  },
  FS_MAJOR: {
    id: 'FS_MAJOR',
    label: 'F# Major / D# Minor',
    accidentalType: 'sharp',
    trebleStepOffsets: TREBLE_SHARPS.slice(0, 6),
    bassStepOffsets: BASS_SHARPS.slice(0, 6),
    alteredLetters: { F: 1, C: 1, G: 1, D: 1, A: 1, E: 1 },
  },
  F_MAJOR: {
    id: 'F_MAJOR',
    label: 'F Major / D Minor',
    accidentalType: 'flat',
    trebleStepOffsets: TREBLE_FLATS.slice(0, 1),
    bassStepOffsets: BASS_FLATS.slice(0, 1),
    alteredLetters: { B: -1 },
  },
  BB_MAJOR: {
    id: 'BB_MAJOR',
    label: 'Bb Major / G Minor',
    accidentalType: 'flat',
    trebleStepOffsets: TREBLE_FLATS.slice(0, 2),
    bassStepOffsets: BASS_FLATS.slice(0, 2),
    alteredLetters: { B: -1, E: -1 },
  },
  EB_MAJOR: {
    id: 'EB_MAJOR',
    label: 'Eb Major / C Minor',
    accidentalType: 'flat',
    trebleStepOffsets: TREBLE_FLATS.slice(0, 3),
    bassStepOffsets: BASS_FLATS.slice(0, 3),
    alteredLetters: { B: -1, E: -1, A: -1 },
  },
  AB_MAJOR: {
    id: 'AB_MAJOR',
    label: 'Ab Major / F Minor',
    accidentalType: 'flat',
    trebleStepOffsets: TREBLE_FLATS.slice(0, 4),
    bassStepOffsets: BASS_FLATS.slice(0, 4),
    alteredLetters: { B: -1, E: -1, A: -1, D: -1 },
  },
  DB_MAJOR: {
    id: 'DB_MAJOR',
    label: 'Db Major / Bb Minor',
    accidentalType: 'flat',
    trebleStepOffsets: TREBLE_FLATS.slice(0, 5),
    bassStepOffsets: BASS_FLATS.slice(0, 5),
    alteredLetters: { B: -1, E: -1, A: -1, D: -1, G: -1 },
  },
};
