import { LETTER_INDEX, LETTER_SEMITONE } from '../music/pitch';
import { KEY_SIGNATURES, KeySignatureId } from '../music/scales';
import { ChordNotationSystem, ChordQuality } from '../types/chord';
import { Accidental, LetterName } from '../types/music';
import { convertToGermanNotation, formatChordLabel } from './chords';

export type ChordNamingAnswerMode = 'chord_name' | 'roman_numeral';
export type ChordNamingClefMode = 'treble' | 'bass' | 'both';
export type ChordNamingPoolId =
  | 'adaptive'
  | 'core_triads'
  | 'all_triads'
  | 'triads_and_dom7'
  | 'triads_and_7ths'
  | 'all_chords';
export type ChordNamingKeyId =
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
  | 'DB_MAJOR'
  | 'A_MINOR'
  | 'E_MINOR'
  | 'B_MINOR'
  | 'FS_MINOR'
  | 'CS_MINOR'
  | 'GS_MINOR'
  | 'D_MINOR'
  | 'G_MINOR'
  | 'C_MINOR'
  | 'F_MINOR'
  | 'BB_MINOR'
  | 'EB_MINOR';

export interface RomanScaleSpec {
  readonly id: ChordNamingKeyId;
  readonly label: string;
  readonly mode: 'major' | 'minor';
  readonly keySignature: KeySignatureId;
  readonly chords: readonly DiatonicFunctionEntry[];
}

export interface ChordNamingConfig {
  readonly answerMode: ChordNamingAnswerMode;
  readonly clefMode: ChordNamingClefMode;
  readonly poolId: ChordNamingPoolId;
  readonly fixedKey: ChordNamingKeyId;
  readonly totalChords: number;
}

export const DEFAULT_CHORD_NAMING_CONFIG: ChordNamingConfig = {
  answerMode: 'chord_name',
  clefMode: 'both',
  poolId: 'adaptive',
  fixedKey: 'C_MAJOR',
  totalChords: 50,
};

export interface ChordToneSpelling {
  readonly letter: LetterName;
  readonly accidental: Accidental;
}

export interface NamingChordSpec {
  readonly id: string; // Canonical international chord symbol, e.g. 'C', 'Am', 'F#m', 'G7', 'Cmaj7'
  readonly rootLetter: LetterName;
  readonly rootAccidental: Accidental;
  readonly quality: ChordQuality;
  readonly tones: readonly ChordToneSpelling[];
}

export type ChordTextureKind =
  | 'block'
  | 'arpeggio_up'
  | 'arpeggio_down'
  | 'alberti'
  | 'bass_and_chord'
  | 'grand_staff';

export interface RenderedChordNote {
  readonly midi: number;
  readonly letter: LetterName;
  readonly accidental: Accidental;
  readonly octave: number;
  readonly diatonicStep: number;
  readonly stepOffset: number;
  /** Accidental glyph to draw on the staff relative to the active key signature */
  readonly displayAccidental: 'sharp' | 'flat' | 'natural' | null;
  /** Horizontal column slot (0..3) for broken/arpeggiated chords; defaults to 0 */
  readonly slot?: number;
  /** Per-note clef override for grand-staff split voicings; defaults to prompt.clef */
  readonly clef?: 'treble' | 'bass';
}

export interface ChordNamingPrompt {
  readonly index: number;
  readonly clef: 'treble' | 'bass';
  readonly keySignature: KeySignatureId;
  readonly chordId: string;
  readonly quality: ChordQuality;
  readonly inversion: 0 | 1 | 2 | 3;
  readonly inversionLabel: string;
  readonly bassSpelling: ChordToneSpelling;
  readonly romanNumeral?: string;
  readonly texture?: ChordTextureKind;
  readonly omittedFifth?: boolean;
  readonly notes: readonly RenderedChordNote[];
}

const LETTERS: readonly LetterName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

interface IntervalDef {
  readonly diatonicSteps: number; // 0=root, 1=2nd, 2=3rd, 3=4th, 4=5th, 6=7th
  readonly semitones: number;
}

const QUALITY_INTERVALS: Record<
  Exclude<ChordQuality, 'augmented'>,
  readonly IntervalDef[]
> = {
  major: [
    { diatonicSteps: 0, semitones: 0 },
    { diatonicSteps: 2, semitones: 4 },
    { diatonicSteps: 4, semitones: 7 },
  ],
  minor: [
    { diatonicSteps: 0, semitones: 0 },
    { diatonicSteps: 2, semitones: 3 },
    { diatonicSteps: 4, semitones: 7 },
  ],
  dominant7: [
    { diatonicSteps: 0, semitones: 0 },
    { diatonicSteps: 2, semitones: 4 },
    { diatonicSteps: 4, semitones: 7 },
    { diatonicSteps: 6, semitones: 10 },
  ],
  major7: [
    { diatonicSteps: 0, semitones: 0 },
    { diatonicSteps: 2, semitones: 4 },
    { diatonicSteps: 4, semitones: 7 },
    { diatonicSteps: 6, semitones: 11 },
  ],
  minor7: [
    { diatonicSteps: 0, semitones: 0 },
    { diatonicSteps: 2, semitones: 3 },
    { diatonicSteps: 4, semitones: 7 },
    { diatonicSteps: 6, semitones: 10 },
  ],
  diminished: [
    { diatonicSteps: 0, semitones: 0 },
    { diatonicSteps: 2, semitones: 3 },
    { diatonicSteps: 4, semitones: 6 },
  ],
  sus2: [
    { diatonicSteps: 0, semitones: 0 },
    { diatonicSteps: 1, semitones: 2 },
    { diatonicSteps: 4, semitones: 7 },
  ],
  sus4: [
    { diatonicSteps: 0, semitones: 0 },
    { diatonicSteps: 3, semitones: 5 },
    { diatonicSteps: 4, semitones: 7 },
  ],
};

const QUALITY_SUFFIX: Record<Exclude<ChordQuality, 'augmented'>, string> = {
  major: '',
  minor: 'm',
  dominant7: '7',
  major7: 'maj7',
  minor7: 'm7',
  diminished: 'dim',
  sus2: 'sus2',
  sus4: 'sus4',
};

