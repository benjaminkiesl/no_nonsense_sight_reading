import { RhythmBeatCell, RhythmPhrase } from '../types/rhythm';
import { CELLS } from './curriculum';

export type RhythmConceptId =
  | 'quarter_half'
  | 'eighths'
  | 'rests'
  | 'dotted_quarter'
  | 'sixteenths'
  | 'gallop'
  | 'rev_gallop'
  | 'dotted_sixteenth'
  | 'syncopation'
  | 'ties'
  | 'triplets'
  | 'ragtime';

export interface RhythmConceptDef {
  readonly id: RhythmConceptId;
  readonly tier: number;
  readonly label: string;
  readonly symbol: string;
  readonly description: string;
}

export const RHYTHM_CONCEPTS: readonly RhythmConceptDef[] = [
  {
    id: 'quarter_half',
    tier: 1,
    label: 'Quarters & Halves',
    symbol: '♩ 𝅗𝅥',
    description: 'Steady pulse and sustained 2-beat holds',
  },
  {
    id: 'eighths',
    tier: 2,
    label: 'Two Eighths',
    symbol: '♫',
    description: 'Even 2-to-a-beat subdivisions',
  },
  {
    id: 'rests',
    tier: 3,
    label: 'Rests & Upbeats',
    symbol: '𝄽 𝄾 ♪',
    description: 'Quarter rests and upbeat eighth entrances',
  },
  {
    id: 'dotted_quarter',
    tier: 4,
    label: 'Dotted Quarter',
    symbol: '♩. ♪',
    description: '1.5 beat hold followed by upbeat eighth',
  },
  {
    id: 'sixteenths',
    tier: 5,
    label: 'Four Sixteenths',
    symbol: '♬♬',
    description: '4-note subdivision microgrid',
  },
  {
    id: 'gallop',
    tier: 6,
    label: 'Forward Gallop',
    symbol: '♪ ♬',
    description: 'Eighth plus two sixteenths',
  },
  {
    id: 'rev_gallop',
    tier: 7,
    label: 'Reverse Gallop',
    symbol: '♬ ♪',
    description: 'Two sixteenths plus eighth',
  },
  {
    id: 'dotted_sixteenth',
    tier: 8,
    label: 'Dotted 16th / Snap',
    symbol: '♪. 𝅘𝅥𝅯',
    description: 'Long-short march and Scotch snap',
  },
  {
    id: 'syncopation',
    tier: 9,
    label: 'Off-Beat Syncopation',
    symbol: '♪ ♩ ♪',
    description: 'Eighth-quarter-eighth across the beat',
  },
  {
    id: 'ties',
    tier: 10,
    label: 'Cross-Beat Ties',
    symbol: '♩‿♪',
    description: 'Sustaining across silent downbeats',
  },
  {
    id: 'triplets',
    tier: 11,
    label: 'Eighth Triplets',
    symbol: '3',
    description: 'Three notes in the space of one beat',
  },
  {
    id: 'ragtime',
    tier: 12,
    label: 'Ragtime & Tresillo',
    symbol: '♬ ♪ ♬',
    description: 'Intra-beat 16th syncopation & pop groove',
  },
];

export interface RhythmStreamOptions {
  readonly concepts: readonly RhythmConceptId[];
  readonly targetBpm: number;
  readonly phraseId?: string;
}

// 1-beat cell pool per concept
const CONCEPT_BEAT_CELLS: Record<RhythmConceptId, RhythmBeatCell[]> = {
  quarter_half: [CELLS.q],
  eighths: [CELLS.e2],
  rests: [CELLS.rest_q, CELLS.upbeat_e, CELLS.note_e_rest_e],
  dotted_quarter: [], // Handled via 2-beat modules
  sixteenths: [CELLS.s4],
  gallop: [CELLS.gallop],
  rev_gallop: [CELLS.rev_gallop],
  dotted_sixteenth: [CELLS.dot8_s, CELLS.scotch_snap],
  syncopation: [], // Handled via 2-beat modules
  ties: [], // Handled via 2-beat modules
  triplets: [CELLS.triplet_e],
  ragtime: [CELLS.sync_16_8_16, CELLS.pickup_3s],
};

