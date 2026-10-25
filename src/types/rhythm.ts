export type TimeSignatureStr = '4/4' | '3/4' | '2/4' | '2/2' | '6/8';

export type RhythmEventKind = 'attack' | 'rest' | 'hold';

export interface RhythmSubEvent {
  readonly kind: RhythmEventKind;
  readonly durationBeats: number;
  readonly tiedFromPrev?: boolean;
  readonly dotted?: boolean;
  readonly tuplet?: 3;
}

export interface RhythmBeatCell {
  readonly cellId: string;
  readonly events: readonly RhythmSubEvent[];
}

export interface RhythmPhrase {
  readonly id: string;
  readonly tier: number; // 1..12
  readonly timeSignature: TimeSignatureStr;
  readonly beatsPerBar: number;
  readonly beatUnit: 4 | 2 | 8;
  readonly targetBpm: number; // Nominal reference tempo (used to clamp 35..200 BPM range)
  readonly beatCells: readonly RhythmBeatCell[];
}

export type RhythmExercisePhase =
  | 'STUDY'
  | 'COUNT_IN'
  | 'READY_TO_PLAY'
  | 'PLAYING'
  | 'FEEDBACK'
  | 'LEVEL_COMPLETE';

export interface FlattenedRhythmNote {
  readonly noteIndex: number;
  readonly startBeat: number;
  readonly durationBeats: number;
  readonly isLandingNote: boolean;
  readonly cellIndex: number;
}

export interface RecordedTap {
  readonly pressTimeMs: number;
  releaseTimeMs: number | null;
}

export type NoteErrorHint = 'early' | 'late' | 'short' | 'long' | 'missed' | null;

export interface ShiftedTap {
  readonly tapIndex: number;
  readonly matchedNoteIndex: number | null; // null if extra unintended tap
  readonly startBeat: number; // (t_j - t0_hat) / T
  readonly durationBeats: number; // (r_j - t_j) / T
  readonly status: 'perfect' | 'loose' | 'missed';
}

export interface NoteEvaluation {
  readonly noteIndex: number;
  readonly expectedStartBeat: number;
  readonly expectedDurationBeats: number;
  readonly relativeOnsetError: number;
  readonly holdRatio: number;
  readonly status: 'perfect' | 'loose' | 'missed';
  readonly errorHint: NoteErrorHint;
  readonly userStartBeat?: number | null;
}

export interface RhythmFeedbackSummary {
  readonly grooveScorePct: number;
  readonly holdScorePct: number;
  readonly overallScorePct: number;
  readonly estimatedUserBpm: number;
  readonly targetBpm: number;
  readonly noteEvaluations: readonly NoteEvaluation[];
  readonly shiftedTaps: readonly ShiftedTap[];
  readonly passed: boolean;
}

export type MiniRhythmMotifType =
  | 'q_q' // Tier 1: ♩ ♩
  | 'e2_q' // Tier 2: ♫ ♩
  | 'q_rest' // Tier 3: ♩ 𝄽
  | 'dotq_e' // Tier 4: ♩. ♪
  | 's4' // Tier 5: ♬♬
  | 'gallop' // Tier 6: ♪ ♬
  | 'rev_gallop' // Tier 7: ♬ ♪
  | 'dot8_s' // Tier 8: ♪. ♬
  | 'sync_e_q_e' // Tier 9: ♪ ♩ ♪
  | 'tie_across' // Tier 10: ♩ ‿ ♪ ♪
  | 'compound_6_8' // Tier 11: 6/8 ♫♪
  | 'rag_sync'; // Tier 12: ♬ ♪ ♬

export interface RhythmLevelSpec {
  readonly id: string; // 'rhythm-1' .. 'rhythm-12'
  readonly tier: number; // 1 .. 12
  readonly title: string;
  readonly subtitle: string;
  readonly motif: MiniRhythmMotifType;
  readonly prerequisiteIds: readonly string[];
  readonly nextIds: readonly string[];
  readonly phrases: readonly RhythmPhrase[];
}

export interface RhythmEngineSnapshot {
  readonly levelId: string;
  readonly levelTitle: string;
  readonly phase: RhythmExercisePhase;
  readonly phrase: RhythmPhrase;
  readonly flattenedNotes: readonly FlattenedRhythmNote[];
  readonly currentNoteIndex: number;
  readonly activeHoldNoteIndex: number | null;
  readonly phrasesCompletedInLevel: number;
  readonly phrasesRequiredForLevel: number;
  readonly feedback: RhythmFeedbackSummary | null;
  readonly countInBeatIndex?: number;
  readonly countInTotalBeats?: number;
}
