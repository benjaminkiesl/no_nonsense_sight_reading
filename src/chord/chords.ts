import {
  CanonicalVoicing,
  ChordDefinition,
  ChordNotationSystem,
  ChordQuality,
  ChordSymbol,
  PitchClass,
} from '../types/chord';

/**
 * Modulo 12 pitch class calculation
 */
export function toPitchClass(midi: number): PitchClass {
  return (((midi % 12) + 12) % 12) as PitchClass;
}

/**
 * Helper to build a canonical voicing with sorted allMidis array
 */
export function createCanonicalVoicing(lhMidi: number, rhMidis: readonly number[]): CanonicalVoicing {
  const allMidis = [lhMidi, ...rhMidis].sort((a, b) => a - b);
  return {
    lhMidi,
    rhMidis,
    allMidis,
  };
}

/**
 * Convert standard International chord symbol string to German notation.
 * In German notation:
 * - Bb -> B (and Bbm -> Bm, Bb7 -> B7, Bb/F -> B/F, etc.)
 * - B (natural) -> H (and Bm -> Hm, B7 -> H7, G/B -> G/H, etc.)
 */
export function convertToGermanNotation(internationalStr: string): string {
  const parts = internationalStr.split('/');
  const main = parts[0]!;
  const bass = parts[1];

  let convertedMain = main;
  if (main.startsWith('Bb')) {
    // Replace leading Bb with B
    convertedMain = 'B' + main.slice(2);
  } else if (main.startsWith('B')) {
    // Replace leading B (natural) with H
    convertedMain = 'H' + main.slice(1);
  }

  if (bass !== undefined) {
    let convertedBass = bass;
    if (bass === 'Bb') {
      convertedBass = 'B';
    } else if (bass === 'B') {
      convertedBass = 'H';
    }
    return `${convertedMain}/${convertedBass}`;
  }

  return convertedMain;
}

/**
 * Convert German chord symbol string to International notation.
 * - Leading H -> B
 * - Leading B (natural) -> Bb
 * - Bass /H -> /B
 * - Bass /B -> /Bb
 */
export function convertToInternationalNotation(germanStr: string): string {
  const parts = germanStr.split('/');
  const main = parts[0]!;
  const bass = parts[1];

  let convertedMain = main;
  if (main.startsWith('H')) {
    convertedMain = 'B' + main.slice(1);
  } else if (main.startsWith('B')) {
    convertedMain = 'Bb' + main.slice(1);
  }

  if (bass !== undefined) {
    let convertedBass = bass;
    if (bass === 'H') {
      convertedBass = 'B';
    } else if (bass === 'B') {
      convertedBass = 'Bb';
    }
    return `${convertedMain}/${convertedBass}`;
  }

  return convertedMain;
}

/**
 * Format a chord symbol or chord definition for display under the active notation system
 */
export function formatChordLabel(
  chordOrSymbolOrId: ChordDefinition | ChordSymbol | string,
  notation: ChordNotationSystem = 'international'
): string {
  if (typeof chordOrSymbolOrId === 'string') {
    if (notation === 'german') {
      return convertToGermanNotation(chordOrSymbolOrId);
    }
    return chordOrSymbolOrId;
  }

  if ('displayLabels' in chordOrSymbolOrId) {
    return chordOrSymbolOrId.displayLabels[notation];
  }

  return chordOrSymbolOrId[notation];
}

export interface ChordValidationResult {
  readonly valid: boolean;
  readonly reason?: 'empty' | 'wrong_notes' | 'missing_notes' | 'wrong_bass';
  readonly heldPitchClasses: readonly PitchClass[];
  readonly missingPitchClasses: readonly PitchClass[];
  readonly extraPitchClasses: readonly PitchClass[];
  readonly bassPitchClass?: PitchClass;
  readonly expectedBassPitchClass?: PitchClass;
}

/**
 * Validates a collection of currently depressed MIDI keys against target chord requirements.
 * Adheres strictly to Section 3.2 of the technical specification:
 * 1. Zero non-chord tones: every held note must be in allowedPitchClasses.
 * 2. All required pitch classes must be sounding (satisfying 5th-omission rule for 7ths).
 * 3. Slash chords require the physically lowest note (min midi) to match the slash bass pitch class.
 * 4. Free inversion chords allow any bass inversion note.
 */