function buildChordSpec(
  rootLetter: LetterName,
  rootAccidental: Accidental,
  quality: Exclude<ChordQuality, 'augmented'>
): NamingChordSpec {
  const rootLetterIdx = LETTER_INDEX[rootLetter];
  const rootSemitone = (LETTER_SEMITONE[rootLetter] + rootAccidental + 12) % 12;

  const tones: ChordToneSpelling[] = QUALITY_INTERVALS[quality].map((iv) => {
    const targetLetterIdx = (rootLetterIdx + iv.diatonicSteps) % 7;
    const letter = LETTERS[targetLetterIdx]!;
    const naturalSemitone = LETTER_SEMITONE[letter];
    const desiredSemitone = (rootSemitone + iv.semitones) % 12;

    let diff = desiredSemitone - naturalSemitone;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;

    // Fallback to clean enharmonic spelling if a theoretical double-sharp/double-flat occurs
    if (diff > 1 || diff < -1) {
      const fallbackSharp: readonly ChordToneSpelling[] = [
        { letter: 'C', accidental: 0 },
        { letter: 'C', accidental: 1 },
        { letter: 'D', accidental: 0 },
        { letter: 'E', accidental: -1 },
        { letter: 'E', accidental: 0 },
        { letter: 'F', accidental: 0 },
        { letter: 'F', accidental: 1 },
        { letter: 'G', accidental: 0 },
        { letter: 'A', accidental: -1 },
        { letter: 'A', accidental: 0 },
        { letter: 'B', accidental: -1 },
        { letter: 'B', accidental: 0 },
      ];
      return fallbackSharp[desiredSemitone]!;
    }

    return { letter, accidental: diff as Accidental };
  });

  const accStr = rootAccidental === 1 ? '#' : rootAccidental === -1 ? 'b' : '';
  const id = `${rootLetter}${accStr}${QUALITY_SUFFIX[quality]}`;

  return {
    id,
    rootLetter,
    rootAccidental,
    quality,
    tones,
  };
}

/**
 * 12 canonical musical roots for major/dominant/sus/dim chords (preferring standard key spellings:
 * C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B) and for minor chords (C, C#, D, Eb, E, F, F#, G, G#, A, Bb, B).
 */
const MAJOR_ROOTS: readonly ChordToneSpelling[] = [
  { letter: 'C', accidental: 0 },
  { letter: 'D', accidental: -1 }, // Db
  { letter: 'D', accidental: 0 },
  { letter: 'E', accidental: -1 }, // Eb
  { letter: 'E', accidental: 0 },
  { letter: 'F', accidental: 0 },
  { letter: 'F', accidental: 1 },  // F#
  { letter: 'G', accidental: 0 },
  { letter: 'A', accidental: -1 }, // Ab
  { letter: 'A', accidental: 0 },
  { letter: 'B', accidental: -1 }, // Bb
  { letter: 'B', accidental: 0 },
];

const MINOR_ROOTS: readonly ChordToneSpelling[] = [
  { letter: 'C', accidental: 0 },
  { letter: 'C', accidental: 1 },  // C#m
  { letter: 'D', accidental: 0 },
  { letter: 'E', accidental: -1 }, // Ebm
  { letter: 'E', accidental: 0 },
  { letter: 'F', accidental: 0 },
  { letter: 'F', accidental: 1 },  // F#m
  { letter: 'G', accidental: 0 },
  { letter: 'G', accidental: 1 },  // G#m
  { letter: 'A', accidental: 0 },
  { letter: 'B', accidental: -1 }, // Bbm
  { letter: 'B', accidental: 0 },
];

function buildAllChordSpecs(): Record<string, NamingChordSpec> {
  const map: Record<string, NamingChordSpec> = {};
  const add = (spec: NamingChordSpec) => {
    map[spec.id] = spec;
  };

  for (const r of MAJOR_ROOTS) {
    add(buildChordSpec(r.letter, r.accidental, 'major'));
    add(buildChordSpec(r.letter, r.accidental, 'dominant7'));
    add(buildChordSpec(r.letter, r.accidental, 'major7'));
    add(buildChordSpec(r.letter, r.accidental, 'diminished'));
    add(buildChordSpec(r.letter, r.accidental, 'sus2'));
    add(buildChordSpec(r.letter, r.accidental, 'sus4'));
  }

  for (const r of MINOR_ROOTS) {
    add(buildChordSpec(r.letter, r.accidental, 'minor'));
    add(buildChordSpec(r.letter, r.accidental, 'minor7'));
  }

  return map;
}

export const NAMING_CHORD_SPECS: Record<string, NamingChordSpec> = buildAllChordSpecs();

const ALL_MAJOR_IDS = MAJOR_ROOTS.map((r) => `${r.letter}${r.accidental === 1 ? '#' : r.accidental === -1 ? 'b' : ''}`);
const ALL_MINOR_IDS = MINOR_ROOTS.map((r) => `${r.letter}${r.accidental === 1 ? '#' : r.accidental === -1 ? 'b' : ''}m`);
const ALL_DOM7_IDS = ALL_MAJOR_IDS.map((id) => `${id}7`);
const ALL_MAJ7_IDS = ALL_MAJOR_IDS.map((id) => `${id}maj7`);
const ALL_MIN7_IDS = ALL_MINOR_IDS.map((id) => `${id}7`);
const ALL_DIM_IDS = ALL_MAJOR_IDS.map((id) => `${id}dim`);
const ALL_SUS2_IDS = ALL_MAJOR_IDS.map((id) => `${id}sus2`);
const ALL_SUS4_IDS = ALL_MAJOR_IDS.map((id) => `${id}sus4`);

const HIGH_ROI_CORE_LADDER: readonly string[] = [
  // Primary triads (80/20 foundation)
  'C', 'F', 'G',
  // Relative minor & C-major diatonic family + #1 dominant 7th
  'Am', 'Dm', 'G7', 'Em',
  // G Major & F Major essentials
  'D', 'D7', 'Bb', 'C7',
  // D Major & A minor dominants + songbook minors
  'A', 'A7', 'E7', 'Bm', 'Gm', 'E',
  // Core pop/jazz 7ths
  'Cmaj7', 'Dm7', 'Am7', 'Fmaj7', 'Em7',
  // Remaining common flat/sharp triads
  'Eb', 'Cm', 'Fm', 'Ab', 'Db', 'F#m', 'B', 'C#m', 'F#', 'Bbm', 'G#m', 'Ebm',
  // Common dominant & minor 7ths
  'B7', 'F7', 'Bb7', 'Eb7', 'Gm7', 'Bm7', 'Cm7', 'Fm7', 'F#m7', 'Gmaj7', 'Dmaj7', 'Bbmaj7', 'Ebmaj7', 'Amaj7',
  // Common suspended & diminished chords
  'Csus4', 'Gsus4', 'Dsus4', 'Asus4', 'Csus2', 'Gsus2', 'Dsus2', 'Asus2',
  'Bdim', 'Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'F#dim',
];

const ALL_96_IDS: readonly string[] = [
  ...ALL_MAJOR_IDS,
  ...ALL_MINOR_IDS,
  ...ALL_DOM7_IDS,
  ...ALL_MAJ7_IDS,
  ...ALL_MIN7_IDS,
  ...ALL_DIM_IDS,
  ...ALL_SUS2_IDS,
  ...ALL_SUS4_IDS,
];

/**
 * Full 96-chord ladder ordered by real-world frequency / pedagogical ROI (80/20 principle).
 */
export const ADAPTIVE_CHORD_LADDER: readonly string[] = [
  ...HIGH_ROI_CORE_LADDER,
  ...ALL_96_IDS.filter((id) => !HIGH_ROI_CORE_LADDER.includes(id)),
];

export const ADAPTIVE_ROMAN_LADDER: readonly string[] = [
  'I', 'IV', 'V', 'vi', 'V7', 'ii', 'iii',
];

