import { LETTER_INDEX, LETTER_SEMITONE } from '../music/pitch';
import { KEY_SIGNATURES, KeySignatureId } from '../music/scales';
import { ChordNotationSystem, ChordQuality } from '../types/chord';
import { Accidental, LetterName } from '../types/music';
import { convertToGermanNotation, formatChordLabel } from './chords';

export type ChordNamingAnswerMode = 'chord_name' | 'roman_numeral';
export type ChordNamingClefMode = 'treble' | 'bass' | 'both';
export type ChordNamingPoolId = 'core_triads' | 'triads_and_dom7' | 'all_chords';
export type ChordNamingKeyId = 'C_MAJOR' | 'G_MAJOR' | 'F_MAJOR' | 'D_MAJOR';

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
  poolId: 'core_triads',
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

export interface RenderedChordNote {
  readonly midi: number;
  readonly letter: LetterName;
  readonly accidental: Accidental;
  readonly octave: number;
  readonly diatonicStep: number;
  readonly stepOffset: number;
  /** Accidental glyph to draw on the staff relative to the active key signature */
  readonly displayAccidental: 'sharp' | 'flat' | 'natural' | null;
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
  readonly notes: readonly RenderedChordNote[];
}

export const NAMING_CHORD_SPECS: Record<string, NamingChordSpec> = {
  // Core Major Triads
  C: {
    id: 'C',
    rootLetter: 'C',
    rootAccidental: 0,
    quality: 'major',
    tones: [
      { letter: 'C', accidental: 0 },
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 0 },
    ],
  },
  F: {
    id: 'F',
    rootLetter: 'F',
    rootAccidental: 0,
    quality: 'major',
    tones: [
      { letter: 'F', accidental: 0 },
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 0 },
    ],
  },
  G: {
    id: 'G',
    rootLetter: 'G',
    rootAccidental: 0,
    quality: 'major',
    tones: [
      { letter: 'G', accidental: 0 },
      { letter: 'B', accidental: 0 },
      { letter: 'D', accidental: 0 },
    ],
  },
  D: {
    id: 'D',
    rootLetter: 'D',
    rootAccidental: 0,
    quality: 'major',
    tones: [
      { letter: 'D', accidental: 0 },
      { letter: 'F', accidental: 1 },
      { letter: 'A', accidental: 0 },
    ],
  },
  A: {
    id: 'A',
    rootLetter: 'A',
    rootAccidental: 0,
    quality: 'major',
    tones: [
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 1 },
      { letter: 'E', accidental: 0 },
    ],
  },
  E: {
    id: 'E',
    rootLetter: 'E',
    rootAccidental: 0,
    quality: 'major',
    tones: [
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 1 },
      { letter: 'B', accidental: 0 },
    ],
  },
  Bb: {
    id: 'Bb',
    rootLetter: 'B',
    rootAccidental: -1,
    quality: 'major',
    tones: [
      { letter: 'B', accidental: -1 },
      { letter: 'D', accidental: 0 },
      { letter: 'F', accidental: 0 },
    ],
  },

  // Core Minor Triads
  Am: {
    id: 'Am',
    rootLetter: 'A',
    rootAccidental: 0,
    quality: 'minor',
    tones: [
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 0 },
      { letter: 'E', accidental: 0 },
    ],
  },
  Dm: {
    id: 'Dm',
    rootLetter: 'D',
    rootAccidental: 0,
    quality: 'minor',
    tones: [
      { letter: 'D', accidental: 0 },
      { letter: 'F', accidental: 0 },
      { letter: 'A', accidental: 0 },
    ],
  },
  Em: {
    id: 'Em',
    rootLetter: 'E',
    rootAccidental: 0,
    quality: 'minor',
    tones: [
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 0 },
      { letter: 'B', accidental: 0 },
    ],
  },
  Gm: {
    id: 'Gm',
    rootLetter: 'G',
    rootAccidental: 0,
    quality: 'minor',
    tones: [
      { letter: 'G', accidental: 0 },
      { letter: 'B', accidental: -1 },
      { letter: 'D', accidental: 0 },
    ],
  },
  Bm: {
    id: 'Bm',
    rootLetter: 'B',
    rootAccidental: 0,
    quality: 'minor',
    tones: [
      { letter: 'B', accidental: 0 },
      { letter: 'D', accidental: 0 },
      { letter: 'F', accidental: 1 },
    ],
  },
  'F#m': {
    id: 'F#m',
    rootLetter: 'F',
    rootAccidental: 1,
    quality: 'minor',
    tones: [
      { letter: 'F', accidental: 1 },
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 1 },
    ],
  },

  // Dominant 7ths
  G7: {
    id: 'G7',
    rootLetter: 'G',
    rootAccidental: 0,
    quality: 'dominant7',
    tones: [
      { letter: 'G', accidental: 0 },
      { letter: 'B', accidental: 0 },
      { letter: 'D', accidental: 0 },
      { letter: 'F', accidental: 0 },
    ],
  },
  D7: {
    id: 'D7',
    rootLetter: 'D',
    rootAccidental: 0,
    quality: 'dominant7',
    tones: [
      { letter: 'D', accidental: 0 },
      { letter: 'F', accidental: 1 },
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 0 },
    ],
  },
  C7: {
    id: 'C7',
    rootLetter: 'C',
    rootAccidental: 0,
    quality: 'dominant7',
    tones: [
      { letter: 'C', accidental: 0 },
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 0 },
      { letter: 'B', accidental: -1 },
    ],
  },
  A7: {
    id: 'A7',
    rootLetter: 'A',
    rootAccidental: 0,
    quality: 'dominant7',
    tones: [
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 1 },
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 0 },
    ],
  },
  E7: {
    id: 'E7',
    rootLetter: 'E',
    rootAccidental: 0,
    quality: 'dominant7',
    tones: [
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 1 },
      { letter: 'B', accidental: 0 },
      { letter: 'D', accidental: 0 },
    ],
  },

  // Major 7th & Minor 7th Chords
  Cmaj7: {
    id: 'Cmaj7',
    rootLetter: 'C',
    rootAccidental: 0,
    quality: 'major7',
    tones: [
      { letter: 'C', accidental: 0 },
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 0 },
      { letter: 'B', accidental: 0 },
    ],
  },
  Fmaj7: {
    id: 'Fmaj7',
    rootLetter: 'F',
    rootAccidental: 0,
    quality: 'major7',
    tones: [
      { letter: 'F', accidental: 0 },
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 0 },
      { letter: 'E', accidental: 0 },
    ],
  },
  Dm7: {
    id: 'Dm7',
    rootLetter: 'D',
    rootAccidental: 0,
    quality: 'minor7',
    tones: [
      { letter: 'D', accidental: 0 },
      { letter: 'F', accidental: 0 },
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 0 },
    ],
  },
  Am7: {
    id: 'Am7',
    rootLetter: 'A',
    rootAccidental: 0,
    quality: 'minor7',
    tones: [
      { letter: 'A', accidental: 0 },
      { letter: 'C', accidental: 0 },
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 0 },
    ],
  },
  Em7: {
    id: 'Em7',
    rootLetter: 'E',
    rootAccidental: 0,
    quality: 'minor7',
    tones: [
      { letter: 'E', accidental: 0 },
      { letter: 'G', accidental: 0 },
      { letter: 'B', accidental: 0 },
      { letter: 'D', accidental: 0 },
    ],
  },
};

