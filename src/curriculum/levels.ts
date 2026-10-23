import { createTarget } from '../music/pitch';
import { KeySignatureId } from '../music/scales';
import { ClefLane, LevelSpec } from '../types/curriculum';
import { Clef, StaffNoteTarget } from '../types/music';

function sortTargetsByDiatonic(targets: readonly StaffNoteTarget[]): StaffNoteTarget[] {
  return [...targets].sort((a, b) => a.pitch.diatonicStep - b.pitch.diatonicStep);
}

function getInterval(targets: readonly StaffNoteTarget[], clef: Clef): readonly [StaffNoteTarget, StaffNoteTarget] | undefined {
  const filtered = targets.filter((t) => t.clef === clef);
  if (filtered.length === 0) return undefined;
  const sorted = sortTargetsByDiatonic(filtered);
  const lowest = sorted[0]!;
  const highest = sorted[sorted.length - 1]!;
  return [lowest, highest] as const;
}

// Definition of single-clef tiers (1..12)
interface TierDefinition {
  tier: number;
  keySignature: KeySignatureId;
  trebleNewPitchIds: string[];
  bassNewPitchIds: string[];
}

const TIER_DEFINITIONS: TierDefinition[] = [
  {
    tier: 1,
    keySignature: 'C_MAJOR',
    trebleNewPitchIds: ['C4', 'D4', 'E4'],
    bassNewPitchIds: ['C3', 'D3', 'E3'],
  },
  {
    tier: 2,
    keySignature: 'C_MAJOR',
    trebleNewPitchIds: ['F4', 'G4'],
    bassNewPitchIds: ['F3', 'G3'],
  },
  {
    tier: 3,
    keySignature: 'C_MAJOR',
    trebleNewPitchIds: ['B3', 'A3'],
    bassNewPitchIds: ['A3', 'B3'],
  },
  {
    tier: 4,
    keySignature: 'C_MAJOR',
    trebleNewPitchIds: ['A4', 'B4'],
    bassNewPitchIds: ['C4', 'B2'],
  },
  {
    tier: 5,
    keySignature: 'C_MAJOR',
    trebleNewPitchIds: ['C5', 'D5'],
    bassNewPitchIds: ['A2', 'G2'],
  },
  {
    tier: 6,
    keySignature: 'C_MAJOR',
    trebleNewPitchIds: ['E5', 'F5'],
    bassNewPitchIds: ['F2', 'E2'],
  },
  {
    tier: 7,
    keySignature: 'C_MAJOR',
    trebleNewPitchIds: ['G5', 'A5'],
    bassNewPitchIds: ['D2', 'C2'],
  },
  {
    tier: 8,
    keySignature: 'C_MAJOR',
    trebleNewPitchIds: ['B5', 'C6'],
    bassNewPitchIds: ['D4', 'E4'],
  },
  {
    tier: 9,
    keySignature: 'G_MAJOR',
    trebleNewPitchIds: ['F#4', 'F#5'],
    bassNewPitchIds: ['F#2', 'F#3'],
  },
  {
    tier: 10,
    keySignature: 'F_MAJOR',
    trebleNewPitchIds: ['Bb3', 'Bb4', 'Bb5'],
    bassNewPitchIds: ['Bb2', 'Bb3'],
  },
  {
    tier: 11,
    keySignature: 'D_MAJOR',
    trebleNewPitchIds: ['C#4', 'C#5', 'C#6'],
    bassNewPitchIds: ['C#2', 'C#3', 'C#4'],
  },
  {
    tier: 12,
    keySignature: 'BB_MAJOR',
    trebleNewPitchIds: ['Eb4', 'Eb5'],
    bassNewPitchIds: ['Eb2', 'Eb3', 'Eb4'],
  },
];