export const ADAPTIVE_MINOR_ROMAN_LADDER: readonly string[] = [
  'i', 'iv', 'V', 'VI', 'V7', 'III', 'VII',
];

export const MAJOR_ROMAN_BUTTONS: readonly string[] = ['I', 'ii', 'iii', 'IV', 'V', 'V7', 'vi'];
export const MINOR_ROMAN_BUTTONS: readonly string[] = ['i', 'III', 'iv', 'V', 'V7', 'VI', 'VII'];

export const CHORD_NAMING_POOLS: Record<ChordNamingPoolId, readonly string[]> = {
  adaptive: ADAPTIVE_CHORD_LADDER,
  core_triads: ['C', 'F', 'G', 'D', 'A', 'Bb', 'Am', 'Dm', 'Em', 'Gm', 'Bm'],
  all_triads: [...ALL_MAJOR_IDS, ...ALL_MINOR_IDS], // 24 chords
  triads_and_dom7: [
    'C', 'F', 'G', 'D', 'A', 'Bb', 'Am', 'Dm', 'Em', 'Gm', 'Bm',
    'G7', 'D7', 'C7', 'A7', 'E7',
  ],
  triads_and_7ths: [
    ...ALL_MAJOR_IDS,
    ...ALL_MINOR_IDS,
    ...ALL_DOM7_IDS,
    ...ALL_MAJ7_IDS,
    ...ALL_MIN7_IDS,
  ], // 60 chords
  all_chords: ALL_96_IDS, // 96 chords
};

/**
 * Returns the distinct ChordQualities present in a given pool (or currently unlocked adaptive slice)
 * so the mobile tap selector only displays relevant quality buttons (zero unnecessary clutter).
 */
export function getPoolQualities(
  poolId: ChordNamingPoolId,
  unlockedCount?: number
): readonly Exclude<ChordQuality, 'augmented'>[] {
  if (poolId === 'adaptive') {
    const count = Math.max(3, Math.min(ADAPTIVE_CHORD_LADDER.length, unlockedCount ?? 3));
    const unlockedIds = ADAPTIVE_CHORD_LADDER.slice(0, count);
    const present = new Set<Exclude<ChordQuality, 'augmented'>>();
    for (const id of unlockedIds) {
      const spec = NAMING_CHORD_SPECS[id];
      if (spec && spec.quality !== 'augmented') {
        present.add(spec.quality);
      }
    }
    const order: readonly Exclude<ChordQuality, 'augmented'>[] = [
      'major',
      'minor',
      'dominant7',
      'major7',
      'minor7',
      'diminished',
      'sus2',
      'sus4',
    ];
    return order.filter((q) => present.has(q));
  }

  switch (poolId) {
    case 'core_triads':
    case 'all_triads':
      return ['major', 'minor'];
    case 'triads_and_dom7':
      return ['major', 'minor', 'dominant7'];
    case 'triads_and_7ths':
      return ['major', 'minor', 'dominant7', 'major7', 'minor7'];
    case 'all_chords':
      return ['major', 'minor', 'dominant7', 'major7', 'minor7', 'diminished', 'sus2', 'sus4'];
  }
}

export interface DiatonicFunctionEntry {
  readonly roman: string;
  readonly chordId: string;
}

