import {
  CanonicalVoicing,
  ChordDefinition,
  ChordLevelSpec,
} from '../types/chord';
import { getChordDefinition } from './chords';

/**
 * Helper to build a lookup record of reference voicings for a list of chords
 */
function buildVoicingsMap(chords: readonly ChordDefinition[]): Record<string, CanonicalVoicing> {
  const map: Record<string, CanonicalVoicing> = {};
  for (const c of chords) {
    map[c.id] = c.referenceVoicing;
  }
  return map;
}

/**
 * Helper to resolve a list of chord IDs to ChordDefinition array
 */
function resolveChords(ids: readonly string[]): readonly ChordDefinition[] {
  return ids.map((id) => getChordDefinition(id));
}

export const CHORD_LEVELS: readonly ChordLevelSpec[] = [
  // Tier 1: The Tonic Anchor
  {
    id: 'chord-1',
    tier: 1,
    title: 'The Tonic Anchor',
    subtitle: 'Tonic & Neighbor Suspension in C',
    keySignatures: ['C_MAJOR'],
    newChords: resolveChords(['C', 'F/C']),
    reviewChords: [],
    targetChords: resolveChords(['C', 'F/C']),
    referenceVoicings: buildVoicingsMap(resolveChords(['C', 'F/C'])),
    markovTransitions: {
      C: { 'F/C': 7, C: 3 },
      'F/C': { C: 8, 'F/C': 2 },
    },
    prerequisiteIds: [],
    nextIds: ['chord-2'],
    targetBpm: 50,
  },

  // Tier 2: The Stepwise Leading Tone
  {
    id: 'chord-2',
    tier: 2,
    title: 'The Stepwise Leading Tone',
    subtitle: '1st-Inversion Dominant in C',
    keySignatures: ['C_MAJOR'],
    newChords: resolveChords(['G/B', 'G7/B']),
    reviewChords: resolveChords(['C', 'F/C']),
    targetChords: resolveChords(['C', 'F/C', 'G/B', 'G7/B']),
    referenceVoicings: buildVoicingsMap(resolveChords(['C', 'F/C', 'G/B', 'G7/B'])),
    markovTransitions: {
      C: { 'F/C': 3, 'G/B': 3, 'G7/B': 3, C: 1 },
      'F/C': { C: 5, 'G/B': 2, 'G7/B': 3 },
      'G/B': { C: 7, 'G7/B': 2, 'F/C': 1 },
      'G7/B': { C: 8, 'G/B': 1, 'F/C': 1 },
    },
    prerequisiteIds: ['chord-1'],
    nextIds: ['chord-3'],
    targetBpm: 52,
  },

  // Tier 3: The Root-Position Cadence
  {
    id: 'chord-3',
    tier: 3,
    title: 'The Root-Position Cadence',
    subtitle: 'Primary Triads & Authentic Cadences',
    keySignatures: ['C_MAJOR'],
    newChords: resolveChords(['F', 'G', 'G7']),
    reviewChords: resolveChords(['C', 'F/C', 'G/B']),
    targetChords: resolveChords(['C', 'F', 'G', 'G7', 'F/C', 'G/B']),
    referenceVoicings: buildVoicingsMap(resolveChords(['C', 'F', 'G', 'G7', 'F/C', 'G/B'])),
    markovTransitions: {
      C: { F: 4, G: 2, G7: 3, 'F/C': 1 },
      F: { G: 4, G7: 4, C: 2 },
      G: { C: 6, G7: 2, F: 2 },
      G7: { C: 8, F: 2 },
      'F/C': { C: 5, G: 3, G7: 2 },
      'G/B': { C: 7, G7: 2, F: 1 },
    },
    prerequisiteIds: ['chord-2'],
    nextIds: ['chord-4'],
    targetBpm: 54,
  },

  // Tier 4: The Volkslieder Singing Key
  {
    id: 'chord-4',
    tier: 4,
    title: 'The Volkslieder Singing Key',
    subtitle: 'G Major Primary & Voice-Led Cadences',
    keySignatures: ['G_MAJOR'],
    newChords: resolveChords(['C/G', 'D7/F#', 'D7']),
    reviewChords: resolveChords(['G', 'C']),
    targetChords: resolveChords(['G', 'C/G', 'D7/F#', 'D7', 'C']),
    referenceVoicings: buildVoicingsMap(resolveChords(['G', 'C/G', 'D7/F#', 'D7', 'C'])),
    markovTransitions: {
      G: { 'C/G': 4, 'D7/F#': 4, D7: 2, C: 2 },
      'C/G': { G: 6, 'D7/F#': 3, D7: 1 },
      'D7/F#': { G: 8, D7: 1, 'C/G': 1 },
      D7: { G: 7, 'D7/F#': 2, C: 1 },
      C: { D7: 4, 'D7/F#': 3, G: 3 },
    },
    prerequisiteIds: ['chord-3'],
    nextIds: ['chord-5'],
    targetBpm: 56,
  },

  // Tier 5: The Flat Key & German B/H Pivot
  {
    id: 'chord-5',
    tier: 5,
    title: 'The Flat Key & German B/H Pivot',
    subtitle: 'F Major Primary & The B-Flat Chord',
    keySignatures: ['F_MAJOR'],
    newChords: resolveChords(['Bb/F', 'C7/E', 'Bb', 'C7']),
    reviewChords: resolveChords(['F']),
    targetChords: resolveChords(['F', 'Bb/F', 'C7/E', 'Bb', 'C7']),
    referenceVoicings: buildVoicingsMap(resolveChords(['F', 'Bb/F', 'C7/E', 'Bb', 'C7'])),
    markovTransitions: {
      F: { 'Bb/F': 3, Bb: 3, 'C7/E': 3, C7: 2 },
      'Bb/F': { F: 6, 'C7/E': 3, C7: 1 },
      'C7/E': { F: 8, 'Bb/F': 1, C7: 1 },
      Bb: { C7: 4, 'C7/E': 3, F: 3 },
      C7: { F: 8, Bb: 1, 'C7/E': 1 },
    },
    prerequisiteIds: ['chord-4'],
    nextIds: ['chord-6'],
    targetBpm: 58,
  },

  // Tier 6: The Relative Minor
  {
    id: 'chord-6',
    tier: 6,
    title: 'The Relative Minor',
    subtitle: 'Diatonic Minor Triads (vi, ii, iii)',
    keySignatures: ['C_MAJOR'],
    newChords: resolveChords(['Am', 'Dm', 'Em']),
    reviewChords: resolveChords(['C', 'F', 'G']),
    targetChords: resolveChords(['C', 'Am', 'Dm', 'Em', 'F', 'G']),
    referenceVoicings: buildVoicingsMap(resolveChords(['C', 'Am', 'Dm', 'Em', 'F', 'G'])),
    markovTransitions: {
      C: { Am: 4, Dm: 2, Em: 2, F: 2 },
      Am: { Dm: 4, F: 3, Em: 2, G: 1 },
      Dm: { G: 5, Em: 2, Am: 2, C: 1 },
      Em: { Am: 5, F: 3, Dm: 2 },
      F: { G: 4, C: 3, Dm: 2, Am: 1 },
      G: { C: 6, Am: 3, Em: 1 },
    },
    prerequisiteIds: ['chord-5'],
    nextIds: ['chord-7'],
    targetBpm: 60,
  },

  // Tier 7: Minor-Key Dominant Drive
  {
    id: 'chord-7',
    tier: 7,
    title: 'Minor-Key Dominant Drive',
    subtitle: 'Harmonic Minor Leading Tones',
    keySignatures: ['C_MAJOR'],
    newChords: resolveChords(['E7', 'A7']),
    reviewChords: resolveChords(['Am', 'Dm', 'C', 'G']),
    targetChords: resolveChords(['Am', 'Dm', 'E7', 'A7', 'C', 'G']),
    referenceVoicings: buildVoicingsMap(resolveChords(['Am', 'Dm', 'E7', 'A7', 'C', 'G'])),
    markovTransitions: {
      Am: { Dm: 4, E7: 4, C: 2 },
      Dm: { E7: 4, A7: 3, Am: 2, G: 1 },
      E7: { Am: 8, Dm: 2 },
      A7: { Dm: 8, Am: 2 },
      C: { Am: 4, E7: 3, Dm: 2, G: 1 },
      G: { C: 4, Am: 4, E7: 2 },
    },
    prerequisiteIds: ['chord-6'],
    nextIds: ['chord-8'],
    targetBpm: 62,
  },

  // Tier 8: The Bright 2-Sharp Key
  {
    id: 'chord-8',
    tier: 8,
    title: 'The Bright 2-Sharp Key',
    subtitle: 'D Major & Relative Minor Bm (Hm)',
    keySignatures: ['D_MAJOR'],
    newChords: resolveChords(['D', 'Bm']),
    reviewChords: resolveChords(['G', 'A7', 'Em']),
    targetChords: resolveChords(['D', 'G', 'A7', 'Bm', 'Em']),
    referenceVoicings: buildVoicingsMap(resolveChords(['D', 'G', 'A7', 'Bm', 'Em'])),
    markovTransitions: {
      D: { G: 3, Bm: 3, Em: 2, A7: 2 },
      Bm: { Em: 4, G: 3, A7: 2, D: 1 },
      Em: { A7: 6, D: 2, Bm: 2 },
      G: { A7: 5, D: 3, Bm: 2 },
      A7: { D: 7, Bm: 2, G: 1 },
    },
    prerequisiteIds: ['chord-7'],
    nextIds: ['chord-9'],
    targetBpm: 64,
  },

  // Tier 9: Applied Secondary Dominants
  {
    id: 'chord-9',
    tier: 9,
    title: 'Applied Secondary Dominants',
    subtitle: 'Tonicizations in Folk & Songbook Classics',
    keySignatures: ['C_MAJOR', 'G_MAJOR', 'F_MAJOR', 'D_MAJOR'],
    newChords: [],
    reviewChords: resolveChords(['C', 'G', 'D7', 'D', 'A7', 'F', 'C7', 'Am', 'E7']),
    targetChords: resolveChords(['C', 'G', 'D7', 'D', 'A7', 'F', 'C7', 'Am', 'E7']),
    referenceVoicings: buildVoicingsMap(resolveChords(['C', 'G', 'D7', 'D', 'A7', 'F', 'C7', 'Am', 'E7'])),
    markovTransitions: {
      C: { D7: 3, A7: 2, C7: 2, E7: 2, G: 3 },
      D7: { G: 8, D: 2 },
      G: { C: 5, D7: 3, C7: 2 },
      D: { A7: 5, G: 3, D7: 2 },
      A7: { D: 7, G: 2, E7: 1 },
      C7: { F: 8, C: 2 },
      F: { G: 4, C: 4, C7: 2 },
      E7: { Am: 8, C: 2 },
      Am: { D7: 4, E7: 3, C: 3 },
    },
    prerequisiteIds: ['chord-8'],
    nextIds: ['chord-10'],
    targetBpm: 66,
  },

  // Tier 10: The Universal 4-Chord Axis
  {
    id: 'chord-10',
    tier: 10,
    title: 'The Universal 4-Chord Axis',
    subtitle: 'Free Inversion Pop & Folk Anthems',
    keySignatures: ['C_MAJOR', 'G_MAJOR'],
    newChords: [],
    reviewChords: resolveChords(['C', 'G', 'Am', 'F', 'D', 'Em']),
    targetChords: resolveChords(['C', 'G', 'Am', 'F', 'D', 'Em']),
    referenceVoicings: buildVoicingsMap(resolveChords(['C', 'G', 'Am', 'F', 'D', 'Em'])),
    markovTransitions: {
      C: { G: 6, Am: 3, F: 1 },
      G: { Am: 6, D: 2, Em: 2 },
      Am: { F: 7, G: 2, C: 1 },
      F: { C: 7, G: 2, Am: 1 },
      D: { Em: 7, G: 2, C: 1 },
      Em: { C: 7, D: 2, G: 1 },
    },
    prerequisiteIds: ['chord-9'],
    nextIds: ['chord-11'],
    targetBpm: 68,
  },

  // Tier 11: Modern Pop & Jazz Color
  {
    id: 'chord-11',
    tier: 11,
    title: 'Modern Pop & Jazz Color',
    subtitle: 'Major 7th & Minor 7th Chords',
    keySignatures: ['C_MAJOR', 'F_MAJOR'],
    newChords: resolveChords(['Cmaj7', 'Fmaj7', 'Dm7', 'Am7', 'Em7']),
    reviewChords: resolveChords(['G7']),
    targetChords: resolveChords(['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7']),
    referenceVoicings: buildVoicingsMap(resolveChords(['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7'])),
    markovTransitions: {
      Cmaj7: { Dm7: 3, Am7: 3, Fmaj7: 2, Em7: 2 },
      Dm7: { G7: 6, Em7: 2, Cmaj7: 2 },
      G7: { Cmaj7: 6, Am7: 2, Em7: 2 },
      Am7: { Dm7: 5, Fmaj7: 3, Em7: 2 },
      Fmaj7: { G7: 4, Em7: 3, Cmaj7: 3 },
      Em7: { Am7: 6, Fmaj7: 2, Dm7: 2 },
    },
    prerequisiteIds: ['chord-10'],
    nextIds: ['chord-12'],
    targetBpm: 70,
  },

  // Tier 12: Master Lead-Sheet Fluency
  {
    id: 'chord-12',
    tier: 12,
    title: 'Master Lead-Sheet Fluency',
    subtitle: 'Full Integration & Rapid Modulation',
    keySignatures: ['C_MAJOR', 'G_MAJOR', 'F_MAJOR', 'D_MAJOR'],
    newChords: [],
    reviewChords: resolveChords([
      'C', 'F/C', 'G/B', 'G7/B', 'F', 'G', 'G7', 'C/G', 'D7/F#', 'D7',
      'Bb/F', 'C7/E', 'Bb', 'C7', 'Am', 'Dm', 'Em', 'E7', 'A7', 'D', 'Bm',
      'Cmaj7', 'Fmaj7', 'Dm7', 'Am7', 'Em7',
    ]),
    targetChords: resolveChords([
      'C', 'F/C', 'G/B', 'G7/B', 'F', 'G', 'G7', 'C/G', 'D7/F#', 'D7',
      'Bb/F', 'C7/E', 'Bb', 'C7', 'Am', 'Dm', 'Em', 'E7', 'A7', 'D', 'Bm',
      'Cmaj7', 'Fmaj7', 'Dm7', 'Am7', 'Em7',
    ]),
    referenceVoicings: buildVoicingsMap(resolveChords([
      'C', 'F/C', 'G/B', 'G7/B', 'F', 'G', 'G7', 'C/G', 'D7/F#', 'D7',
      'Bb/F', 'C7/E', 'Bb', 'C7', 'Am', 'Dm', 'Em', 'E7', 'A7', 'D', 'Bm',
      'Cmaj7', 'Fmaj7', 'Dm7', 'Am7', 'Em7',
    ])),
    markovTransitions: {
      C: { 'F/C': 2, 'G/B': 2, F: 3, G: 3, Am: 2, Cmaj7: 2 },
      'F/C': { C: 6, G: 2, G7: 2 },
      'G/B': { C: 7, G7: 2, F: 1 },
      'G7/B': { C: 8, G: 1, F: 1 },
      F: { G: 3, G7: 3, C: 2, 'Bb/F': 2, Fmaj7: 2 },
      G: { C: 5, G7: 2, 'C/G': 2, Em: 2 },
      G7: { C: 7, Cmaj7: 2, Am: 1 },
      'C/G': { G: 6, 'D7/F#': 3, D7: 1 },
      'D7/F#': { G: 8, D7: 1, Em: 1 },
      D7: { G: 7, D: 2, 'D7/F#': 1 },
      'Bb/F': { F: 6, 'C7/E': 3, Bb: 1 },
      'C7/E': { F: 8, C7: 1, Bb: 1 },
      Bb: { C7: 4, 'C7/E': 3, F: 3 },
      C7: { F: 7, 'Bb/F': 2, C: 1 },
      Am: { Dm: 4, E7: 3, F: 2, Am7: 2 },
      Dm: { G: 4, G7: 3, E7: 2, Dm7: 2 },
      Em: { Am: 4, A7: 3, Em7: 2, C: 1 },
      E7: { Am: 7, Dm: 2, Am7: 2 },
      A7: { Dm: 5, D: 4, Bm: 2 },
      D: { G: 4, A7: 3, Bm: 3 },
      Bm: { Em: 4, G: 3, A7: 3 },
      Cmaj7: { Dm7: 3, Am7: 3, Fmaj7: 3, G: 2 },
      Fmaj7: { G7: 3, Em7: 3, Cmaj7: 3, C: 2 },
      Dm7: { G7: 5, Cmaj7: 3, Em7: 2 },
      Am7: { Dm7: 5, E7: 3, Fmaj7: 2 },
      Em7: { Am7: 5, A7: 3, Dm7: 2 },
    },
    prerequisiteIds: ['chord-11'],
    nextIds: [],
    targetBpm: 72,
  },
];

