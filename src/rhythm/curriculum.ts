import {
  FlattenedRhythmNote,
  RhythmBeatCell,
  RhythmLevelSpec,
  RhythmPhrase,
} from '../types/rhythm';

export type StandardCellKey =
  | 'q'
  | 'rest_q'
  | 'hold_q'
  | 'h_start'
  | 'e2'
  | 'upbeat_e'
  | 'tie_e_note_e'
  | 's4'
  | 'gallop'
  | 'rev_gallop'
  | 'dot8_s'
  | 'scotch_snap'
  | 'sync_16_8_16'
  | 'pickup_3s'
  | 'rest8_2s'
  | 'triplet_e';

export const CELL_LIBRARY: Record<StandardCellKey, RhythmBeatCell> = {
  q: {
    cellId: 'q',
    label: 'Quarter (♩)',
    symbol: '♩',
    events: [{ offsetBeats: 0, durationBeats: 1.0, kind: 'note' }],
  },
  rest_q: {
    cellId: 'rest_q',
    label: 'Quarter Rest (𝄽)',
    symbol: '𝄽',
    events: [{ offsetBeats: 0, durationBeats: 1.0, kind: 'rest' }],
  },
  hold_q: {
    cellId: 'hold_q',
    label: 'Tied Quarter Hold',
    symbol: '⁐♩',
    events: [{ offsetBeats: 0, durationBeats: 1.0, kind: 'note', tiedFromPrev: true }],
  },
  h_start: {
    cellId: 'h_start',
    label: 'Half Note Start (𝅗𝅥)',
    symbol: '𝅗𝅥',
    events: [{ offsetBeats: 0, durationBeats: 1.0, kind: 'note' }],
  },
  e2: {
    cellId: 'e2',
    label: 'Two Eighths (♫)',
    symbol: '♫',
    events: [
      { offsetBeats: 0, durationBeats: 0.5, kind: 'note' },
      { offsetBeats: 0.5, durationBeats: 0.5, kind: 'note' },
    ],
  },
  upbeat_e: {
    cellId: 'upbeat_e',
    label: 'Eighth Rest + Eighth (𝄾 ♪)',
    symbol: '𝄾 ♪',
    events: [
      { offsetBeats: 0, durationBeats: 0.5, kind: 'rest' },
      { offsetBeats: 0.5, durationBeats: 0.5, kind: 'note' },
    ],
  },
  tie_e_note_e: {
    cellId: 'tie_e_note_e',
    label: 'Tied Eighth + Eighth',
    symbol: '⁐♪ ♪',
    events: [
      { offsetBeats: 0, durationBeats: 0.5, kind: 'note', tiedFromPrev: true },
      { offsetBeats: 0.5, durationBeats: 0.5, kind: 'note' },
    ],
  },
  s4: {
    cellId: 's4',
    label: 'Four Sixteenths (♬♬)',
    symbol: '♬♬',
    events: [
      { offsetBeats: 0, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.25, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.5, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.75, durationBeats: 0.25, kind: 'note' },
    ],
  },
  gallop: {
    cellId: 'gallop',
    label: 'Eighth + Two Sixteenths (♪ ♬)',
    symbol: '♪ ♬',
    events: [
      { offsetBeats: 0, durationBeats: 0.5, kind: 'note' },
      { offsetBeats: 0.5, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.75, durationBeats: 0.25, kind: 'note' },
    ],
  },
  rev_gallop: {
    cellId: 'rev_gallop',
    label: 'Two Sixteenths + Eighth (♬ ♪)',
    symbol: '♬ ♪',
    events: [
      { offsetBeats: 0, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.25, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.5, durationBeats: 0.5, kind: 'note' },
    ],
  },
  dot8_s: {
    cellId: 'dot8_s',
    label: 'Dotted Eighth + Sixteenth (♪. ♬)',
    symbol: '♪. ♬',
    events: [
      { offsetBeats: 0, durationBeats: 0.75, kind: 'note' },
      { offsetBeats: 0.75, durationBeats: 0.25, kind: 'note' },
    ],
  },
  scotch_snap: {
    cellId: 'scotch_snap',
    label: 'Sixteenth + Dotted Eighth (♬ ♪.)',
    symbol: '♬ ♪.',
    events: [
      { offsetBeats: 0, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.25, durationBeats: 0.75, kind: 'note' },
    ],
  },
  sync_16_8_16: {
    cellId: 'sync_16_8_16',
    label: 'Sixteenth Syncopation (♬ ♪ ♬)',
    symbol: '♬ ♪ ♬',
    events: [
      { offsetBeats: 0, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.25, durationBeats: 0.5, kind: 'note' },
      { offsetBeats: 0.75, durationBeats: 0.25, kind: 'note' },
    ],
  },
  pickup_3s: {
    cellId: 'pickup_3s',
    label: 'Sixteenth Rest + 3 Sixteenths (𝄿 ♬♪)',
    symbol: '𝄿 ♬♪',
    events: [
      { offsetBeats: 0, durationBeats: 0.25, kind: 'rest' },
      { offsetBeats: 0.25, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.5, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.75, durationBeats: 0.25, kind: 'note' },
    ],
  },
  rest8_2s: {
    cellId: 'rest8_2s',
    label: 'Eighth Rest + Two Sixteenths (𝄾 ♬)',
    symbol: '𝄾 ♬',
    events: [
      { offsetBeats: 0, durationBeats: 0.5, kind: 'rest' },
      { offsetBeats: 0.5, durationBeats: 0.25, kind: 'note' },
      { offsetBeats: 0.75, durationBeats: 0.25, kind: 'note' },
    ],
  },
  triplet_e: {
    cellId: 'triplet_e',
    label: 'Eighth Triplet (3♫♪)',
    symbol: '3♫♪',
    events: [
      { offsetBeats: 0, durationBeats: 1 / 3, kind: 'note' },
      { offsetBeats: 1 / 3, durationBeats: 1 / 3, kind: 'note' },
      { offsetBeats: 2 / 3, durationBeats: 1 / 3, kind: 'note' },
    ],
  },
};