export const CHORD_NAMING_POOLS: Record<ChordNamingPoolId, readonly string[]> = {
  core_triads: ['C', 'F', 'G', 'D', 'A', 'Bb', 'Am', 'Dm', 'Em', 'Gm', 'Bm'],
  triads_and_dom7: ['C', 'F', 'G', 'D', 'A', 'Bb', 'Am', 'Dm', 'Em', 'Gm', 'Bm', 'G7', 'D7', 'C7', 'A7', 'E7'],
  all_chords: [
    'C', 'F', 'G', 'D', 'A', 'Bb', 'Am', 'Dm', 'Em', 'Gm', 'Bm',
    'G7', 'D7', 'C7', 'A7', 'E7',
    'Cmaj7', 'Fmaj7', 'Dm7', 'Am7', 'Em7',
  ],
};

export interface DiatonicFunctionEntry {
  readonly roman: string;
  readonly chordId: string;
}

export const DIATONIC_ROMAN_CHORDS: Record<ChordNamingKeyId, readonly DiatonicFunctionEntry[]> = {
  C_MAJOR: [
    { roman: 'I', chordId: 'C' },
    { roman: 'ii', chordId: 'Dm' },
    { roman: 'iii', chordId: 'Em' },
    { roman: 'IV', chordId: 'F' },
    { roman: 'V', chordId: 'G' },
    { roman: 'V7', chordId: 'G7' },
    { roman: 'vi', chordId: 'Am' },
  ],
  G_MAJOR: [
    { roman: 'I', chordId: 'G' },
    { roman: 'ii', chordId: 'Am' },
    { roman: 'iii', chordId: 'Bm' },
    { roman: 'IV', chordId: 'C' },
    { roman: 'V', chordId: 'D' },
    { roman: 'V7', chordId: 'D7' },
    { roman: 'vi', chordId: 'Em' },
  ],
  F_MAJOR: [
    { roman: 'I', chordId: 'F' },
    { roman: 'ii', chordId: 'Gm' },
    { roman: 'iii', chordId: 'Am' },
    { roman: 'IV', chordId: 'Bb' },
    { roman: 'V', chordId: 'C' },
    { roman: 'V7', chordId: 'C7' },
    { roman: 'vi', chordId: 'Dm' },
  ],
  D_MAJOR: [
    { roman: 'I', chordId: 'D' },
    { roman: 'ii', chordId: 'Em' },
    { roman: 'iii', chordId: 'F#m' },
    { roman: 'IV', chordId: 'G' },
    { roman: 'V', chordId: 'A' },
    { roman: 'V7', chordId: 'A7' },
    { roman: 'vi', chordId: 'Bm' },
  ],
};