export const CHORD_LEVELS_BY_ID: ReadonlyMap<string, ChordLevelSpec> = new Map(
  CHORD_LEVELS.map((lvl) => [lvl.id, lvl])
);

export function getChordLevelById(id: string): ChordLevelSpec {
  const lvl = CHORD_LEVELS_BY_ID.get(id);
  if (!lvl) {
    throw new Error(`Chord level with ID "${id}" not found.`);
  }
  return lvl;
}

export function isChordLevelId(id: string): boolean {
  return id.startsWith('chord-');
}

/**
 * Randomly samples the next chord in a progression given the current chord,
 * utilizing the level's weighted Markov transitions.
 * If current chord has no transitions specified, falls back to uniform sampling over target chords.
 */
export function getNextMarkovChord(
  currentChordId: string,
  level: ChordLevelSpec,
  randomFn: () => number = Math.random
): ChordDefinition {
  const transitions = level.markovTransitions[currentChordId];
  if (!transitions || Object.keys(transitions).length === 0) {
    const idx = Math.floor(randomFn() * level.targetChords.length);
    return level.targetChords[idx]!;
  }

  const entries = Object.entries(transitions);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

  if (totalWeight <= 0) {
    const idx = Math.floor(randomFn() * level.targetChords.length);
    return level.targetChords[idx]!;
  }

  const r = randomFn() * totalWeight;
  let accumulated = 0;
  for (const [chordId, weight] of entries) {
    accumulated += weight;
    if (r <= accumulated) {
      return getChordDefinition(chordId);
    }
  }

  return getChordDefinition(entries[entries.length - 1]![0]);
}