export const ROMAN_SCALE_SPECS: Record<ChordNamingKeyId, RomanScaleSpec> = {
  // 12 Major Scales
  C_MAJOR: {
    id: 'C_MAJOR', label: 'C Major', mode: 'major', keySignature: 'C_MAJOR',
    chords: [
      { roman: 'I', chordId: 'C' }, { roman: 'ii', chordId: 'Dm' }, { roman: 'iii', chordId: 'Em' },
      { roman: 'IV', chordId: 'F' }, { roman: 'V', chordId: 'G' }, { roman: 'V7', chordId: 'G7' }, { roman: 'vi', chordId: 'Am' },
    ],
  },
  G_MAJOR: {
    id: 'G_MAJOR', label: 'G Major', mode: 'major', keySignature: 'G_MAJOR',
    chords: [
      { roman: 'I', chordId: 'G' }, { roman: 'ii', chordId: 'Am' }, { roman: 'iii', chordId: 'Bm' },
      { roman: 'IV', chordId: 'C' }, { roman: 'V', chordId: 'D' }, { roman: 'V7', chordId: 'D7' }, { roman: 'vi', chordId: 'Em' },
    ],
  },
  D_MAJOR: {
    id: 'D_MAJOR', label: 'D Major', mode: 'major', keySignature: 'D_MAJOR',
    chords: [
      { roman: 'I', chordId: 'D' }, { roman: 'ii', chordId: 'Em' }, { roman: 'iii', chordId: 'F#m' },
      { roman: 'IV', chordId: 'G' }, { roman: 'V', chordId: 'A' }, { roman: 'V7', chordId: 'A7' }, { roman: 'vi', chordId: 'Bm' },
    ],
  },
  A_MAJOR: {
    id: 'A_MAJOR', label: 'A Major', mode: 'major', keySignature: 'A_MAJOR',
    chords: [
      { roman: 'I', chordId: 'A' }, { roman: 'ii', chordId: 'Bm' }, { roman: 'iii', chordId: 'C#m' },
      { roman: 'IV', chordId: 'D' }, { roman: 'V', chordId: 'E' }, { roman: 'V7', chordId: 'E7' }, { roman: 'vi', chordId: 'F#m' },
    ],
  },
  E_MAJOR: {
    id: 'E_MAJOR', label: 'E Major', mode: 'major', keySignature: 'E_MAJOR',
    chords: [
      { roman: 'I', chordId: 'E' }, { roman: 'ii', chordId: 'F#m' }, { roman: 'iii', chordId: 'G#m' },
      { roman: 'IV', chordId: 'A' }, { roman: 'V', chordId: 'B' }, { roman: 'V7', chordId: 'B7' }, { roman: 'vi', chordId: 'C#m' },
    ],
  },
  B_MAJOR: {
    id: 'B_MAJOR', label: 'B Major', mode: 'major', keySignature: 'B_MAJOR',
    chords: [
      { roman: 'I', chordId: 'B' }, { roman: 'ii', chordId: 'C#m' }, { roman: 'iii', chordId: 'Ebm' },
      { roman: 'IV', chordId: 'E' }, { roman: 'V', chordId: 'F#' }, { roman: 'V7', chordId: 'F#7' }, { roman: 'vi', chordId: 'G#m' },
    ],
  },
  FS_MAJOR: {
    id: 'FS_MAJOR', label: 'F♯ Major', mode: 'major', keySignature: 'FS_MAJOR',
    chords: [
      { roman: 'I', chordId: 'F#' }, { roman: 'ii', chordId: 'G#m' }, { roman: 'iii', chordId: 'Bbm' },
      { roman: 'IV', chordId: 'B' }, { roman: 'V', chordId: 'Db' }, { roman: 'V7', chordId: 'Db7' }, { roman: 'vi', chordId: 'Ebm' },
    ],
  },
  F_MAJOR: {
    id: 'F_MAJOR', label: 'F Major', mode: 'major', keySignature: 'F_MAJOR',
    chords: [
      { roman: 'I', chordId: 'F' }, { roman: 'ii', chordId: 'Gm' }, { roman: 'iii', chordId: 'Am' },
      { roman: 'IV', chordId: 'Bb' }, { roman: 'V', chordId: 'C' }, { roman: 'V7', chordId: 'C7' }, { roman: 'vi', chordId: 'Dm' },
    ],
  },
  BB_MAJOR: {
    id: 'BB_MAJOR', label: 'B♭ Major', mode: 'major', keySignature: 'BB_MAJOR',
    chords: [
      { roman: 'I', chordId: 'Bb' }, { roman: 'ii', chordId: 'Cm' }, { roman: 'iii', chordId: 'Dm' },
      { roman: 'IV', chordId: 'Eb' }, { roman: 'V', chordId: 'F' }, { roman: 'V7', chordId: 'F7' }, { roman: 'vi', chordId: 'Gm' },
    ],
  },
  EB_MAJOR: {
    id: 'EB_MAJOR', label: 'E♭ Major', mode: 'major', keySignature: 'EB_MAJOR',
    chords: [
      { roman: 'I', chordId: 'Eb' }, { roman: 'ii', chordId: 'Fm' }, { roman: 'iii', chordId: 'Gm' },
      { roman: 'IV', chordId: 'Ab' }, { roman: 'V', chordId: 'Bb' }, { roman: 'V7', chordId: 'Bb7' }, { roman: 'vi', chordId: 'Cm' },
    ],
  },
  AB_MAJOR: {
    id: 'AB_MAJOR', label: 'A♭ Major', mode: 'major', keySignature: 'AB_MAJOR',
    chords: [
      { roman: 'I', chordId: 'Ab' }, { roman: 'ii', chordId: 'Bbm' }, { roman: 'iii', chordId: 'Cm' },
      { roman: 'IV', chordId: 'Db' }, { roman: 'V', chordId: 'Eb' }, { roman: 'V7', chordId: 'Eb7' }, { roman: 'vi', chordId: 'Fm' },
    ],
  },
  DB_MAJOR: {
    id: 'DB_MAJOR', label: 'D♭ Major', mode: 'major', keySignature: 'DB_MAJOR',
    chords: [
      { roman: 'I', chordId: 'Db' }, { roman: 'ii', chordId: 'Ebm' }, { roman: 'iii', chordId: 'Fm' },
      { roman: 'IV', chordId: 'F#' }, { roman: 'V', chordId: 'Ab' }, { roman: 'V7', chordId: 'Ab7' }, { roman: 'vi', chordId: 'Bbm' },
    ],
  },

  // 12 Minor Scales (Natural + Harmonic Minor Dominant V / V7)
  A_MINOR: {
    id: 'A_MINOR', label: 'A Minor', mode: 'minor', keySignature: 'C_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Am' }, { roman: 'III', chordId: 'C' }, { roman: 'iv', chordId: 'Dm' },
      { roman: 'V', chordId: 'E' }, { roman: 'V7', chordId: 'E7' }, { roman: 'VI', chordId: 'F' }, { roman: 'VII', chordId: 'G' },
    ],
  },
  E_MINOR: {
    id: 'E_MINOR', label: 'E Minor', mode: 'minor', keySignature: 'G_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Em' }, { roman: 'III', chordId: 'G' }, { roman: 'iv', chordId: 'Am' },
      { roman: 'V', chordId: 'B' }, { roman: 'V7', chordId: 'B7' }, { roman: 'VI', chordId: 'C' }, { roman: 'VII', chordId: 'D' },
    ],
  },
  B_MINOR: {
    id: 'B_MINOR', label: 'B Minor', mode: 'minor', keySignature: 'D_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Bm' }, { roman: 'III', chordId: 'D' }, { roman: 'iv', chordId: 'Em' },
      { roman: 'V', chordId: 'F#' }, { roman: 'V7', chordId: 'F#7' }, { roman: 'VI', chordId: 'G' }, { roman: 'VII', chordId: 'A' },
    ],
  },
  FS_MINOR: {
    id: 'FS_MINOR', label: 'F♯ Minor', mode: 'minor', keySignature: 'A_MAJOR',
    chords: [
      { roman: 'i', chordId: 'F#m' }, { roman: 'III', chordId: 'A' }, { roman: 'iv', chordId: 'Bm' },
      { roman: 'V', chordId: 'Db' }, { roman: 'V7', chordId: 'Db7' }, { roman: 'VI', chordId: 'D' }, { roman: 'VII', chordId: 'E' },
    ],
  },
  CS_MINOR: {
    id: 'CS_MINOR', label: 'C♯ Minor', mode: 'minor', keySignature: 'E_MAJOR',
    chords: [
      { roman: 'i', chordId: 'C#m' }, { roman: 'III', chordId: 'E' }, { roman: 'iv', chordId: 'F#m' },
      { roman: 'V', chordId: 'Ab' }, { roman: 'V7', chordId: 'Ab7' }, { roman: 'VI', chordId: 'A' }, { roman: 'VII', chordId: 'B' },
    ],
  },
  GS_MINOR: {
    id: 'GS_MINOR', label: 'G♯ Minor', mode: 'minor', keySignature: 'B_MAJOR',
    chords: [
      { roman: 'i', chordId: 'G#m' }, { roman: 'III', chordId: 'B' }, { roman: 'iv', chordId: 'C#m' },
      { roman: 'V', chordId: 'Eb' }, { roman: 'V7', chordId: 'Eb7' }, { roman: 'VI', chordId: 'E' }, { roman: 'VII', chordId: 'F#' },
    ],
  },
  D_MINOR: {
    id: 'D_MINOR', label: 'D Minor', mode: 'minor', keySignature: 'F_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Dm' }, { roman: 'III', chordId: 'F' }, { roman: 'iv', chordId: 'Gm' },
      { roman: 'V', chordId: 'A' }, { roman: 'V7', chordId: 'A7' }, { roman: 'VI', chordId: 'Bb' }, { roman: 'VII', chordId: 'C' },
    ],
  },
  G_MINOR: {
    id: 'G_MINOR', label: 'G Minor', mode: 'minor', keySignature: 'BB_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Gm' }, { roman: 'III', chordId: 'Bb' }, { roman: 'iv', chordId: 'Cm' },
      { roman: 'V', chordId: 'D' }, { roman: 'V7', chordId: 'D7' }, { roman: 'VI', chordId: 'Eb' }, { roman: 'VII', chordId: 'F' },
    ],
  },
  C_MINOR: {
    id: 'C_MINOR', label: 'C Minor', mode: 'minor', keySignature: 'EB_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Cm' }, { roman: 'III', chordId: 'Eb' }, { roman: 'iv', chordId: 'Fm' },
      { roman: 'V', chordId: 'G' }, { roman: 'V7', chordId: 'G7' }, { roman: 'VI', chordId: 'Ab' }, { roman: 'VII', chordId: 'Bb' },
    ],
  },
  F_MINOR: {
    id: 'F_MINOR', label: 'F Minor', mode: 'minor', keySignature: 'AB_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Fm' }, { roman: 'III', chordId: 'Ab' }, { roman: 'iv', chordId: 'Bbm' },
      { roman: 'V', chordId: 'C' }, { roman: 'V7', chordId: 'C7' }, { roman: 'VI', chordId: 'Db' }, { roman: 'VII', chordId: 'Eb' },
    ],
  },
  BB_MINOR: {
    id: 'BB_MINOR', label: 'B♭ Minor', mode: 'minor', keySignature: 'DB_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Bbm' }, { roman: 'III', chordId: 'Db' }, { roman: 'iv', chordId: 'Ebm' },
      { roman: 'V', chordId: 'F' }, { roman: 'V7', chordId: 'F7' }, { roman: 'VI', chordId: 'F#' }, { roman: 'VII', chordId: 'Ab' },
    ],
  },
  EB_MINOR: {
    id: 'EB_MINOR', label: 'E♭ Minor', mode: 'minor', keySignature: 'FS_MAJOR',
    chords: [
      { roman: 'i', chordId: 'Ebm' }, { roman: 'III', chordId: 'F#' }, { roman: 'iv', chordId: 'G#m' },
      { roman: 'V', chordId: 'Bb' }, { roman: 'V7', chordId: 'Bb7' }, { roman: 'VI', chordId: 'B' }, { roman: 'VII', chordId: 'Db' },
    ],
  },
};

