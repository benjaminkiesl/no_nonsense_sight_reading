import {
  FlattenedRhythmNote,
  RhythmBeatCell,
  RhythmLevelSpec,
  RhythmPhrase,
} from '../types/rhythm';

export const CELLS = {
  // Quarter note (1 beat)
  q: {
    cellId: 'q',
    events: [{ kind: 'attack', durationBeats: 1.0 }],
  } as RhythmBeatCell,

  // Quarter rest (1 beat)
  rest_q: {
    cellId: 'rest_q',
    events: [{ kind: 'rest', durationBeats: 1.0 }],
  } as RhythmBeatCell,

  // Half note attack (1st beat of half note)
  h_start: {
    cellId: 'h_start',
    events: [{ kind: 'attack', durationBeats: 1.0 }],
  } as RhythmBeatCell,

  // Tied quarter continuation (2nd beat of half note)
  hold_q: {
    cellId: 'hold_q',
    events: [{ kind: 'hold', durationBeats: 1.0, tiedFromPrev: true }],
  } as RhythmBeatCell,

  // Two eighth notes (0.5 + 0.5)
  e2: {
    cellId: 'e2',
    events: [
      { kind: 'attack', durationBeats: 0.5 },
      { kind: 'attack', durationBeats: 0.5 },
    ],
  } as RhythmBeatCell,

  // Eighth rest + eighth note (0.5 rest + 0.5 attack)
  upbeat_e: {
    cellId: 'upbeat_e',
    events: [
      { kind: 'rest', durationBeats: 0.5 },
      { kind: 'attack', durationBeats: 0.5 },
    ],
  } as RhythmBeatCell,

  // Eighth note + eighth rest (0.5 attack + 0.5 rest)
  note_e_rest_e: {
    cellId: 'note_e_rest_e',
    events: [
      { kind: 'attack', durationBeats: 0.5 },
      { kind: 'rest', durationBeats: 0.5 },
    ],
  } as RhythmBeatCell,

  // Tied eighth continuation + eighth attack (completes dotted quarter or syncopation)
  tie_e_note_e: {
    cellId: 'tie_e_note_e',
    events: [
      { kind: 'hold', durationBeats: 0.5, tiedFromPrev: true },
      { kind: 'attack', durationBeats: 0.5 },
    ],
  } as RhythmBeatCell,

  // Four sixteenth notes (0.25 x 4)
  s4: {
    cellId: 's4',
    events: [
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.25 },
    ],
  } as RhythmBeatCell,

  // Eighth + two sixteenths (gallop: 0.5, 0.25, 0.25)
  gallop: {
    cellId: 'gallop',
    events: [
      { kind: 'attack', durationBeats: 0.5 },
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.25 },
    ],
  } as RhythmBeatCell,

  // Two sixteenths + eighth (reverse gallop: 0.25, 0.25, 0.5)
  rev_gallop: {
    cellId: 'rev_gallop',
    events: [
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.5 },
    ],
  } as RhythmBeatCell,

  // Dotted eighth + sixteenth (0.75 dotted + 0.25)
  dot8_s: {
    cellId: 'dot8_s',
    events: [
      { kind: 'attack', durationBeats: 0.75, dotted: true },
      { kind: 'attack', durationBeats: 0.25 },
    ],
  } as RhythmBeatCell,

  // Sixteenth + dotted eighth (Scotch snap: 0.25 + 0.75 dotted)
  scotch_snap: {
    cellId: 'scotch_snap',
    events: [
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.75, dotted: true },
    ],
  } as RhythmBeatCell,

  // Intra-beat syncopation (sixteenth, eighth, sixteenth: 0.25, 0.5, 0.25)
  sync_16_8_16: {
    cellId: 'sync_16_8_16',
    events: [
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.5 },
      { kind: 'attack', durationBeats: 0.25 },
    ],
  } as RhythmBeatCell,

  // Sixteenth rest + three sixteenths (0.25 rest, 0.25, 0.25, 0.25)
  pickup_3s: {
    cellId: 'pickup_3s',
    events: [
      { kind: 'rest', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.25 },
      { kind: 'attack', durationBeats: 0.25 },
    ],
  } as RhythmBeatCell,

  // Eighth triplet (1/3, 1/3, 1/3)
  triplet_e: {
    cellId: 'triplet_e',
    events: [
      { kind: 'attack', durationBeats: 1 / 3, tuplet: 3 },
      { kind: 'attack', durationBeats: 1 / 3, tuplet: 3 },
      { kind: 'attack', durationBeats: 1 / 3, tuplet: 3 },
    ],
  } as RhythmBeatCell,
};