const INVERSION_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: 'Root position',
  1: '1st inversion',
  2: '2nd inversion',
  3: '3rd inversion',
};

function computeRenderedNotes(
  spec: NamingChordSpec,
  inversion: 0 | 1 | 2 | 3,
  clef: 'treble' | 'bass',
  keySignature: KeySignatureId
): RenderedChordNote[] {
  const numTones = spec.tones.length;
  const safeInv = (inversion % numTones) as 0 | 1 | 2 | 3;

  // Rotate chord tones so the bass note is at index 0
  const rotated: ChordToneSpelling[] = [];
  for (let i = 0; i < numTones; i++) {
    rotated.push(spec.tones[(safeInv + i) % numTones]!);
  }

  // Choose an octave for the lowest note so the stacked voicing sits comfortably on the staff:
  // Treble ideal center: ~69 (A4, range C4=60 to A5=81)
  // Bass ideal center: ~51 (Eb3, range F2=41 to D4=62)
  const idealCenter = clef === 'treble' ? 69 : 51;
  const candidateOctaves = clef === 'treble' ? [3, 4, 5] : [2, 3];

  let bestStack: { midi: number; letter: LetterName; accidental: Accidental; octave: number }[] = [];
  let bestScore = Infinity;

  for (const startOctave of candidateOctaves) {
    const stack: { midi: number; letter: LetterName; accidental: Accidental; octave: number }[] = [];
    let prevMidi = -1;

    for (const tone of rotated) {
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

    // Penalize out-of-comfortable-staff extremes
    let penalty = Math.abs(avgMidi - idealCenter);
    if (clef === 'treble') {
      if (minMidi < 57) penalty += 20; // below A3
      if (maxMidi > 81) penalty += 20; // above A5
    } else {
      if (minMidi < 40) penalty += 20; // below E2
      if (maxMidi > 64) penalty += 20; // above E4
    }

    if (penalty < bestScore) {
      bestScore = penalty;
      bestStack = stack;
    }
  }

  const keySigSpec = KEY_SIGNATURES[keySignature];
  const baseDiatonicStep = clef === 'treble' ? 4 * 7 + 2 : 2 * 7 + 4; // E4=30 for treble, G2=18 for bass

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
    };
  });
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
      keySignature = config.fixedKey;
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
    // Pick root position (0), 1st inversion (1), or 2nd inversion (2) (plus 3rd inv for 7th chords)
    const maxInv = spec.tones.length;
    const inversion = Math.floor(rng() * maxInv) as 0 | 1 | 2 | 3;
    const bassSpelling = spec.tones[inversion]!;
    const notes = computeRenderedNotes(spec, inversion, clef, keySignature);

    prompts.push({
      index: i,
      clef,
      keySignature,
      chordId,
      quality: spec.quality,
      inversion,
      inversionLabel: INVERSION_LABELS[inversion],
      bassSpelling,
      romanNumeral,
      notes,
    });
  }

  return prompts;
}