export const ALL_ROMAN_KEY_IDS: readonly ChordNamingKeyId[] = Object.keys(
  ROMAN_SCALE_SPECS
) as ChordNamingKeyId[];

export const DIATONIC_ROMAN_CHORDS: Record<ChordNamingKeyId, readonly DiatonicFunctionEntry[]> =
  Object.fromEntries(
    ALL_ROMAN_KEY_IDS.map((k) => [k, ROMAN_SCALE_SPECS[k].chords])
  ) as Record<ChordNamingKeyId, readonly DiatonicFunctionEntry[]>;

const INVERSION_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: 'Root position',
  1: '1st inversion',
  2: '2nd inversion',
  3: '3rd inversion',
};

function buildToneStack(
  tones: readonly ChordToneSpelling[],
  clef: 'treble' | 'bass',
  keySignature: KeySignatureId
): RenderedChordNote[] {
  const idealCenter = clef === 'treble' ? 69 : 51;
  const candidateOctaves = clef === 'treble' ? [3, 4, 5] : [2, 3];

  let bestStack: { midi: number; letter: LetterName; accidental: Accidental; octave: number }[] = [];
  let bestScore = Infinity;

  for (const startOctave of candidateOctaves) {
    const stack: { midi: number; letter: LetterName; accidental: Accidental; octave: number }[] = [];
    let prevMidi = -1;

    for (const tone of tones) {
      let oct = startOctave;
      let midi = (oct + 1) * 12 + LETTER_SEMITONE[tone.letter] + tone.accidental;
      while (prevMidi !== -1 && midi <= prevMidi) {
        oct += 1;
        midi = (oct + 1) * 12 + LETTER_SEMITONE[tone.letter] + tone.accidental;
      }
      stack.push({ midi, letter: tone.letter, accidental: tone.accidental, octave: oct });
      prevMidi = midi;
    }

    const avgMidi = stack.reduce((sum, n) => sum + n.midi, 0) / stack.length;
    const minMidi = stack[0]!.midi;
    const maxMidi = stack[stack.length - 1]!.midi;

    let penalty = Math.abs(avgMidi - idealCenter);
    if (clef === 'treble') {
      if (minMidi < 57) penalty += 20;
      if (maxMidi > 81) penalty += 20;
    } else {
      if (minMidi < 40) penalty += 20;
      if (maxMidi > 64) penalty += 20;
    }

    if (penalty < bestScore) {
      bestScore = penalty;
      bestStack = stack;
    }
  }

  const keySigSpec = KEY_SIGNATURES[keySignature];
  const baseDiatonicStep = clef === 'treble' ? 4 * 7 + 2 : 2 * 7 + 4;

  return bestStack.map((n) => {
    const diatonicStep = n.octave * 7 + LETTER_INDEX[n.letter];
    const stepOffset = diatonicStep - baseDiatonicStep;
    const keyAcc: Accidental = keySigSpec.alteredLetters[n.letter] ?? 0;

    let displayAccidental: 'sharp' | 'flat' | 'natural' | null = null;
    if (n.accidental !== keyAcc) {
      if (n.accidental === 1) displayAccidental = 'sharp';
      else if (n.accidental === -1) displayAccidental = 'flat';
      else displayAccidental = 'natural';
    }

    return {
      midi: n.midi,
      letter: n.letter,
      accidental: n.accidental,
      octave: n.octave,
      diatonicStep,
      stepOffset,
      displayAccidental,
      slot: 0,
      clef,
    };
  });
}

function pickTexture(clefMode: ChordNamingClefMode, rng: () => number): ChordTextureKind {
  const r = rng();
  if (clefMode === 'both') {
    if (r < 0.38) return 'block';
    if (r < 0.54) return 'arpeggio_up';
    if (r < 0.64) return 'arpeggio_down';
    if (r < 0.76) return 'alberti';
    if (r < 0.88) return 'bass_and_chord';
    return 'grand_staff';
  }
  if (r < 0.44) return 'block';
  if (r < 0.64) return 'arpeggio_up';
  if (r < 0.76) return 'arpeggio_down';
  if (r < 0.88) return 'alberti';
  return 'bass_and_chord';
}

function suppressRepeatedMeasureAccidentals(notes: RenderedChordNote[]): RenderedChordNote[] {
  const seenInMeasure = new Set<string>();
  return notes.map((n) => {
    const pitchKey = `${n.clef ?? 'treble'}:${n.letter}:${n.octave}:${n.accidental}`;
    if (n.displayAccidental && seenInMeasure.has(pitchKey)) {
      return { ...n, displayAccidental: null };
    }
    if (n.displayAccidental) {
      seenInMeasure.add(pitchKey);
    }
    return n;
  });
}

