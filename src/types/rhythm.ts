export type TimeSignatureStr = '4/4' | '3/4' | '2/4' | '2/2' | '6/8';

export type RhythmEventKind = 'note' | 'rest';

export interface RhythmSubEvent {
  /** Offset from the start of the beat cell, in beats (e.g. 0, 0.25, 0.5, 0.75) */
  readonly offsetBeats: number;
  /** Duration in beats (e.g. 1.0 = quarter, 0.5 = eighth, 0.25 = sixteenth, 1.5 = dotted quarter) */
  readonly durationBeats: number;
  readonly kind: RhythmEventKind;
  /** Whether this note is tied from the previous event */
  readonly tiedFromPrev?: boolean;
}

export interface RhythmBeatCell {
  readonly cellId: string; // e.g. 'q', 'e2', 's4', 'dot8_s', 'gallop', 'upbeat_e', 'rest_q', 'sync_16_8_16', 'triplet_e'
  readonly label: string; // e.g. 'Quarter (♩)', 'Dotted 8th + 16th (♪. ♬)'
  readonly symbol: string; // Compact visual symbol e.g. '♩', '♫', '♬♬', '♪. ♬', '♪ ♬', '𝄾 ♪'
  readonly events: readonly RhythmSubEvent[];
}

export interface RhythmPhrase {
  readonly id: string;
  readonly title: string;
  readonly sourceComposer?: string; // e.g. 'W.A. Mozart — Sonata K. 279'
  readonly timeSignature: TimeSignatureStr;
  readonly beatsPerBar: number; // e.g. 4 for 4/4, 3 for 3/4, 2 for 2/4
  readonly targetBpm: number; // Default tempo e.g. 76
  /** Sequence of 1-beat cells across the bars, PLUS the final landing beat cell */
  readonly beatCells: readonly RhythmBeatCell[];
  /** Optional ID of the 2x Metric Zoom twin phrase (same physical timing, 2x note durations & 2x BPM) */
  readonly zoomTwinPhraseId?: string;
  readonly zoomScaleLabel?: '1x (Sixteenth Level)' | '2x (Eighth Level)';
}

export type RhythmExercisePhase = 'SANDBOX' | 'COUNT_IN' | 'PERFORM' | 'FEEDBACK';

export type PulseAutonomyMode = 'SILENT_CONTINUATION' | 'BAR_DOWNBEAT_ANCHOR';

export interface FlattenedRhythmNote {
  readonly index: number;
  readonly beatIndex: number;
  readonly startBeat: number; // Global beat offset from phrase start (0.0, 0.5, 1.0, ...)
  readonly durationBeats: number; // Written duration including any tied continuations
  readonly isLandingNote: boolean;
}

export interface RecordedTap {
  readonly pressTimeMs: number;
  releaseTimeMs: number | null;
}

export interface NoteEvaluation {
  readonly noteIndex: number;
  readonly expectedStartBeat: number;
  readonly expectedDurationBeats: number;
  /** Relative onset error as a fraction of local beat period (-0.05 = 5% early) */
  readonly relativeOnsetError: number;
  /** Ratio of actual hold duration to expected duration (1.0 = full hold) */
  readonly holdRatio: number;
  readonly status: 'perfect' | 'loose' | 'missed';
}

export interface RhythmFeedbackSummary {
  readonly grooveScorePct: number; // 0..100 based on relative IOI accuracy
  readonly holdScorePct: number; // 0..100 based on holding sustained/syncopated notes vs rests
  readonly overallScorePct: number; // Weighted 80% groove + 20% hold
  readonly pulseDriftPct: number; // e.g. +3.2% (rushed) or -2.1% (dragged)
  readonly estimatedUserBpm: number;
  readonly noteEvaluations: readonly NoteEvaluation[];
  readonly passed: boolean; // true if overallScorePct >= 80
}

export interface RhythmLevelSpec {
  readonly id: string;
  readonly tier: number;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly featuredCellSymbols: readonly string[];
  readonly phrases: readonly RhythmPhrase[];
}

export interface RhythmEngineSnapshot {
  readonly levelId: string;
  readonly phrase: RhythmPhrase;
  readonly phase: RhythmExercisePhase;
  readonly pulseMode: PulseAutonomyMode;
  readonly countInBeatIndex: number; // 0..beatsPerBar-1 during COUNT_IN
  readonly flattenedNotes: readonly FlattenedRhythmNote[];
  readonly sandboxMatchedCount: number; // Progress in SANDBOX self-paced tapping
  readonly performTapCount: number; // Number of notes tapped so far in PERFORM
  readonly activeHoldNoteIndex: number | null;
  readonly leftHandPulseCount: number; // Count of self-generated LH pulse taps ('F' key)
  readonly showWordBoxes: boolean;
  readonly feedback: RhythmFeedbackSummary | null;
}