export function validateChordMidis(
  heldMidis: readonly number[] | Iterable<number>,
  chord: ChordDefinition
): ChordValidationResult {
  const midiArray = Array.isArray(heldMidis) ? heldMidis : Array.from(heldMidis);
  if (midiArray.length === 0) {
    return {
      valid: false,
      reason: 'empty',
      heldPitchClasses: [],
      missingPitchClasses: chord.requiredPitchClasses,
      extraPitchClasses: [],
    };
  }

  const minMidi = Math.min(...midiArray);
  const heldBassPitchClass = toPitchClass(minMidi);
  const heldPcSet = new Set<PitchClass>(midiArray.map(toPitchClass));
  const heldPitchClasses = Array.from(heldPcSet);

  const allowedSet = new Set<PitchClass>(chord.allowedPitchClasses);

  // Check for foreign/non-chord notes
  const extraPitchClasses = heldPitchClasses.filter((pc) => !allowedSet.has(pc));
  if (extraPitchClasses.length > 0) {
    return {
      valid: false,
      reason: 'wrong_notes',
      heldPitchClasses,
      missingPitchClasses: chord.requiredPitchClasses.filter((pc) => !heldPcSet.has(pc)),
      extraPitchClasses,
      bassPitchClass: heldBassPitchClass,
      expectedBassPitchClass: chord.bassPitchClass,
    };
  }

  // Check for missing required chord tones
  const missingPitchClasses = chord.requiredPitchClasses.filter((pc) => !heldPcSet.has(pc));
  if (missingPitchClasses.length > 0) {
    return {
      valid: false,
      reason: 'missing_notes',
      heldPitchClasses,
      missingPitchClasses,
      extraPitchClasses: [],
      bassPitchClass: heldBassPitchClass,
      expectedBassPitchClass: chord.bassPitchClass,
    };
  }

  // If slash chord, enforce strict lowest physical note match
  if (chord.isSlashChord && chord.bassPitchClass !== undefined) {
    if (heldBassPitchClass !== chord.bassPitchClass) {
      return {
        valid: false,
        reason: 'wrong_bass',
        heldPitchClasses,
        missingPitchClasses: [],
        extraPitchClasses: [],
        bassPitchClass: heldBassPitchClass,
        expectedBassPitchClass: chord.bassPitchClass,
      };
    }
  }

  return {
    valid: true,
    heldPitchClasses,
    missingPitchClasses: [],
    extraPitchClasses: [],
    bassPitchClass: heldBassPitchClass,
    expectedBassPitchClass: chord.bassPitchClass,
  };
}

/**
 * Factory for creating ChordDefinition instances
 */
function createChord(params: {
  id: string;
  rootLetter: string;
  rootPitchClass: PitchClass;
  quality: ChordQuality;
  requiredPitchClasses: readonly PitchClass[];
  optionalPitchClasses?: readonly PitchClass[];
  isSlashChord?: boolean;
  bassLetter?: string;
  bassPitchClass?: PitchClass;
  referenceVoicing: CanonicalVoicing;
}): ChordDefinition {
  const optional = params.optionalPitchClasses ?? [];
  const allowed = Array.from(new Set([...params.requiredPitchClasses, ...optional]));
  const isSlash = params.isSlashChord ?? false;

  const internationalLabel = params.id;
  const germanLabel = convertToGermanNotation(params.id);

  const symbol: ChordSymbol = {
    id: params.id,
    rootLetter: params.rootLetter,
    rootPitchClass: params.rootPitchClass,
    quality: params.quality,
    bassLetter: params.bassLetter,
    bassPitchClass: params.bassPitchClass,
    international: internationalLabel,
    german: germanLabel,
    isSlashChord: isSlash,
  };

  return {
    id: params.id,
    symbol,
    rootPitchClass: params.rootPitchClass,
    bassPitchClass: params.bassPitchClass,
    requiredPitchClasses: params.requiredPitchClasses,
    optionalPitchClasses: optional,
    allowedPitchClasses: allowed,
    isSlashChord: isSlash,
    referenceVoicing: params.referenceVoicing,
    displayLabels: {
      international: internationalLabel,
      german: germanLabel,
    },
  };
}

/**
 * Standard chord library covering all 12 curriculum tiers.
 * Canonical reference voicings are designed with bass note in bass clef (around E2-D3)
 * and close-position voicings in treble clef (around G3-A4).
 */