// Export CELL_LIBRARY for backwards compatibility with tests
export const CELL_LIBRARY = CELLS;

/**
 * Flattens a RhythmPhrase into concrete note attacks, merging any hold/tied continuations
 * onto the preceding note's duration. Sets isLandingNote: true on the final note.
 */
export function flattenPhraseToNotes(phrase: RhythmPhrase): FlattenedRhythmNote[] {
  const notes: FlattenedRhythmNote[] = [];
  let currentBeat = 0;

  for (let b = 0; b < phrase.beatCells.length; b++) {
    const cell = phrase.beatCells[b];
    if (!cell) continue;

    let offsetInCell = 0;
    for (const evt of cell.events) {
      if (evt.kind === 'hold' || evt.tiedFromPrev) {
        const lastIdx = notes.length - 1;
        const prev = notes[lastIdx];
        if (prev) {
          notes[lastIdx] = {
            ...prev,
            durationBeats: Number((prev.durationBeats + evt.durationBeats).toFixed(4)),
          };
        }
      } else if (evt.kind === 'attack') {
        notes.push({
          noteIndex: notes.length,
          startBeat: Number((currentBeat + offsetInCell).toFixed(4)),
          durationBeats: Number(evt.durationBeats.toFixed(4)),
          isLandingNote: false,
          cellIndex: b,
        });
      }
      offsetInCell += evt.durationBeats;
    }
    currentBeat += 1;
  }

  // Mark final note as the landing note
  if (notes.length > 0) {
    const lastIdx = notes.length - 1;
    const last = notes[lastIdx]!;
    notes[lastIdx] = {
      ...last,
      isLandingNote: true,
    };
  }

  return notes;
}