/**
 * Formats a tone spelling (letter + accidental) as a display string under the active notation system.
 */
function formatToneSpelling(
  spelling: ChordToneSpelling,
  notation: ChordNotationSystem
): string {
  const accStr = spelling.accidental === 1 ? '#' : spelling.accidental === -1 ? 'b' : '';
  const intl = `${spelling.letter}${accStr}`;
  return notation === 'german' ? convertToGermanNotation(intl) : intl;
}

/**
 * Normalize a single pitch token (root or bass) into canonical international pitch string, e.g. 'C', 'F#', 'Bb', 'B'.
 * Respects International (B = B natural, Bb = B-flat) vs German (H = B natural, B = B-flat).
 */
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
    if (letter === 'b' && acc === 'b') return 'Bb'; // forgive typing 'bb' even in German mode
    if (letter === 'h' && acc === '#') return null;
  } else {
    if (letter === 'h') return null;
  }

  const upper = letter.toUpperCase();
  // Normalize common enharmonics for flats/sharps? Keep exact spelling + simple enharmonic equivalence for black keys
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
  readonly root: string; // Canonical international root, e.g. 'C', 'F#', 'Bb', 'B'
  readonly quality: ChordQuality;
  readonly bass?: string; // Optional slash bass in canonical international pitch
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
    .replace(/Δ/g, 'maj');

  if (!cleaned) return null;

  const parts = cleaned.split('/');
  if (parts.length > 2) return null;

  const mainPart = parts[0]!;
  const bassPart = parts[1];

  // Match root note (letter + optional #/b) followed by quality suffix
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

/**
 * Evaluates a user's typed answer against a ChordNamingPrompt.
 * - In `chord_name` mode:
 *   - Case-insensitive (`c` -> `C`, `am` -> `Am`, `g7` -> `G7`)
 *   - Lenient on inversions: typing `C` for `C/E` or `C/G` is ACCEPTED!
 *   - If the user explicitly types a slash bass (e.g. `C/E`), it must match the lowest note on the staff.
 *   - Respects active International (`Bb/B`) vs German (`B/H`) notation.
 * - In `roman_numeral` mode:
 *   - Case-insensitive Roman numeral matching (`i`, `ii`, `iii`, `iv`, `v`, `v7`, `vi`).
 */
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

  // If user explicitly provided a slash bass, verify it matches the actual lowest note on the staff
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

/**
 * Returns the canonical display label for a prompt's answer (e.g. "C" or "C (C/E)" or "IV (F)")
 */
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