function buildVariedChordVoicing(
  spec: NamingChordSpec,
  clef: 'treble' | 'bass',
  clefMode: ChordNamingClefMode,
  keySignature: KeySignatureId,
  rng: () => number
): {
  inversion: 0 | 1 | 2 | 3;
  bassSpelling: ChordToneSpelling;
  texture: ChordTextureKind;
  omittedFifth: boolean;
  notes: RenderedChordNote[];
} {
  // For 4-note 7th chords (dom7, maj7, min7), frequently omit the 5th (realistic piano shell voicing)
  const canOmitFifth = spec.tones.length === 4;
  const omittedFifth = canOmitFifth && rng() < 0.45;
  const activeTones: readonly ChordToneSpelling[] = omittedFifth
    ? [spec.tones[0]!, spec.tones[1]!, spec.tones[3]!]
    : spec.tones;

  // Keep sus2/sus4 in root position so Csus2 isn't enharmonically identical to Gsus4
  const maxInv =
    spec.quality === 'sus2' || spec.quality === 'sus4' ? 1 : activeTones.length;
  const invIdx = Math.floor(rng() * maxInv) as 0 | 1 | 2 | 3;
  const bassSpelling = activeTones[invIdx]!;

  const rotated: ChordToneSpelling[] = [];
  for (let i = 0; i < activeTones.length; i++) {
    rotated.push(activeTones[(invIdx + i) % activeTones.length]!);
  }

  const texture = pickTexture(clefMode, rng);

  if (texture === 'grand_staff') {
    const bassNote = buildToneStack([rotated[0]!], 'bass', keySignature)[0]!;
    const upperNotes = buildToneStack(rotated.slice(1), 'treble', keySignature);
    const brokenSplit = rng() < 0.5;
    const combined: RenderedChordNote[] = [
      { ...bassNote, slot: 0, clef: 'bass' },
      ...upperNotes.map((n) => ({ ...n, slot: brokenSplit ? 1 : 0, clef: 'treble' as const })),
    ];
    return {
      inversion: invIdx,
      bassSpelling,
      texture,
      omittedFifth,
      notes: suppressRepeatedMeasureAccidentals(combined),
    };
  }

  const baseStack = buildToneStack(rotated, clef, keySignature);

  let arranged: RenderedChordNote[];
  if (texture === 'block') {
    arranged = baseStack.map((n) => ({ ...n, slot: 0 }));
  } else if (texture === 'arpeggio_up') {
    arranged = baseStack.map((n, idx) => ({ ...n, slot: idx }));
  } else if (texture === 'arpeggio_down') {
    arranged = [...baseStack].reverse().map((n, idx) => ({ ...n, slot: idx }));
  } else if (texture === 'alberti') {
    if (baseStack.length === 3) {
      // Classic piano Alberti pattern: low -> high -> mid -> high
      arranged = [
        { ...baseStack[0]!, slot: 0 },
        { ...baseStack[2]!, slot: 1 },
        { ...baseStack[1]!, slot: 2 },
        { ...baseStack[2]!, slot: 3 },
      ];
    } else {
      // 4-note broken zig-zag: 0 -> 2 -> 1 -> 3
      arranged = [
        { ...baseStack[0]!, slot: 0 },
        { ...baseStack[2]!, slot: 1 },
        { ...baseStack[1]!, slot: 2 },
        { ...baseStack[3]!, slot: 3 },
      ];
    }
  } else {
    // 'bass_and_chord': bass note on slot 0, upper chord tones stacked on slot 1
    arranged = [
      { ...baseStack[0]!, slot: 0 },
      ...baseStack.slice(1).map((n) => ({ ...n, slot: 1 })),
    ];
  }

  return {
    inversion: invIdx,
    bassSpelling,
    texture,
    omittedFifth,
    notes: suppressRepeatedMeasureAccidentals(arranged),
  };
}

export function generateChordNamingDrill(
  config: ChordNamingConfig,
  rng: () => number = Math.random
): ChordNamingPrompt[] {
  const prompts: ChordNamingPrompt[] = [];
  let prevKey = '';

  for (let i = 0; i < config.totalChords; i++) {
    const clef: 'treble' | 'bass' =
      config.clefMode === 'both'
        ? rng() < 0.5
          ? 'treble'
          : 'bass'
        : config.clefMode;

    let chordId: string;
    let romanNumeral: string | undefined;
    let keySignature: KeySignatureId;

    if (config.answerMode === 'roman_numeral') {
      const entries = DIATONIC_ROMAN_CHORDS[config.fixedKey];
      let picked = entries[Math.floor(rng() * entries.length)]!;
      if (entries.length > 1 && `${picked.roman}:${clef}` === prevKey) {
        picked = entries[(entries.indexOf(picked) + 1 + Math.floor(rng() * (entries.length - 1))) % entries.length]!;
      }
      chordId = picked.chordId;
      romanNumeral = picked.roman;
      keySignature = ROMAN_SCALE_SPECS[config.fixedKey].keySignature;
      prevKey = `${picked.roman}:${clef}`;
    } else {
      const pool = CHORD_NAMING_POOLS[config.poolId];
      let pickedId = pool[Math.floor(rng() * pool.length)]!;
      if (pool.length > 1 && `${pickedId}:${clef}` === prevKey) {
        pickedId = pool[(pool.indexOf(pickedId) + 1 + Math.floor(rng() * (pool.length - 1))) % pool.length]!;
      }
      chordId = pickedId;
      keySignature = 'C_MAJOR';
      prevKey = `${pickedId}:${clef}`;
    }

    const spec = NAMING_CHORD_SPECS[chordId]!;
    const voicing = buildVariedChordVoicing(spec, clef, config.clefMode, keySignature, rng);

    prompts.push({
      index: i,
      clef,
      keySignature,
      chordId,
      quality: spec.quality,
      inversion: voicing.inversion,
      inversionLabel: INVERSION_LABELS[voicing.inversion],
      bassSpelling: voicing.bassSpelling,
      romanNumeral,
      texture: voicing.texture,
      omittedFifth: voicing.omittedFifth,
      notes: voicing.notes,
    });
  }

  return prompts;
}

function formatToneSpelling(
  spelling: ChordToneSpelling,
  notation: ChordNotationSystem
): string {
  const accStr = spelling.accidental === 1 ? '#' : spelling.accidental === -1 ? 'b' : '';
  const intl = `${spelling.letter}${accStr}`;
  return notation === 'german' ? convertToGermanNotation(intl) : intl;
}