// 2-beat module pool per concept: [Beat A, Beat B]
const CONCEPT_TWO_BEAT_MODULES: Record<RhythmConceptId, RhythmBeatCell[][]> = {
  quarter_half: [
    [CELLS.h_start, CELLS.hold_q],
    [CELLS.q, CELLS.q],
  ],
  eighths: [
    [CELLS.e2, CELLS.q],
    [CELLS.q, CELLS.e2],
    [CELLS.e2, CELLS.e2],
  ],
  rests: [
    [CELLS.rest_q, CELLS.q],
    [CELLS.q, CELLS.rest_q],
    [CELLS.upbeat_e, CELLS.q],
    [CELLS.note_e_rest_e, CELLS.e2],
  ],
  dotted_quarter: [
    [CELLS.q, CELLS.tie_e_note_e], // ♩. ♪
    [CELLS.q, CELLS.e2],
  ],
  sixteenths: [
    [CELLS.s4, CELLS.q],
    [CELLS.q, CELLS.s4],
    [CELLS.e2, CELLS.s4],
    [CELLS.s4, CELLS.e2],
  ],
  gallop: [
    [CELLS.gallop, CELLS.q],
    [CELLS.gallop, CELLS.e2],
    [CELLS.e2, CELLS.gallop],
  ],
  rev_gallop: [
    [CELLS.rev_gallop, CELLS.q],
    [CELLS.rev_gallop, CELLS.e2],
    [CELLS.q, CELLS.rev_gallop],
  ],
  dotted_sixteenth: [
    [CELLS.dot8_s, CELLS.q],
    [CELLS.q, CELLS.dot8_s],
    [CELLS.scotch_snap, CELLS.q],
  ],
  syncopation: [
    // ♪ ♩ ♪: e2 where second eighth holds into next beat, followed by eighth note
    [
      {
        cellId: 'sync_start',
        events: [
          { kind: 'attack', durationBeats: 0.5 },
          { kind: 'attack', durationBeats: 0.5 },
        ],
      },
      CELLS.tie_e_note_e,
    ],
    [CELLS.q, CELLS.tie_e_note_e],
  ],
  ties: [
    [CELLS.e2, CELLS.tie_e_note_e],
    [CELLS.h_start, CELLS.hold_q],
  ],
  triplets: [
    [CELLS.triplet_e, CELLS.q],
    [CELLS.q, CELLS.triplet_e],
    [CELLS.triplet_e, CELLS.triplet_e],
  ],
  ragtime: [
    [CELLS.sync_16_8_16, CELLS.q],
    [CELLS.sync_16_8_16, CELLS.e2],
    [CELLS.dot8_s, CELLS.tie_e_note_e], // Tresillo bridge
  ],
};

function getRandomItem<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index]!;
}

/**
 * Procedurally generates a musical 2-bar rhythm phrase in 4/4 time
 * conforming to cognitive phrase grammar:
 * - Bar 1 (Beats 1-2, Beats 3-4): Call motif
 * - Bar 2 (Beats 5-6, Beats 7-8): Development + Cadence
 * - Beat 9: Quarter landing downbeat
 */
export function generateRhythmPhrase(options: RhythmStreamOptions): RhythmPhrase {
  const activeConcepts = options.concepts.length > 0 ? options.concepts : (['quarter_half'] as const);
  const targetBpm = Math.max(35, Math.min(200, Math.round(options.targetBpm)));
  const phraseId = options.phraseId ?? `stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Gather 2-beat modules available for active concepts
  const availableTwoBeatModules: RhythmBeatCell[][] = [];
  for (const cid of activeConcepts) {
    const modules = CONCEPT_TWO_BEAT_MODULES[cid];
    if (modules && modules.length > 0) {
      availableTwoBeatModules.push(...modules);
    }
  }

  // Always ensure at least quarters/halves are available as fallback
  if (availableTwoBeatModules.length === 0) {
    availableTwoBeatModules.push([CELLS.q, CELLS.q]);
    availableTwoBeatModules.push([CELLS.h_start, CELLS.hold_q]);
  }

  // Gather single-beat cells for active concepts
  const availableSingleCells: RhythmBeatCell[] = [CELLS.q];
  for (const cid of activeConcepts) {
    const cells = CONCEPT_BEAT_CELLS[cid];
    if (cells && cells.length > 0) {
      availableSingleCells.push(...cells);
    }
  }

  // Helper to generate a 2-beat block
  const pickTwoBeatBlock = (isCadence = false): [RhythmBeatCell, RhythmBeatCell] => {
    if (isCadence) {
      // Cadence prefers resolving to stable values on Beat 8 (quarter or half hold)
      const cadenceOptions: [RhythmBeatCell, RhythmBeatCell][] = [
        [CELLS.q, CELLS.q],
        [CELLS.h_start, CELLS.hold_q],
        [CELLS.e2, CELLS.q],
      ];
      return getRandomItem(cadenceOptions);
    }

    // 70% chance to pick a curated 2-beat idiom module, 30% to compose two 1-beat cells
    if (Math.random() < 0.70 && availableTwoBeatModules.length > 0) {
      const mod = getRandomItem(availableTwoBeatModules);
      return [mod[0]!, mod[1]!];
    } else {
      return [getRandomItem(availableSingleCells), getRandomItem(availableSingleCells)];
    }
  };

  // Block 1: Bar 1, Beats 1-2
  const block1 = pickTwoBeatBlock(false);
  // Block 2: Bar 1, Beats 3-4 (40% chance to repeat block 1 motif for musical rhyme)
  const block2 = Math.random() < 0.40 ? block1 : pickTwoBeatBlock(false);

  // Block 3: Bar 2, Beats 1-2 (variation / contrast)
  const block3 = pickTwoBeatBlock(false);
  // Block 4: Bar 2, Beats 3-4 (cadence resolution)
  const block4 = pickTwoBeatBlock(true);

  // Landing downbeat: Bar 3 Beat 1
  const landingCell = CELLS.q;

  const beatCells: RhythmBeatCell[] = [
    block1[0],
    block1[1],
    block2[0],
    block2[1],
    block3[0],
    block3[1],
    block4[0],
    block4[1],
    landingCell,
  ];

  // Maximum tier among selected concepts
  const maxTier = Math.max(
    ...activeConcepts.map((c) => {
      const def = RHYTHM_CONCEPTS.find((rc) => rc.id === c);
      return def ? def.tier : 1;
    }),
    1
  );

  return {
    id: phraseId,
    tier: maxTier,
    timeSignature: '4/4',
    beatsPerBar: 4,
    beatUnit: 4,
    targetBpm,
    beatCells,
  };
}