/**
 * Flattens a RhythmPhrase into an array of concrete notes,
 * merging any tied events (tiedFromPrev: true) onto the previous note's duration.
 * Marks the final note with isLandingNote: true.
 */
export function flattenPhraseToNotes(phrase: RhythmPhrase): FlattenedRhythmNote[] {
  const notes: FlattenedRhythmNote[] = [];

  let currentBeat = 0;
  for (let b = 0; b < phrase.beatCells.length; b++) {
    const cell = phrase.beatCells[b];
    if (!cell) continue;
    for (const evt of cell.events) {
      const globalOffset = currentBeat + evt.offsetBeats;
      if (evt.kind === 'note') {
        const lastIdx = notes.length - 1;
        const prev = notes[lastIdx];
        if (evt.tiedFromPrev && prev) {
          notes[lastIdx] = {
            ...prev,
            durationBeats: Number((prev.durationBeats + evt.durationBeats).toFixed(4)),
          };
        } else {
          notes.push({
            index: notes.length,
            beatIndex: b,
            startBeat: Number(globalOffset.toFixed(4)),
            durationBeats: Number(evt.durationBeats.toFixed(4)),
            isLandingNote: false,
          });
        }
      }
    }
    currentBeat += 1;
  }

  // Re-index notes sequentially
  const flattened: FlattenedRhythmNote[] = notes.map((n, i) => ({
    ...n,
    index: i,
    isLandingNote: i === notes.length - 1,
  }));

  return flattened;
}