function buildAllLevels(): LevelSpec[] {
  const levelsById = new Map<string, LevelSpec>();

  // Intermediate state maps for progressive note pools
  const trebleNotesByTier = new Map<number, StaffNoteTarget[]>();
  const bassNotesByTier = new Map<number, StaffNoteTarget[]>();
  const trebleNewNotesByTier = new Map<number, StaffNoteTarget[]>();
  const bassNewNotesByTier = new Map<number, StaffNoteTarget[]>();

  // Tiers 1-8 accumulate natural notes
  let curTrebleNotes: StaffNoteTarget[] = [];
  let curBassNotes: StaffNoteTarget[] = [];

  for (let tier = 1; tier <= 8; tier++) {
    const def = TIER_DEFINITIONS[tier - 1]!;
    const newTreble = def.trebleNewPitchIds.map((id) => createTarget('treble', id));
    const newBass = def.bassNewPitchIds.map((id) => createTarget('bass', id));

    curTrebleNotes = [...curTrebleNotes, ...newTreble];
    curBassNotes = [...curBassNotes, ...newBass];

    trebleNotesByTier.set(tier, sortTargetsByDiatonic(curTrebleNotes));
    bassNotesByTier.set(tier, sortTargetsByDiatonic(curBassNotes));
    trebleNewNotesByTier.set(tier, newTreble);
    bassNewNotesByTier.set(tier, newBass);
  }

  // Tier 8 natural pools (A3..C6 in treble, C2..E4 in bass)
  const tier8Treble = trebleNotesByTier.get(8)!;
  const tier8Bass = bassNotesByTier.get(8)!;

  // Tier 9 (G Major): replace F with F#
  const replaceLetterWithAccidental = (
    targets: readonly StaffNoteTarget[],
    letter: string,
    replacementAcc: '#' | 'b'
  ): StaffNoteTarget[] => {
    return targets.map((t) => {
      if (t.pitch.letter === letter) {
        return createTarget(t.clef, `${letter}${replacementAcc}${t.pitch.octave}`);
      }
      return t;
    });
  };

  // Tier 9: F -> F#
  const tier9Treble = replaceLetterWithAccidental(tier8Treble, 'F', '#');
  const tier9Bass = replaceLetterWithAccidental(tier8Bass, 'F', '#');
  trebleNotesByTier.set(9, sortTargetsByDiatonic(tier9Treble));
  bassNotesByTier.set(9, sortTargetsByDiatonic(tier9Bass));
  trebleNewNotesByTier.set(9, TIER_DEFINITIONS[8]!.trebleNewPitchIds.map((id) => createTarget('treble', id)));
  bassNewNotesByTier.set(9, TIER_DEFINITIONS[8]!.bassNewPitchIds.map((id) => createTarget('bass', id)));

  // Tier 10 (F Major): replace B with Bb from Tier 8
  const tier10Treble = replaceLetterWithAccidental(tier8Treble, 'B', 'b');
  const tier10Bass = replaceLetterWithAccidental(tier8Bass, 'B', 'b');
  trebleNotesByTier.set(10, sortTargetsByDiatonic(tier10Treble));
  bassNotesByTier.set(10, sortTargetsByDiatonic(tier10Bass));
  trebleNewNotesByTier.set(10, TIER_DEFINITIONS[9]!.trebleNewPitchIds.map((id) => createTarget('treble', id)));
  bassNewNotesByTier.set(10, TIER_DEFINITIONS[9]!.bassNewPitchIds.map((id) => createTarget('bass', id)));

  // Tier 11 (D Major): replace C with C# from Tier 9 (which already has F#)
  const tier11Treble = replaceLetterWithAccidental(tier9Treble, 'C', '#');
  const tier11Bass = replaceLetterWithAccidental(tier9Bass, 'C', '#');
  trebleNotesByTier.set(11, sortTargetsByDiatonic(tier11Treble));
  bassNotesByTier.set(11, sortTargetsByDiatonic(tier11Bass));
  trebleNewNotesByTier.set(11, TIER_DEFINITIONS[10]!.trebleNewPitchIds.map((id) => createTarget('treble', id)));
  bassNewNotesByTier.set(11, TIER_DEFINITIONS[10]!.bassNewPitchIds.map((id) => createTarget('bass', id)));

  // Tier 12 (Bb Major): replace E with Eb from Tier 10 (which already has Bb)
  const tier12Treble = replaceLetterWithAccidental(tier10Treble, 'E', 'b');
  const tier12Bass = replaceLetterWithAccidental(tier10Bass, 'E', 'b');
  trebleNotesByTier.set(12, sortTargetsByDiatonic(tier12Treble));
  bassNotesByTier.set(12, sortTargetsByDiatonic(tier12Bass));
  trebleNewNotesByTier.set(12, TIER_DEFINITIONS[11]!.trebleNewPitchIds.map((id) => createTarget('treble', id)));
  bassNewNotesByTier.set(12, TIER_DEFINITIONS[11]!.bassNewPitchIds.map((id) => createTarget('bass', id)));

  // Helper for review notes
  const getReviewNotes = (
    newNotesMap: Map<number, StaffNoteTarget[]>,
    tier: number
  ): StaffNoteTarget[] => {
    if (tier === 1) return [];
    if (tier === 2) return newNotesMap.get(1) ?? [];
    return [...(newNotesMap.get(tier - 1) ?? []), ...(newNotesMap.get(tier - 2) ?? [])];
  };

  // Helper for level titles
  const getLaneTitle = (lane: ClefLane, tier: number, keySig: KeySignatureId): string => {
    const laneLabel = lane === 'treble' ? 'Treble Clef' : lane === 'bass' ? 'Bass Clef' : 'Grand Staff';
    if (tier <= 8) {
      return `${laneLabel} - Tier ${tier}`;
    }
    const keyLabel =
      keySig === 'G_MAJOR'
        ? 'G Major'
        : keySig === 'F_MAJOR'
        ? 'F Major'
        : keySig === 'D_MAJOR'
        ? 'D Major'
        : 'Bb Major';
    return `${laneLabel} - Tier ${tier} (${keyLabel})`;
  };

  // First pass: create all LevelSpec objects
  for (let tier = 1; tier <= 12; tier++) {
    const def = TIER_DEFINITIONS[tier - 1]!;
    const trebleAll = trebleNotesByTier.get(tier)!;
    const bassAll = bassNotesByTier.get(tier)!;
    const trebleNew = trebleNewNotesByTier.get(tier)!;
    const bassNew = bassNewNotesByTier.get(tier)!;

    // Treble level
    const treblePrereqs: string[] = [];
    if (tier > 1) treblePrereqs.push(`treble-${tier - 1}`);

    const trebleNext: string[] = [`both-${tier}`];
    if (tier < 12) trebleNext.push(`treble-${tier + 1}`);

    const trebleInterval = getInterval(trebleAll, 'treble');
    const trebleLevel: LevelSpec = {
      id: `treble-${tier}`,
      tier,
      lane: 'treble',
      title: getLaneTitle('treble', tier, def.keySignature),
      keySignature: def.keySignature,
      allNotes: trebleAll,
      newNotes: trebleNew,
      reviewNotes: getReviewNotes(trebleNewNotesByTier, tier),
      prerequisiteIds: treblePrereqs,
      nextIds: trebleNext,
      displayInterval: {
        ...(trebleInterval ? { treble: trebleInterval } : {}),
      },
    };
    levelsById.set(trebleLevel.id, trebleLevel);

    // Bass level
    const bassPrereqs: string[] = [];
    if (tier > 1) bassPrereqs.push(`bass-${tier - 1}`);

    const bassNext: string[] = [`both-${tier}`];
    if (tier < 12) bassNext.push(`bass-${tier + 1}`);

    const bassInterval = getInterval(bassAll, 'bass');
    const bassLevel: LevelSpec = {
      id: `bass-${tier}`,
      tier,
      lane: 'bass',
      title: getLaneTitle('bass', tier, def.keySignature),
      keySignature: def.keySignature,
      allNotes: bassAll,
      newNotes: bassNew,
      reviewNotes: getReviewNotes(bassNewNotesByTier, tier),
      prerequisiteIds: bassPrereqs,
      nextIds: bassNext,
      displayInterval: {
        ...(bassInterval ? { bass: bassInterval } : {}),
      },
    };
    levelsById.set(bassLevel.id, bassLevel);

    // Both level
    const bothAll = [...trebleAll, ...bassAll];
    const bothNew = [...trebleNew, ...bassNew];
    const bothPrereqs: string[] = [`treble-${tier}`, `bass-${tier}`];
    if (tier > 1) bothPrereqs.push(`both-${tier - 1}`);

    const bothNext: string[] = [];
    if (tier < 12) bothNext.push(`both-${tier + 1}`);

    // Combined review notes: union of treble review and bass review
    const bothReview = [
      ...getReviewNotes(trebleNewNotesByTier, tier),
      ...getReviewNotes(bassNewNotesByTier, tier),
    ];

    const bothLevel: LevelSpec = {
      id: `both-${tier}`,
      tier,
      lane: 'both',
      title: getLaneTitle('both', tier, def.keySignature),
      keySignature: def.keySignature,
      allNotes: bothAll,
      newNotes: bothNew,
      reviewNotes: bothReview,
      prerequisiteIds: bothPrereqs,
      nextIds: bothNext,
      displayInterval: {
        ...(trebleInterval ? { treble: trebleInterval } : {}),
        ...(bassInterval ? { bass: bassInterval } : {}),
      },
    };
    levelsById.set(bothLevel.id, bothLevel);
  }

  return Array.from(levelsById.values());
}

export const ALL_LEVELS: readonly LevelSpec[] = Object.freeze(buildAllLevels());
export const LEVELS_BY_ID: ReadonlyMap<string, LevelSpec> = new Map(
  ALL_LEVELS.map((lvl) => [lvl.id, lvl])
);