export const CHORD_LIBRARY: Record<string, ChordDefinition> = {
  // Tier 1: The Tonic Anchor
  C: createChord({
    id: 'C',
    rootLetter: 'C',
    rootPitchClass: 0,
    quality: 'major',
    requiredPitchClasses: [0, 4, 7], // C, E, G
    referenceVoicing: createCanonicalVoicing(48, [60, 64, 67]), // LH C3, RH [C4, E4, G4]
  }),
  'F/C': createChord({
    id: 'F/C',
    rootLetter: 'F',
    rootPitchClass: 5,
    quality: 'major',
    isSlashChord: true,
    bassLetter: 'C',
    bassPitchClass: 0,
    requiredPitchClasses: [5, 9, 0], // F, A, C
    referenceVoicing: createCanonicalVoicing(48, [60, 65, 69]), // LH C3, RH [C4, F4, A4]
  }),

  // Tier 2: The Stepwise Leading Tone
  'G/B': createChord({
    id: 'G/B',
    rootLetter: 'G',
    rootPitchClass: 7,
    quality: 'major',
    isSlashChord: true,
    bassLetter: 'B',
    bassPitchClass: 11,
    requiredPitchClasses: [7, 11, 2], // G, B, D
    referenceVoicing: createCanonicalVoicing(47, [59, 62, 67]), // LH B2, RH [B3, D4, G4]
  }),
  'G7/B': createChord({
    id: 'G7/B',
    rootLetter: 'G',
    rootPitchClass: 7,
    quality: 'dominant7',
    isSlashChord: true,
    bassLetter: 'B',
    bassPitchClass: 11,
    requiredPitchClasses: [7, 11, 5], // G, B, F (5th D is optional)
    optionalPitchClasses: [2],
    referenceVoicing: createCanonicalVoicing(47, [59, 62, 65, 67]), // LH B2, RH [B3, D4, F4, G4]
  }),

  // Tier 3: The Root-Position Cadence
  F: createChord({
    id: 'F',
    rootLetter: 'F',
    rootPitchClass: 5,
    quality: 'major',
    requiredPitchClasses: [5, 9, 0], // F, A, C
    referenceVoicing: createCanonicalVoicing(41, [60, 65, 69]), // LH F2, RH [C4, F4, A4]
  }),
  G: createChord({
    id: 'G',
    rootLetter: 'G',
    rootPitchClass: 7,
    quality: 'major',
    requiredPitchClasses: [7, 11, 2], // G, B, D
    referenceVoicing: createCanonicalVoicing(43, [59, 62, 67]), // LH G2, RH [B3, D4, G4]
  }),
  G7: createChord({
    id: 'G7',
    rootLetter: 'G',
    rootPitchClass: 7,
    quality: 'dominant7',
    requiredPitchClasses: [7, 11, 5], // G, B, F (5th D is optional)
    optionalPitchClasses: [2],
    referenceVoicing: createCanonicalVoicing(43, [59, 62, 65, 67]), // LH G2, RH [B3, D4, F4, G4]
  }),

  // Tier 4: The Volkslieder Singing Key (G Major)
  'C/G': createChord({
    id: 'C/G',
    rootLetter: 'C',
    rootPitchClass: 0,
    quality: 'major',
    isSlashChord: true,
    bassLetter: 'G',
    bassPitchClass: 7,
    requiredPitchClasses: [0, 4, 7], // C, E, G
    referenceVoicing: createCanonicalVoicing(43, [55, 60, 64]), // LH G2, RH [G3, C4, E4]
  }),
  'D7/F#': createChord({
    id: 'D7/F#',
    rootLetter: 'D',
    rootPitchClass: 2,
    quality: 'dominant7',
    isSlashChord: true,
    bassLetter: 'F#',
    bassPitchClass: 6,
    requiredPitchClasses: [2, 6, 0], // D, F#, C (5th A is optional)
    optionalPitchClasses: [9],
    referenceVoicing: createCanonicalVoicing(42, [60, 62, 66]), // LH F#2, RH [C4, D4, F#4]
  }),
  D7: createChord({
    id: 'D7',
    rootLetter: 'D',
    rootPitchClass: 2,
    quality: 'dominant7',
    requiredPitchClasses: [2, 6, 0], // D, F#, C
    optionalPitchClasses: [9],
    referenceVoicing: createCanonicalVoicing(50, [60, 62, 66]), // LH D3, RH [C4, D4, F#4]
  }),

  // Tier 5: The Flat Key & German B/H Pivot (F Major)
  'Bb/F': createChord({
    id: 'Bb/F',
    rootLetter: 'Bb',
    rootPitchClass: 10,
    quality: 'major',
    isSlashChord: true,
    bassLetter: 'F',
    bassPitchClass: 5,
    requiredPitchClasses: [10, 2, 5], // Bb, D, F
    referenceVoicing: createCanonicalVoicing(41, [58, 62, 65]), // LH F2, RH [Bb3, D4, F4]
  }),
  'C7/E': createChord({
    id: 'C7/E',
    rootLetter: 'C',
    rootPitchClass: 0,
    quality: 'dominant7',
    isSlashChord: true,
    bassLetter: 'E',
    bassPitchClass: 4,
    requiredPitchClasses: [0, 4, 10], // C, E, Bb (5th G is optional)
    optionalPitchClasses: [7],
    referenceVoicing: createCanonicalVoicing(40, [58, 60, 64]), // LH E2, RH [Bb3, C4, E4]
  }),
  Bb: createChord({
    id: 'Bb',
    rootLetter: 'Bb',
    rootPitchClass: 10,
    quality: 'major',
    requiredPitchClasses: [10, 2, 5], // Bb, D, F
    referenceVoicing: createCanonicalVoicing(46, [58, 62, 65]), // LH Bb2, RH [Bb3, D4, F4]
  }),
  C7: createChord({
    id: 'C7',
    rootLetter: 'C',
    rootPitchClass: 0,
    quality: 'dominant7',
    requiredPitchClasses: [0, 4, 10], // C, E, Bb
    optionalPitchClasses: [7],
    referenceVoicing: createCanonicalVoicing(48, [58, 60, 64]), // LH C3, RH [Bb3, C4, E4]
  }),

  // Tier 6: The Relative Minor (vi, ii, iii)
  Am: createChord({
    id: 'Am',
    rootLetter: 'A',
    rootPitchClass: 9,
    quality: 'minor',
    requiredPitchClasses: [9, 0, 4], // A, C, E
    referenceVoicing: createCanonicalVoicing(45, [60, 64, 69]), // LH A2, RH [C4, E4, A4]
  }),
  Dm: createChord({
    id: 'Dm',
    rootLetter: 'D',
    rootPitchClass: 2,
    quality: 'minor',
    requiredPitchClasses: [2, 5, 9], // D, F, A
    referenceVoicing: createCanonicalVoicing(50, [62, 65, 69]), // LH D3, RH [D4, F4, A4]
  }),
  Em: createChord({
    id: 'Em',
    rootLetter: 'E',
    rootPitchClass: 4,
    quality: 'minor',
    requiredPitchClasses: [4, 7, 11], // E, G, B
    referenceVoicing: createCanonicalVoicing(40, [59, 64, 67]), // LH E2, RH [B3, E4, G4]
  }),

  // Tier 7: Minor-Key Dominant Drive
  E7: createChord({
    id: 'E7',
    rootLetter: 'E',
    rootPitchClass: 4,
    quality: 'dominant7',
    requiredPitchClasses: [4, 8, 2], // E, G#, D (5th B is optional)
    optionalPitchClasses: [11],
    referenceVoicing: createCanonicalVoicing(40, [59, 62, 68]), // LH E2, RH [B3, D4, G#4]
  }),
  A7: createChord({
    id: 'A7',
    rootLetter: 'A',
    rootPitchClass: 9,
    quality: 'dominant7',
    requiredPitchClasses: [9, 1, 7], // A, C#, G (5th E is optional)
    optionalPitchClasses: [4],
    referenceVoicing: createCanonicalVoicing(45, [55, 61, 64]), // LH A2, RH [G3, C#4, E4]
  }),

  // Tier 8: The Bright 2-Sharp Key (D Major & Bm)
  D: createChord({
    id: 'D',
    rootLetter: 'D',
    rootPitchClass: 2,
    quality: 'major',
    requiredPitchClasses: [2, 6, 9], // D, F#, A
    referenceVoicing: createCanonicalVoicing(50, [57, 62, 66]), // LH D3, RH [A3, D4, F#4]
  }),
  Bm: createChord({
    id: 'Bm',
    rootLetter: 'B',
    rootPitchClass: 11,
    quality: 'minor',
    requiredPitchClasses: [11, 2, 6], // B, D, F#
    referenceVoicing: createCanonicalVoicing(47, [54, 59, 62]), // LH B2, RH [F#3, B3, D4]
  }),

  // Tier 11: Modern Pop & Jazz Color (maj7 & m7)
  Cmaj7: createChord({
    id: 'Cmaj7',
    rootLetter: 'C',
    rootPitchClass: 0,
    quality: 'major7',
    requiredPitchClasses: [0, 4, 11], // C, E, B (5th G is optional)
    optionalPitchClasses: [7],
    referenceVoicing: createCanonicalVoicing(48, [59, 64, 67]), // LH C3, RH [B3, E4, G4]
  }),
  Fmaj7: createChord({
    id: 'Fmaj7',
    rootLetter: 'F',
    rootPitchClass: 5,
    quality: 'major7',
    requiredPitchClasses: [5, 9, 4], // F, A, E (5th C is optional)
    optionalPitchClasses: [0],
    referenceVoicing: createCanonicalVoicing(41, [57, 60, 64]), // LH F2, RH [A3, C4, E4]
  }),
  Dm7: createChord({
    id: 'Dm7',
    rootLetter: 'D',
    rootPitchClass: 2,
    quality: 'minor7',
    requiredPitchClasses: [2, 5, 0], // D, F, C (5th A is optional)
    optionalPitchClasses: [9],
    referenceVoicing: createCanonicalVoicing(50, [60, 65, 69]), // LH D3, RH [C4, F4, A4]
  }),
  Am7: createChord({
    id: 'Am7',
    rootLetter: 'A',
    rootPitchClass: 9,
    quality: 'minor7',
    requiredPitchClasses: [9, 0, 7], // A, C, G (5th E is optional)
    optionalPitchClasses: [4],
    referenceVoicing: createCanonicalVoicing(45, [55, 60, 64]), // LH A2, RH [G3, C4, E4]
  }),
  Em7: createChord({
    id: 'Em7',
    rootLetter: 'E',
    rootPitchClass: 4,
    quality: 'minor7',
    requiredPitchClasses: [4, 7, 2], // E, G, D (5th B is optional)
    optionalPitchClasses: [11],
    referenceVoicing: createCanonicalVoicing(40, [59, 62, 67]), // LH E2, RH [B3, D4, G4]
  }),

  // Additional German/International reference chords
  B: createChord({
    id: 'B',
    rootLetter: 'B',
    rootPitchClass: 11,
    quality: 'major',
    requiredPitchClasses: [11, 3, 6], // B, D#, F#
    referenceVoicing: createCanonicalVoicing(47, [54, 59, 63]), // LH B2, RH [F#3, B3, D#4]
  }),
  B7: createChord({
    id: 'B7',
    rootLetter: 'B',
    rootPitchClass: 11,
    quality: 'dominant7',
    requiredPitchClasses: [11, 3, 9], // B, D#, A
    optionalPitchClasses: [6],
    referenceVoicing: createCanonicalVoicing(47, [57, 59, 63]), // LH B2, RH [A3, B3, D#4]
  }),
  Bb7: createChord({
    id: 'Bb7',
    rootLetter: 'Bb',
    rootPitchClass: 10,
    quality: 'dominant7',
    requiredPitchClasses: [10, 2, 8], // Bb, D, Ab
    optionalPitchClasses: [5],
    referenceVoicing: createCanonicalVoicing(46, [56, 58, 62]), // LH Bb2, RH [Ab3, Bb3, D4]
  }),
  Bm7: createChord({
    id: 'Bm7',
    rootLetter: 'B',
    rootPitchClass: 11,
    quality: 'minor7',
    requiredPitchClasses: [11, 2, 9], // B, D, A
    optionalPitchClasses: [6],
    referenceVoicing: createCanonicalVoicing(47, [57, 59, 62]), // LH B2, RH [A3, B3, D4]
  }),
};

/**
 * Get a chord definition by its canonical ID string (e.g. 'C', 'G/B', 'F/C')
 */
export function getChordDefinition(id: string): ChordDefinition {
  const chord = CHORD_LIBRARY[id];
  if (!chord) {
    throw new Error(`Chord definition for "${id}" not found in CHORD_LIBRARY.`);
  }
  return chord;
}