export const RHYTHM_LEVELS: readonly RhythmLevelSpec[] = [
  // Tier 1: Quarter & Half Pulse (4/4)
  {
    id: 'rhythm-1',
    tier: 1,
    title: 'Quarter & Half Pulse',
    subtitle: 'Basic walking pulse and sustained half notes',
    motif: 'q_q',
    prerequisiteIds: [],
    nextIds: ['rhythm-2'],
    phrases: [
      {
        id: 'r1-p1',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.q, CELLS.q,
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q, // Landing downbeat
        ],
      },
      {
        id: 'r1-p2',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.h_start, CELLS.hold_q, CELLS.q, CELLS.q,
          CELLS.h_start, CELLS.hold_q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r1-p3',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q, CELLS.q, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r1-p4',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.h_start, CELLS.hold_q, CELLS.h_start, CELLS.hold_q,
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r1-p5',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.h_start, CELLS.hold_q, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r1-p6',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.q, CELLS.q,
          CELLS.h_start, CELLS.hold_q, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r1-p7',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.h_start, CELLS.hold_q, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r1-p8',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.h_start, CELLS.hold_q, CELLS.q, CELLS.q,
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r1-p9',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r1-p10',
        tier: 1,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 88,
        beatCells: [
          CELLS.h_start, CELLS.hold_q, CELLS.h_start, CELLS.hold_q,
          CELLS.h_start, CELLS.hold_q, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 2: Eighth-Note Flow (4/4 & 3/4)
  {
    id: 'rhythm-2',
    tier: 2,
    title: 'Eighth-Note Flow',
    subtitle: 'Even two-to-a-beat subdivisions in 4/4 and 3/4',
    motif: 'e2_q',
    prerequisiteIds: ['rhythm-1'],
    nextIds: ['rhythm-3'],
    phrases: [
      {
        id: 'r2-p1',
        tier: 2,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.e2, CELLS.e2, CELLS.q, CELLS.q,
          CELLS.e2, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p2',
        tier: 2,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.q, CELLS.e2,
          CELLS.e2, CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p3',
        tier: 2,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.q,
          CELLS.e2, CELLS.e2, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p4',
        tier: 2,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.e2, CELLS.q, CELLS.e2, CELLS.q,
          CELLS.h_start, CELLS.hold_q, CELLS.e2, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p5',
        tier: 2,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.e2, CELLS.e2, CELLS.e2, CELLS.e2,
          CELLS.q, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p6',
        tier: 2,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.e2, CELLS.q,
          CELLS.q, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p7',
        tier: 2,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.e2, CELLS.q, CELLS.e2,
          CELLS.q, CELLS.e2, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p8',
        tier: 2,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.e2, CELLS.e2, CELLS.q,
          CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p9',
        tier: 2,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.e2, CELLS.e2,
          CELLS.e2, CELLS.q, CELLS.e2, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r2-p10',
        tier: 2,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 88,
        beatCells: [
          CELLS.e2, CELLS.e2, CELLS.q, CELLS.e2,
          CELLS.e2, CELLS.e2, CELLS.e2, CELLS.q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 3: Rests & Silence (4/4 & 3/4)
  {
    id: 'rhythm-3',
    tier: 3,
    title: 'Rests & Silence',
    subtitle: 'Quarter rests and upbeat eighth entrances',
    motif: 'q_rest',
    prerequisiteIds: ['rhythm-2'],
    nextIds: ['rhythm-4'],
    phrases: [
      {
        id: 'r3-p1',
        tier: 3,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.rest_q, CELLS.q, CELLS.rest_q,
          CELLS.e2, CELLS.q, CELLS.rest_q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p2',
        tier: 3,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.upbeat_e, CELLS.q, CELLS.upbeat_e, CELLS.q,
          CELLS.e2, CELLS.rest_q, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p3',
        tier: 3,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.rest_q, CELLS.q,
          CELLS.upbeat_e, CELLS.q, CELLS.rest_q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p4',
        tier: 3,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.rest_q, CELLS.q, CELLS.e2, CELLS.q,
          CELLS.q, CELLS.rest_q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p5',
        tier: 3,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.upbeat_e, CELLS.e2, CELLS.q, CELLS.rest_q,
          CELLS.upbeat_e, CELLS.q, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p6',
        tier: 3,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.note_e_rest_e, CELLS.q, CELLS.rest_q,
          CELLS.note_e_rest_e, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p7',
        tier: 3,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.rest_q, CELLS.e2, CELLS.q,
          CELLS.upbeat_e, CELLS.rest_q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p8',
        tier: 3,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.upbeat_e, CELLS.q, CELLS.rest_q, CELLS.e2,
          CELLS.rest_q, CELLS.upbeat_e, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p9',
        tier: 3,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.e2, CELLS.q, CELLS.q, CELLS.rest_q,
          CELLS.upbeat_e, CELLS.q, CELLS.rest_q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r3-p10',
        tier: 3,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.rest_q, CELLS.upbeat_e, CELLS.e2, CELLS.rest_q,
          CELLS.upbeat_e, CELLS.note_e_rest_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 4: Dotted Quarter & Eighth (4/4 & 3/4)
  {
    id: 'rhythm-4',
    tier: 4,
    title: 'Dotted Quarter & Eighth',
    subtitle: 'The classic anacrustic dotted walk',
    motif: 'dotq_e',
    prerequisiteIds: ['rhythm-3'],
    nextIds: ['rhythm-5'],
    phrases: [
      {
        id: 'r4-p1',
        tier: 4,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.q, CELLS.q,
          CELLS.q, CELLS.tie_e_note_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p2',
        tier: 4,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.e2, CELLS.q,
          CELLS.e2, CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p3',
        tier: 4,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.q,
          CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p4',
        tier: 4,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.e2, CELLS.q, CELLS.q, CELLS.tie_e_note_e,
          CELLS.q, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p5',
        tier: 4,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.q, CELLS.tie_e_note_e,
          CELLS.e2, CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p6',
        tier: 4,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.e2, CELLS.q,
          CELLS.q, CELLS.tie_e_note_e, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p7',
        tier: 4,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.e2,
          CELLS.q, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p8',
        tier: 4,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.q,
          CELLS.q, CELLS.tie_e_note_e, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p9',
        tier: 4,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.e2, CELLS.q, CELLS.q, CELLS.tie_e_note_e,
          CELLS.e2, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r4-p10',
        tier: 4,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.q, CELLS.tie_e_note_e,
          CELLS.q, CELLS.tie_e_note_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 5: Sixteenth-Note Grid (4/4)
  {
    id: 'rhythm-5',
    tier: 5,
    title: 'Sixteenth-Note Grid',
    subtitle: 'Four-sixteenth motor groups',
    motif: 's4',
    prerequisiteIds: ['rhythm-4'],
    nextIds: ['rhythm-6'],
    phrases: [
      {
        id: 'r5-p1',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 68,
        beatCells: [
          CELLS.s4, CELLS.q, CELLS.s4, CELLS.q,
          CELLS.s4, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p2',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 68,
        beatCells: [
          CELLS.q, CELLS.s4, CELLS.e2, CELLS.q,
          CELLS.s4, CELLS.s4, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p3',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.e2, CELLS.s4, CELLS.q, CELLS.q,
          CELLS.s4, CELLS.s4, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p4',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.s4, CELLS.s4, CELLS.s4, CELLS.e2,
          CELLS.q, CELLS.s4, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p5',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.upbeat_e, CELLS.s4, CELLS.e2, CELLS.q,
          CELLS.s4, CELLS.s4, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p6',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 70,
        beatCells: [
          CELLS.q, CELLS.s4, CELLS.q, CELLS.s4,
          CELLS.q, CELLS.s4, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p7',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.s4, CELLS.q, CELLS.q, CELLS.s4,
          CELLS.e2, CELLS.s4, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p8',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.s4, CELLS.q,
          CELLS.s4, CELLS.s4, CELLS.s4, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p9',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.e2, CELLS.s4,
          CELLS.s4, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r5-p10',
        tier: 5,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.s4, CELLS.s4, CELLS.e2, CELLS.s4,
          CELLS.s4, CELLS.q, CELLS.s4, CELLS.q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 6: Forward Gallop (4/4)
  {
    id: 'rhythm-6',
    tier: 6,
    title: 'Forward Gallop',
    subtitle: 'Eighth plus two sixteenths',
    motif: 'gallop',
    prerequisiteIds: ['rhythm-5'],
    nextIds: ['rhythm-7'],
    phrases: [
      {
        id: 'r6-p1',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 68,
        beatCells: [
          CELLS.gallop, CELLS.q, CELLS.gallop, CELLS.q,
          CELLS.gallop, CELLS.gallop, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p2',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.q, CELLS.gallop, CELLS.e2, CELLS.q,
          CELLS.gallop, CELLS.s4, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p3',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.gallop, CELLS.gallop, CELLS.e2, CELLS.q,
          CELLS.s4, CELLS.gallop, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p4',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.gallop, CELLS.e2, CELLS.gallop, CELLS.q,
          CELLS.q, CELLS.gallop, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p5',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.e2, CELLS.gallop, CELLS.gallop, CELLS.q,
          CELLS.gallop, CELLS.s4, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p6',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.q, CELLS.gallop, CELLS.q, CELLS.gallop,
          CELLS.gallop, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p7',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 74,
        beatCells: [
          CELLS.gallop, CELLS.gallop, CELLS.q, CELLS.e2,
          CELLS.q, CELLS.gallop, CELLS.gallop, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p8',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.e2, CELLS.gallop, CELLS.e2, CELLS.gallop,
          CELLS.gallop, CELLS.gallop, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p9',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.q, CELLS.gallop,
          CELLS.gallop, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r6-p10',
        tier: 6,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.gallop, CELLS.gallop, CELLS.gallop, CELLS.q,
          CELLS.gallop, CELLS.e2, CELLS.gallop, CELLS.q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 7: Reverse Gallop (4/4)
  {
    id: 'rhythm-7',
    tier: 7,
    title: 'Reverse Gallop',
    subtitle: 'Two sixteenths plus eighth',
    motif: 'rev_gallop',
    prerequisiteIds: ['rhythm-6'],
    nextIds: ['rhythm-8'],
    phrases: [
      {
        id: 'r7-p1',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 68,
        beatCells: [
          CELLS.rev_gallop, CELLS.q, CELLS.rev_gallop, CELLS.q,
          CELLS.rev_gallop, CELLS.rev_gallop, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p2',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.rev_gallop, CELLS.gallop, CELLS.q, CELLS.q,
          CELLS.gallop, CELLS.rev_gallop, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p3',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.q, CELLS.rev_gallop, CELLS.e2, CELLS.q,
          CELLS.rev_gallop, CELLS.s4, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p4',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.rev_gallop, CELLS.rev_gallop, CELLS.e2, CELLS.q,
          CELLS.s4, CELLS.rev_gallop, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p5',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.e2, CELLS.rev_gallop, CELLS.gallop, CELLS.q,
          CELLS.rev_gallop, CELLS.rev_gallop, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p6',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.q, CELLS.rev_gallop, CELLS.q, CELLS.rev_gallop,
          CELLS.rev_gallop, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p7',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 74,
        beatCells: [
          CELLS.rev_gallop, CELLS.q, CELLS.rev_gallop, CELLS.e2,
          CELLS.q, CELLS.rev_gallop, CELLS.rev_gallop, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p8',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.rev_gallop, CELLS.rev_gallop, CELLS.rev_gallop, CELLS.q,
          CELLS.e2, CELLS.rev_gallop, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p9',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.q, CELLS.rev_gallop,
          CELLS.rev_gallop, CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r7-p10',
        tier: 7,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.rev_gallop, CELLS.gallop, CELLS.rev_gallop, CELLS.q,
          CELLS.rev_gallop, CELLS.rev_gallop, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 8: Dotted Eighth & Sixteenth (4/4)
  {
    id: 'rhythm-8',
    tier: 8,
    title: 'Dotted Eighth & Sixteenth',
    subtitle: 'Sharp march rhythms and Scotch snaps',
    motif: 'dot8_s',
    prerequisiteIds: ['rhythm-7'],
    nextIds: ['rhythm-9'],
    phrases: [
      {
        id: 'r8-p1',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 66,
        beatCells: [
          CELLS.dot8_s, CELLS.dot8_s, CELLS.q, CELLS.q,
          CELLS.dot8_s, CELLS.dot8_s, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p2',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 68,
        beatCells: [
          CELLS.scotch_snap, CELLS.scotch_snap, CELLS.q, CELLS.q,
          CELLS.dot8_s, CELLS.scotch_snap, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p3',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 68,
        beatCells: [
          CELLS.q, CELLS.dot8_s, CELLS.e2, CELLS.q,
          CELLS.dot8_s, CELLS.dot8_s, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p4',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.dot8_s, CELLS.e2, CELLS.dot8_s, CELLS.q,
          CELLS.scotch_snap, CELLS.dot8_s, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p5',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.dot8_s, CELLS.gallop, CELLS.dot8_s, CELLS.q,
          CELLS.dot8_s, CELLS.s4, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p6',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 68,
        beatCells: [
          CELLS.q, CELLS.dot8_s, CELLS.q, CELLS.dot8_s,
          CELLS.dot8_s, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p7',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 70,
        beatCells: [
          CELLS.dot8_s, CELLS.scotch_snap, CELLS.dot8_s, CELLS.q,
          CELLS.scotch_snap, CELLS.dot8_s, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p8',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.dot8_s, CELLS.dot8_s, CELLS.dot8_s, CELLS.q,
          CELLS.dot8_s, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p9',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 74,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.q, CELLS.dot8_s,
          CELLS.dot8_s, CELLS.dot8_s, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r8-p10',
        tier: 8,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.dot8_s, CELLS.dot8_s, CELLS.scotch_snap, CELLS.q,
          CELLS.dot8_s, CELLS.scotch_snap, CELLS.dot8_s, CELLS.q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 9: Off-Beat Syncopation (4/4 & 3/4)
  {
    id: 'rhythm-9',
    tier: 9,
    title: 'Off-Beat Syncopation',
    subtitle: 'Classic eighth-quarter-eighth syncopation',
    motif: 'sync_e_q_e',
    prerequisiteIds: ['rhythm-8'],
    nextIds: ['rhythm-10'],
    phrases: [
      {
        id: 'r9-p1',
        tier: 9,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q, CELLS.q,
          CELLS.e2, CELLS.tie_e_note_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p2',
        tier: 9,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.tie_e_note_e, CELLS.q,
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p3',
        tier: 9,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q,
          CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p4',
        tier: 9,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.e2, CELLS.tie_e_note_e, CELLS.e2, CELLS.tie_e_note_e,
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p5',
        tier: 9,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.upbeat_e, CELLS.tie_e_note_e, CELLS.e2, CELLS.q,
          CELLS.e2, CELLS.tie_e_note_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p6',
        tier: 9,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 78,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.tie_e_note_e, CELLS.q,
          CELLS.q, CELLS.e2, CELLS.tie_e_note_e, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p7',
        tier: 9,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.tie_e_note_e,
          CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p8',
        tier: 9,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q,
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p9',
        tier: 9,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 82,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.e2, CELLS.tie_e_note_e,
          CELLS.e2, CELLS.tie_e_note_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r9-p10',
        tier: 9,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.e2, CELLS.tie_e_note_e, CELLS.e2, CELLS.tie_e_note_e,
          CELLS.e2, CELLS.tie_e_note_e, CELLS.e2, CELLS.q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 10: Ties Across the Beat (4/4 & 3/4)
  {
    id: 'rhythm-10',
    tier: 10,
    title: 'Ties Across the Beat',
    subtitle: 'Sustaining across silent downbeats',
    motif: 'tie_across',
    prerequisiteIds: ['rhythm-9'],
    nextIds: ['rhythm-11'],
    phrases: [
      {
        id: 'r10-p1',
        tier: 10,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.e2, CELLS.tie_e_note_e,
          CELLS.q, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p2',
        tier: 10,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.e2, CELLS.q, CELLS.q, CELLS.tie_e_note_e,
          CELLS.e2, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p3',
        tier: 10,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q,
          CELLS.q, CELLS.tie_e_note_e, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p4',
        tier: 10,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.h_start, CELLS.hold_q, CELLS.q, CELLS.tie_e_note_e,
          CELLS.q, CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p5',
        tier: 10,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.tie_e_note_e, CELLS.e2, CELLS.q,
          CELLS.e2, CELLS.tie_e_note_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p6',
        tier: 10,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 78,
        beatCells: [
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q, CELLS.q,
          CELLS.q, CELLS.tie_e_note_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p7',
        tier: 10,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.q, CELLS.tie_e_note_e,
          CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p8',
        tier: 10,
        timeSignature: '3/4',
        beatsPerBar: 3,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.e2, CELLS.q, CELLS.tie_e_note_e,
          CELLS.q, CELLS.tie_e_note_e, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p9',
        tier: 10,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.q, CELLS.tie_e_note_e,
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r10-p10',
        tier: 10,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.e2, CELLS.tie_e_note_e, CELLS.q, CELLS.tie_e_note_e,
          CELLS.q, CELLS.tie_e_note_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 11: Compound 6/8 & Triplets
  {
    id: 'rhythm-11',
    tier: 11,
    title: 'Compound 6/8 & Triplets',
    subtitle: 'Rolling triplets and compound duple meter',
    motif: 'compound_6_8',
    prerequisiteIds: ['rhythm-10'],
    nextIds: ['rhythm-12'],
    phrases: [
      {
        id: 'r11-p1',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.triplet_e, CELLS.q, CELLS.triplet_e, CELLS.q,
          CELLS.triplet_e, CELLS.triplet_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p2',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.e2, CELLS.triplet_e, CELLS.e2, CELLS.triplet_e,
          CELLS.q, CELLS.triplet_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p3',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.triplet_e, CELLS.e2, CELLS.triplet_e, CELLS.q,
          CELLS.triplet_e, CELLS.triplet_e, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p4',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.triplet_e, CELLS.q, CELLS.triplet_e,
          CELLS.e2, CELLS.triplet_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p5',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.triplet_e, CELLS.triplet_e, CELLS.triplet_e, CELLS.triplet_e,
          CELLS.q, CELLS.triplet_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p6',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 72,
        beatCells: [
          CELLS.q, CELLS.triplet_e, CELLS.triplet_e, CELLS.q,
          CELLS.q, CELLS.triplet_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p7',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 74,
        beatCells: [
          CELLS.triplet_e, CELLS.e2, CELLS.q, CELLS.triplet_e,
          CELLS.e2, CELLS.triplet_e, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p8',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.triplet_e, CELLS.e2, CELLS.q,
          CELLS.triplet_e, CELLS.triplet_e, CELLS.triplet_e, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p9',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.q, CELLS.triplet_e,
          CELLS.triplet_e, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r11-p10',
        tier: 11,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.triplet_e, CELLS.triplet_e, CELLS.e2, CELLS.triplet_e,
          CELLS.triplet_e, CELLS.triplet_e, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
    ],
  },

  // Tier 12: Pop & Ragtime Groove
  {
    id: 'rhythm-12',
    tier: 12,
    title: 'Pop & Ragtime Groove',
    subtitle: 'Intra-beat sixteenth syncopation and ragtime cells',
    motif: 'rag_sync',
    prerequisiteIds: ['rhythm-11'],
    nextIds: [],
    phrases: [
      {
        id: 'r12-p1',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.sync_16_8_16, CELLS.q, CELLS.sync_16_8_16, CELLS.q,
          CELLS.sync_16_8_16, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p2',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.sync_16_8_16, CELLS.e2, CELLS.q,
          CELLS.sync_16_8_16, CELLS.sync_16_8_16, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p3',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.sync_16_8_16, CELLS.gallop, CELLS.sync_16_8_16, CELLS.q,
          CELLS.s4, CELLS.sync_16_8_16, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p4',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.e2, CELLS.sync_16_8_16, CELLS.q, CELLS.sync_16_8_16,
          CELLS.sync_16_8_16, CELLS.e2, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p5',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.pickup_3s, CELLS.sync_16_8_16, CELLS.e2, CELLS.q,
          CELLS.sync_16_8_16, CELLS.s4, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p6',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 76,
        beatCells: [
          CELLS.q, CELLS.sync_16_8_16, CELLS.q, CELLS.sync_16_8_16,
          CELLS.sync_16_8_16, CELLS.q, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p7',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 78,
        beatCells: [
          CELLS.pickup_3s, CELLS.q, CELLS.sync_16_8_16, CELLS.e2,
          CELLS.sync_16_8_16, CELLS.sync_16_8_16, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p8',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.sync_16_8_16, CELLS.sync_16_8_16, CELLS.e2, CELLS.q,
          CELLS.sync_16_8_16, CELLS.sync_16_8_16, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p9',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 80,
        beatCells: [
          CELLS.q, CELLS.e2, CELLS.q, CELLS.sync_16_8_16,
          CELLS.sync_16_8_16, CELLS.e2, CELLS.q, CELLS.q,
          CELLS.q,
        ],
      },
      {
        id: 'r12-p10',
        tier: 12,
        timeSignature: '4/4',
        beatsPerBar: 4,
        beatUnit: 4,
        targetBpm: 84,
        beatCells: [
          CELLS.pickup_3s, CELLS.sync_16_8_16, CELLS.gallop, CELLS.sync_16_8_16,
          CELLS.sync_16_8_16, CELLS.s4, CELLS.h_start, CELLS.hold_q,
          CELLS.q,
        ],
      },
    ],
  },
];

export const RHYTHM_LEVELS_BY_ID: ReadonlyMap<string, RhythmLevelSpec> = new Map(
  RHYTHM_LEVELS.map((lvl) => [lvl.id, lvl])
);

export function getRhythmLevelById(id: string): RhythmLevelSpec {
  const lvl = RHYTHM_LEVELS_BY_ID.get(id);
  if (!lvl) {
    throw new Error(`Rhythm level with ID "${id}" not found.`);
  }
  return lvl;
}

export function isRhythmLevelId(id: string): boolean {
  return id.startsWith('rhythm-');
}