export const RHYTHM_LEVELS: readonly RhythmLevelSpec[] = [
  {
    id: 'rhythm-1',
    tier: 1,
    title: 'Tier 1: Pulse, Stride & Space',
    subtitle: 'Quarter Notes, Eighths, Half Notes & Rests',
    description:
      'Master steady walking pulse, subdivisions, and resting spaces covering 62% of piano repertoire.',
    featuredCellSymbols: ['♩', '♫', '𝅗𝅥', '𝄽'],
    phrases: [
      {
        id: 'r1-capsule-1',
        title: 'Quarter Stride',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 76,
        beatCells: [CELL_LIBRARY.q, CELL_LIBRARY.q, CELL_LIBRARY.q, CELL_LIBRARY.q, CELL_LIBRARY.q],
      },
      {
        id: 'r1-capsule-2',
        title: 'Eighth Flow',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 76,
        beatCells: [CELL_LIBRARY.e2, CELL_LIBRARY.e2, CELL_LIBRARY.q, CELL_LIBRARY.q, CELL_LIBRARY.q],
      },
      {
        id: 'r1-capsule-3',
        title: 'Rest & Breath',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 76,
        beatCells: [CELL_LIBRARY.q, CELL_LIBRARY.rest_q, CELL_LIBRARY.q, CELL_LIBRARY.rest_q, CELL_LIBRARY.q],
      },
      {
        id: 'r1-capsule-4',
        title: 'Sustained Half Stride',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 76,
        beatCells: [
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r1-mozart-k545',
        title: 'Sonata in C Major, K. 545',
        sourceComposer: 'W.A. Mozart — Sonata in C, K. 545 (1st mvt)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 84,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.q,
          // Bar 2
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.q,
          // Bar 3
          CELL_LIBRARY.e2,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.e2,
          // Bar 4
          CELL_LIBRARY.q,
          CELL_LIBRARY.rest_q,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat (Bar 5, Beat 1)
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r1-beethoven-sym7',
        title: 'Allegretto Stride',
        sourceComposer: 'L.v. Beethoven — Symphony No. 7 Op. 92 (2nd mvt)',
        timeSignature: '2/4',
        beatsPerBar: 2,
        targetBpm: 76,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.q,
          CELL_LIBRARY.e2,
          // Bar 2
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          // Bar 3
          CELL_LIBRARY.q,
          CELL_LIBRARY.e2,
          // Bar 4
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
    ],
  },
  {
    id: 'rhythm-2',
    tier: 2,
    title: 'Tier 2: The Upbeat & Dotted Walk',
    subtitle: 'Dotted Quarter-Eighth & Upbeat Entrances',
    description:
      'Learn the forward-propelling momentum of the dotted quarter and upbeat anacrusis landing cleanly on the downbeat.',
    featuredCellSymbols: ['♩. ♪', '𝄾 ♪'],
    phrases: [
      {
        id: 'r2-capsule-1',
        title: 'Dotted Quarter Walk',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 72,
        beatCells: [
          CELL_LIBRARY.q,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r2-capsule-2',
        title: 'Upbeat Entrance & Landing',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 76,
        beatCells: [
          CELL_LIBRARY.upbeat_e,
          CELL_LIBRARY.q,
          CELL_LIBRARY.upbeat_e,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r2-capsule-3',
        title: 'Upbeat into Running Eighths',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 76,
        beatCells: [
          CELL_LIBRARY.upbeat_e,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r2-mozart-k279',
        title: 'Sonata in C Major, K. 279',
        sourceComposer: 'W.A. Mozart — Sonata in C, K. 279 (mm. 26–29)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 80,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.q,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.e2,
          // Bar 2
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.rest_q,
          // Bar 3
          CELL_LIBRARY.q,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.e2,
          // Bar 4
          CELL_LIBRARY.e2,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r2-bach-fugue',
        title: 'Fugue in D♯ Minor, WTC II',
        sourceComposer: 'J.S. Bach — Fugue in D# Minor, BWV 877',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 66,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.upbeat_e,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.tie_e_note_e,
          // Bar 2
          CELL_LIBRARY.e2,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
    ],
  },
  {
    id: 'rhythm-3',
    tier: 3,
    title: 'Tier 3: Classic Syncopation & Ties',
    subtitle: 'Off-Beat Accents & Silent Downbeats',
    description: 'Sustain across the strong metric pulse while maintaining steady internal time.',
    featuredCellSymbols: ['♪ ♩ ♪', '♫ tie'],
    phrases: [
      {
        id: 'r3-capsule-1',
        title: 'Calypso Syncopation',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 80,
        beatCells: [
          CELL_LIBRARY.e2,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r3-capsule-2',
        title: 'Two-Bar Syncopation Chain',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 80,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.e2,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.tie_e_note_e,
          // Bar 2
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r3-beethoven-tempest',
        title: 'Tempest Sonata Op. 31 No. 2',
        sourceComposer: 'L.v. Beethoven — Piano Sonata Op. 31 No. 2 (3rd mvt)',
        timeSignature: '3/4',
        beatsPerBar: 3,
        targetBpm: 84,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.upbeat_e,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.q,
          // Bar 2
          CELL_LIBRARY.e2,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.q,
          // Bar 3
          CELL_LIBRARY.e2,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.q,
          // Bar 4
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.rest_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r3-chopin-nocturne',
        title: 'Nocturne Op. 9 No. 2',
        sourceComposer: 'F. Chopin — Nocturne Op. 9 No. 2',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 66,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.q,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.tie_e_note_e,
          // Bar 2
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
    ],
  },
  {
    id: 'rhythm-4',
    tier: 4,
    title: 'Tier 4: Sixteenth Words & 2× Metric Zoom',
    subtitle: 'Four-Sixteenths, Gallop, Reverse Gallop & Metric Scaling',
    description:
      'Master fast 1-beat sixteenth gestures and experience the 2x Metric Zoom bridge between eighth-note and sixteenth-note grooves.',
    featuredCellSymbols: ['♬♬', '♪ ♬', '♬ ♪', '𝄿 ♬♪'],
    phrases: [
      {
        id: 'r4-four-sixteenths',
        title: 'Four Sixteenths Engine',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 68,
        beatCells: [
          CELL_LIBRARY.s4,
          CELL_LIBRARY.q,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'gallop-1x',
        title: 'Gallop Gesture (1× Zoom)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 68,
        zoomTwinPhraseId: 'gallop-2x',
        zoomScaleLabel: '1x (Sixteenth Level)',
        beatCells: [
          CELL_LIBRARY.gallop,
          CELL_LIBRARY.q,
          CELL_LIBRARY.gallop,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'gallop-2x',
        title: 'Gallop Twin (2× Zoom)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 136,
        zoomTwinPhraseId: 'gallop-1x',
        zoomScaleLabel: '2x (Eighth Level)',
        beatCells: [
          CELL_LIBRARY.q,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r4-reverse-gallop',
        title: 'Reverse Gallop',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 68,
        beatCells: [
          CELL_LIBRARY.rev_gallop,
          CELL_LIBRARY.q,
          CELL_LIBRARY.rev_gallop,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r4-sixteenth-upbeat',
        title: 'Sixteenth Upbeat Pickup',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 68,
        beatCells: [
          CELL_LIBRARY.pickup_3s,
          CELL_LIBRARY.q,
          CELL_LIBRARY.pickup_3s,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r4-bach-bwv847',
        title: 'Fugue in C Minor, BWV 847',
        sourceComposer: 'J.S. Bach — Fugue in C Minor, WTC I (mm. 1–3)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 68,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.upbeat_e,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.e2,
          // Bar 2
          CELL_LIBRARY.s4,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.e2,
          // Bar 3
          CELL_LIBRARY.s4,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r4-mozart-k279-allegro',
        title: 'Sonata in C, K. 279 Allegro',
        sourceComposer: 'W.A. Mozart — Sonata in C, K. 279 (mm. 4–7)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 76,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.gallop,
          CELL_LIBRARY.gallop,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          // Bar 2
          CELL_LIBRARY.s4,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.q,
          CELL_LIBRARY.rest_q,
          // Bar 3
          CELL_LIBRARY.gallop,
          CELL_LIBRARY.gallop,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          // Bar 4
          CELL_LIBRARY.s4,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
    ],
  },
  {
    id: 'rhythm-5',
    tier: 5,
    title: 'Tier 5: Dotted Sixteenth Snaps & Funk Cells',
    subtitle: 'Dotted Sixteenth-Thirtysecond / Sixteenth, Scotch Snaps & Syncopated Sixteenths',
    description:
      'Master crisp dotted sixteenth articulations and ragtime/syncopation grooves.',
    featuredCellSymbols: ['♪. ♬', '♬ ♪.', '♬ ♪ ♬'],
    phrases: [
      {
        id: 'dot8_s-1x',
        title: 'Dotted Sixteenth Snap (1× Zoom)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 66,
        zoomTwinPhraseId: 'dot8_s-2x',
        zoomScaleLabel: '1x (Sixteenth Level)',
        beatCells: [
          CELL_LIBRARY.dot8_s,
          CELL_LIBRARY.dot8_s,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'dot8_s-2x',
        title: 'Dotted Sixteenth Twin (2× Zoom)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 132,
        zoomTwinPhraseId: 'dot8_s-1x',
        zoomScaleLabel: '2x (Eighth Level)',
        beatCells: [
          CELL_LIBRARY.q,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.q,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'sync-1x',
        title: 'Intra-Beat Syncopation (1× Zoom)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 68,
        zoomTwinPhraseId: 'sync-2x',
        zoomScaleLabel: '1x (Sixteenth Level)',
        beatCells: [
          CELL_LIBRARY.sync_16_8_16,
          CELL_LIBRARY.q,
          CELL_LIBRARY.sync_16_8_16,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'sync-2x',
        title: 'Intra-Beat Twin (2× Zoom)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 136,
        zoomTwinPhraseId: 'sync-1x',
        zoomScaleLabel: '2x (Eighth Level)',
        beatCells: [
          CELL_LIBRARY.e2,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.tie_e_note_e,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r5-scotch-snap',
        title: 'Scotch Snap (Strathspey)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 68,
        beatCells: [
          CELL_LIBRARY.scotch_snap,
          CELL_LIBRARY.q,
          CELL_LIBRARY.scotch_snap,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r5-chopin-raindrop',
        title: 'Raindrop Prelude Op. 28 No. 15',
        sourceComposer: 'F. Chopin — Prelude in Db Major, Op. 28 No. 15 (mm. 5–8)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 66,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.dot8_s,
          CELL_LIBRARY.dot8_s,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          // Bar 2
          CELL_LIBRARY.dot8_s,
          CELL_LIBRARY.dot8_s,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Bar 3
          CELL_LIBRARY.dot8_s,
          CELL_LIBRARY.dot8_s,
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          // Bar 4
          CELL_LIBRARY.q,
          CELL_LIBRARY.q,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r5-joplin-winners',
        title: 'The Easy Winners',
        sourceComposer: 'S. Joplin — The Easy Winners (mm. 1–4)',
        timeSignature: '2/4',
        beatsPerBar: 2,
        targetBpm: 80,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.sync_16_8_16,
          CELL_LIBRARY.e2,
          // Bar 2
          CELL_LIBRARY.sync_16_8_16,
          CELL_LIBRARY.q,
          // Bar 3
          CELL_LIBRARY.sync_16_8_16,
          CELL_LIBRARY.e2,
          // Bar 4
          CELL_LIBRARY.s4,
          CELL_LIBRARY.q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
    ],
  },
  {
    id: 'r6-triplet-flow',
    tier: 6,
    title: 'Tier 6: Triplet Flow & Two-Hand Groove',
    subtitle: 'Eighth-Note Triplets & Duple-Triple Polyrhythmic Feel',
    description:
      'Master continuous triplet flow and smooth transitions between duple and triple subdivisions.',
    featuredCellSymbols: ['3♫♪', '♫ vs 3♫♪'],
    phrases: [
      {
        id: 'r6-triplet-flow',
        title: 'Continuous Triplet Flow',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 72,
        beatCells: [
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r6-duple-triple',
        title: 'Duple to Triplet Shift',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 72,
        beatCells: [
          CELL_LIBRARY.e2,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.e2,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r6-beethoven-moonlight',
        title: 'Moonlight Sonata Op. 27 No. 2',
        sourceComposer: 'L.v. Beethoven — Piano Sonata Op. 27 No. 2 (1st mvt)',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 60,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.triplet_e,
          // Bar 2
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
      {
        id: 'r6-chopin-fantaisie',
        title: 'Fantaisie-Impromptu Op. 66',
        sourceComposer: 'F. Chopin — Fantaisie-Impromptu Op. 66',
        timeSignature: '4/4',
        beatsPerBar: 4,
        targetBpm: 80,
        beatCells: [
          // Bar 1
          CELL_LIBRARY.s4,
          CELL_LIBRARY.triplet_e,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.triplet_e,
          // Bar 2
          CELL_LIBRARY.s4,
          CELL_LIBRARY.s4,
          CELL_LIBRARY.h_start,
          CELL_LIBRARY.hold_q,
          // Landing Beat
          CELL_LIBRARY.q,
        ],
      },
    ],
  },
];

export function getRhythmLevelById(id: string): RhythmLevelSpec | undefined {
  return RHYTHM_LEVELS.find((lvl) => lvl.id === id);
}

export function findPhraseById(phraseId: string): { level: RhythmLevelSpec; phrase: RhythmPhrase } | undefined {
  for (const level of RHYTHM_LEVELS) {
    const phrase = level.phrases.find((p) => p.id === phraseId);
    if (phrase) {
      return { level, phrase };
    }
  }
  return undefined;
}

export function findZoomTwinPhrase(phrase: RhythmPhrase): RhythmPhrase | undefined {
  if (!phrase.zoomTwinPhraseId) return undefined;
  const match = findPhraseById(phrase.zoomTwinPhraseId);
  return match?.phrase;
}