function normalizeNoteToken(rawToken: string, notation: ChordNotationSystem): string | null {
  const token = rawToken
    .trim()
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .toLowerCase();

  const match = token.match(/^([a-h])(#|b)?$/);
  if (!match) return null;

  const letter = match[1]!;
  const acc = match[2] ?? '';

  if (notation === 'german') {
    if (letter === 'h' && acc === '') return 'B';
    if (letter === 'h' && acc === 'b') return 'Bb';
    if (letter === 'b' && acc === '') return 'Bb';
    if (letter === 'b' && acc === 'b') return 'Bb';
    if (letter === 'h' && acc === '#') return null;
  } else {
    if (letter === 'h') return null;
  }

  const upper = letter.toUpperCase();
  const ENHARMONIC_CANONICAL: Record<string, string> = {
    'C#': 'C#',
    Db: 'C#',
    'D#': 'Eb',
    Eb: 'Eb',
    'F#': 'F#',
    Gb: 'F#',
    'G#': 'G#',
    Ab: 'G#',
    'A#': 'Bb',
    Bb: 'Bb',
  };

  const combined = `${upper}${acc}`;
  return ENHARMONIC_CANONICAL[combined] ?? combined;
}

interface ParsedChordAnswer {
  readonly root: string;
  readonly quality: ChordQuality;
  readonly bass?: string;
}

function parseChordAnswer(
  rawInput: string,
  notation: ChordNotationSystem
): ParsedChordAnswer | null {
  const cleaned = rawInput
    .trim()
    .replace(/\s+/g, '')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/Δ/g, 'maj')
    .replace(/°/g, 'dim');

  if (!cleaned) return null;

  const parts = cleaned.split('/');
  if (parts.length > 2) return null;

  const mainPart = parts[0]!;
  const bassPart = parts[1];

  const mainMatch = mainPart.match(/^([a-hA-H][#b]?)(.*)$/);
  if (!mainMatch) return null;

  const root = normalizeNoteToken(mainMatch[1]!, notation);
  if (!root) return null;

  const suffix = mainMatch[2]!.toLowerCase();
  let quality: ChordQuality | null = null;

  if (suffix === '' || suffix === 'maj' || suffix === 'dur') {
    quality = 'major';
  } else if (suffix === 'm' || suffix === 'min' || suffix === '-' || suffix === 'moll') {
    quality = 'minor';
  } else if (suffix === '7' || suffix === 'dom7') {
    quality = 'dominant7';
  } else if (suffix === 'maj7' || suffix === 'ma7' || suffix === 'j7') {
    quality = 'major7';
  } else if (suffix === 'm7' || suffix === 'min7' || suffix === '-7') {
    quality = 'minor7';
  } else if (suffix === 'dim' || suffix === 'o') {
    quality = 'diminished';
  } else if (suffix === 'sus2') {
    quality = 'sus2';
  } else if (suffix === 'sus4' || suffix === 'sus') {
    quality = 'sus4';
  } else {
    return null;
  }

  let bass: string | undefined;
  if (bassPart !== undefined) {
    if (bassPart === '') return null;
    const normalizedBass = normalizeNoteToken(bassPart, notation);
    if (!normalizedBass) return null;
    bass = normalizedBass;
  }

  return { root, quality, bass };
}

export function evaluateChordNamingAnswer(
  rawInput: string,
  prompt: ChordNamingPrompt,
  answerMode: ChordNamingAnswerMode,
  notation: ChordNotationSystem = 'international'
): boolean {
  const trimmed = rawInput.trim();
  if (!trimmed) return false;

  if (answerMode === 'roman_numeral') {
    if (!prompt.romanNumeral) return false;
    const normalizedInput = trimmed.replace(/\s+/g, '').toLowerCase();
    const expected = prompt.romanNumeral.toLowerCase();
    return normalizedInput === expected;
  }

  const parsed = parseChordAnswer(trimmed, notation);
  if (!parsed) return false;

  const spec = NAMING_CHORD_SPECS[prompt.chordId]!;
  const expectedRoot = normalizeNoteToken(
    `${spec.rootLetter}${spec.rootAccidental === 1 ? '#' : spec.rootAccidental === -1 ? 'b' : ''}`,
    'international'
  );

  if (parsed.root !== expectedRoot || parsed.quality !== spec.quality) {
    return false;
  }

  if (parsed.bass !== undefined) {
    const expectedBass = normalizeNoteToken(
      `${prompt.bassSpelling.letter}${prompt.bassSpelling.accidental === 1 ? '#' : prompt.bassSpelling.accidental === -1 ? 'b' : ''}`,
      'international'
    );
    if (parsed.bass !== expectedBass) {
      return false;
    }
  }

  return true;
}

export interface AdaptiveItemStats {
  streak: number;
  urgency: number;
  attempts: number;
  misses: number;
  avgMs: number;
}

export interface PersistedAdaptiveNamingState {
  readonly unlockedChordCount: number;
  readonly unlockedRomanCount: number;
  readonly statsByKey: Record<string, AdaptiveItemStats>;
}

export const INITIAL_ADAPTIVE_NAMING_STATE: PersistedAdaptiveNamingState = {
  unlockedChordCount: 3, // Starts with C, F, G
  unlockedRomanCount: 3, // Starts with I, IV, V
  statsByKey: {},
};

/**
 * Adaptive spaced-repetition + gradual level-up scheduler for Name the Chord mode.
 * - Starts with the top 3 highest-ROI chords (C, F, G or I, IV, V).
 * - Boosts urgency on misses (+6.0) and slow answers (+2.0 if > 5s), decays on clean hits (x0.65).
 * - Dampens immediate back-to-back repeats so missed chords return after a 2-card recall gap.
 * - Automatically unlocks the next highest-ROI chord when all currently unlocked chords are comfortable
 *   (streak >= 2 and urgency <= 1.5).
 */
export class AdaptiveNamingScheduler {
  private readonly config: ChordNamingConfig;
  private readonly rng: () => number;
  private readonly fullPool: readonly string[];
  private readonly isAdaptive: boolean;

  private unlockedCount: number;
  private readonly stats: Map<string, AdaptiveItemStats> = new Map();
  private lastKey: string | null = null;
  private secondLastKey: string | null = null;
  private promptCounter = 0;

  constructor(
    config: ChordNamingConfig,
    persisted?: PersistedAdaptiveNamingState | null,
    rng: () => number = Math.random
  ) {
    this.config = config;
    this.rng = rng;
    this.isAdaptive = config.answerMode === 'roman_numeral' || config.poolId === 'adaptive';

    if (config.answerMode === 'roman_numeral') {
      const romanLadder =
        ROMAN_SCALE_SPECS[config.fixedKey].mode === 'minor'
          ? ADAPTIVE_MINOR_ROMAN_LADDER
          : ADAPTIVE_ROMAN_LADDER;
      this.fullPool = romanLadder;
      this.unlockedCount = Math.max(
        3,
        Math.min(
          romanLadder.length,
          persisted?.unlockedRomanCount ?? INITIAL_ADAPTIVE_NAMING_STATE.unlockedRomanCount
        )
      );
    } else if (config.poolId === 'adaptive') {
      this.fullPool = ADAPTIVE_CHORD_LADDER;
      this.unlockedCount = Math.max(
        3,
        Math.min(
          ADAPTIVE_CHORD_LADDER.length,
          persisted?.unlockedChordCount ?? INITIAL_ADAPTIVE_NAMING_STATE.unlockedChordCount
        )
      );
    } else {
      this.fullPool = CHORD_NAMING_POOLS[config.poolId];
      this.unlockedCount = this.fullPool.length;
    }

    if (persisted?.statsByKey) {
      for (const [key, st] of Object.entries(persisted.statsByKey)) {
        this.stats.set(key, { ...st });
      }
    }

    for (const key of this.getActiveKeys()) {
      if (!this.stats.has(key)) {
        this.stats.set(key, { streak: 0, urgency: 1.0, attempts: 0, misses: 0, avgMs: 0 });
      }
    }
  }

  public getActiveKeys(): readonly string[] {
    return this.fullPool.slice(0, this.unlockedCount);
  }

  public getUnlockedCount(): number {
    return this.unlockedCount;
  }

  public getTotalPoolSize(): number {
    return this.fullPool.length;
  }

  public getStats(key: string): AdaptiveItemStats {
    return this.stats.get(key) ?? { streak: 0, urgency: 0, attempts: 0, misses: 0, avgMs: 0 };
  }

  public sampleNextPrompt(): ChordNamingPrompt {
    const activeKeys = this.getActiveKeys();
    const weights: number[] = [];
    let totalWeight = 0;

    for (const key of activeKeys) {
      const st = this.getStats(key);
      // Mastered items fade gently to 0.45 baseline so new/weak chords get priority
      const baseline = st.streak >= 3 && st.urgency < 0.5 ? 0.45 : 1.0;
      let recencyFactor = 1.0;
      if (activeKeys.length > 2 && key === this.lastKey) {
        recencyFactor = 0.04;
      } else if (activeKeys.length > 2 && key === this.secondLastKey) {
        recencyFactor = 0.35;
      } else if (activeKeys.length === 2 && key === this.lastKey) {
        recencyFactor = 0.2;
      }

      const w = (baseline + st.urgency) * recencyFactor;
      weights.push(w);
      totalWeight += w;
    }

    let r = this.rng() * totalWeight;
    let chosenKey = activeKeys[activeKeys.length - 1]!;
    for (let i = 0; i < activeKeys.length; i++) {
      if (r <= weights[i]!) {
        chosenKey = activeKeys[i]!;
        break;
      }
      r -= weights[i]!;
    }

    this.secondLastKey = this.lastKey;
    this.lastKey = chosenKey;

    const clef: 'treble' | 'bass' =
      this.config.clefMode === 'both'
        ? this.rng() < 0.5
          ? 'treble'
          : 'bass'
        : this.config.clefMode;

    let chordId: string;
    let romanNumeral: string | undefined;
    let keySignature: KeySignatureId;

    if (this.config.answerMode === 'roman_numeral') {
      const entry = DIATONIC_ROMAN_CHORDS[this.config.fixedKey].find((e) => e.roman === chosenKey)!;
      chordId = entry.chordId;
      romanNumeral = entry.roman;
      keySignature = ROMAN_SCALE_SPECS[this.config.fixedKey].keySignature;
    } else {
      chordId = chosenKey;
      keySignature = 'C_MAJOR';
    }

    const spec = NAMING_CHORD_SPECS[chordId]!;
    const voicing = buildVariedChordVoicing(
      spec,
      clef,
      this.config.clefMode,
      keySignature,
      this.rng
    );

    return {
      index: this.promptCounter++,
      clef,
      keySignature,
      chordId,
      quality: spec.quality,
      inversion: voicing.inversion,
      inversionLabel: INVERSION_LABELS[voicing.inversion],
      bassSpelling: voicing.bassSpelling,
      romanNumeral,
      texture: voicing.texture,
      omittedFifth: voicing.omittedFifth,
      notes: voicing.notes,
    };
  }

  public recordResult(
    prompt: ChordNamingPrompt,
    params: { firstTry: boolean; elapsedMs: number }
  ): { newlyUnlockedId: string | null } {
    const key =
      this.config.answerMode === 'roman_numeral' && prompt.romanNumeral
        ? prompt.romanNumeral
        : prompt.chordId;

    const prev = this.getStats(key);
    const next: AdaptiveItemStats = { ...prev };
    next.attempts += 1;
    next.avgMs =
      prev.avgMs === 0 ? params.elapsedMs : prev.avgMs * 0.65 + params.elapsedMs * 0.35;

    if (!params.firstTry) {
      next.streak = 0;
      next.misses += 1;
      next.urgency = Math.min(18.0, prev.urgency + 6.0);
    } else if (params.elapsedMs > 5000) {
      // Correct on first try, but hesitant -> gentle urgency boost
      next.streak += 1;
      next.urgency = Math.min(18.0, prev.urgency + 2.0);
    } else {
      next.streak += 1;
      const decayed = prev.urgency * 0.65;
      next.urgency = decayed < 0.1 ? 0 : decayed;
    }

    this.stats.set(key, next);

    // Check if we should unlock the next highest-ROI chord in the ladder
    let newlyUnlockedId: string | null = null;
    if (this.isAdaptive && this.unlockedCount < this.fullPool.length) {
      const activeKeys = this.getActiveKeys();
      const allComfortable = activeKeys.every((k) => {
        const s = this.getStats(k);
        return s.streak >= 2 && s.urgency <= 1.5;
      });

      if (allComfortable) {
        const unlockedKey = this.fullPool[this.unlockedCount]!;
        this.unlockedCount += 1;
        this.stats.set(unlockedKey, {
          streak: 0,
          urgency: 5.0, // Prioritize the newly unlocked chord right away
          attempts: 0,
          misses: 0,
          avgMs: 0,
        });
        newlyUnlockedId = unlockedKey;
      }
    }

    return { newlyUnlockedId };
  }

  public getWeakSpots(limit = 3): { key: string; misses: number; avgSec: number }[] {
    const entries: { key: string; misses: number; avgSec: number; score: number }[] = [];
    for (const key of this.getActiveKeys()) {
      const st = this.getStats(key);
      if (st.attempts === 0) continue;
      const avgSec = st.avgMs / 1000;
      const score = st.misses * 4 + (avgSec > 3 ? avgSec - 3 : 0);
      if (st.misses > 0 || avgSec > 4.0) {
        entries.push({ key, misses: st.misses, avgSec, score });
      }
    }
    return entries
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ key, misses, avgSec }) => ({ key, misses, avgSec }));
  }

  public toPersistedState(
    previous?: PersistedAdaptiveNamingState | null
  ): PersistedAdaptiveNamingState {
    const mergedStats: Record<string, AdaptiveItemStats> = {
      ...(previous?.statsByKey ?? {}),
    };
    for (const [k, v] of this.stats.entries()) {
      mergedStats[k] = { ...v };
    }

    return {
      unlockedChordCount:
        this.config.answerMode === 'chord_name' && this.config.poolId === 'adaptive'
          ? this.unlockedCount
          : previous?.unlockedChordCount ?? INITIAL_ADAPTIVE_NAMING_STATE.unlockedChordCount,
      unlockedRomanCount:
        this.config.answerMode === 'roman_numeral'
          ? this.unlockedCount
          : previous?.unlockedRomanCount ?? INITIAL_ADAPTIVE_NAMING_STATE.unlockedRomanCount,
      statsByKey: mergedStats,
    };
  }
}

export function formatPromptCanonicalAnswer(
  prompt: ChordNamingPrompt,
  answerMode: ChordNamingAnswerMode,
  notation: ChordNotationSystem = 'international'
): string {
  const chordLabel = formatChordLabel(prompt.chordId, notation);
  if (answerMode === 'roman_numeral' && prompt.romanNumeral) {
    return `${prompt.romanNumeral} (${chordLabel})`;
  }
  if (prompt.inversion > 0) {
    const bassLabel = formatToneSpelling(prompt.bassSpelling, notation);
    return `${chordLabel} (${chordLabel}/${bassLabel})`;
  }
  return chordLabel;
}
