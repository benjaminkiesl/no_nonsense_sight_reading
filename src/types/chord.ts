import { KeySignatureId } from '../music/scales';

/**
 * Standard pitch class modulo 12:
 * 0 = C, 1 = C#/Db, 2 = D, 3 = D#/Eb, 4 = E, 5 = F,
 * 6 = F#/Gb, 7 = G, 8 = G#/Ab, 9 = A, 10 = A#/Bb, 11 = B
 */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Chord notation naming system:
 * - 'international': Bb / B (Standard American / International jazz and pop fakebooks)
 * - 'german': B / H (Traditional German Liederbuecher and Central European notation)
 */
export type ChordNotationSystem = 'international' | 'german';

/**
 * Tonal quality of the chord
 */
export type ChordQuality =
  | 'major'
  | 'minor'
  | 'dominant7'
  | 'major7'
  | 'minor7'
  | 'diminished'
  | 'augmented';

/**
 * Canonical close-position reference voicing for visual display and learn mode.
 * Left hand plays bass note on the bass clef, right hand plays close-position voicing on treble clef.
 */
export interface CanonicalVoicing {
  /** Left hand bass note MIDI number (e.g. C3 = 48, B2 = 47, F2 = 41) */
  readonly lhMidi: number;
  /** Right hand close-position MIDI numbers (e.g. [60, 64, 67]) */
  readonly rhMidis: readonly number[];
  /** Combined ascending array of all MIDI note numbers [lhMidi, ...rhMidis] */
  readonly allMidis: readonly number[];
}

/**
 * Structured chord symbol representation
 */
export interface ChordSymbol {
  /** Canonical string ID, e.g. "C", "F/C", "G/B", "Bb", "Bm", "Cmaj7" */
  readonly id: string;
  readonly rootPitchClass: PitchClass;
  readonly rootLetter: string;
  readonly quality: ChordQuality;
  /** Present if this is a slash chord (e.g. F/C has bass C = 0) */
  readonly bassPitchClass?: PitchClass;
  readonly bassLetter?: string;
  /** Display string in international notation (e.g. "Bb", "G/B", "Bm") */
  readonly international: string;
  /** Display string in German notation (e.g. "B", "G/H", "Hm") */
  readonly german: string;
  readonly isSlashChord: boolean;
}

/**
 * Full chord definition with pitch classes, rules, and canonical voicing
 */
export interface ChordDefinition {
  readonly id: string;
  readonly symbol: ChordSymbol;
  readonly rootPitchClass: PitchClass;
  readonly bassPitchClass?: PitchClass;
  /** Required pitch classes that MUST be present (modulo 12) */
  readonly requiredPitchClasses: readonly PitchClass[];
  /** Optional pitch classes (e.g., the 5th in dominant/major/minor 7th chords under the 5th-omission rule) */
  readonly optionalPitchClasses: readonly PitchClass[];
  /** Allowed pitch classes: union of required and optional. Non-chord tones outside this set trigger error. */
  readonly allowedPitchClasses: readonly PitchClass[];
  readonly isSlashChord: boolean;
  readonly referenceVoicing: CanonicalVoicing;
  readonly displayLabels: {
    readonly international: string;
    readonly german: string;
  };
}

/**
 * A weighted transition from one chord to another in a Markov progression
 */
export interface ChordProgressionTransition {
  readonly fromChordId: string;
  readonly toChordId: string;
  readonly weight: number;
}

/**
 * Markov transition probability matrix: fromChordId -> toChordId -> weight
 */
export type ChordMarkovTransitions = Record<string, Record<string, number>>;

/**
 * Specification for a single tier in the 12-tier chord curriculum
 */
export interface ChordLevelSpec {
  readonly id: string;           // "chord-1" .. "chord-12"
  readonly tier: number;         // 1 .. 12
  readonly title: string;
  readonly subtitle: string;
  readonly keySignatures: readonly KeySignatureId[];
  /** All target chords available in this level */
  readonly targetChords: readonly ChordDefinition[];
  /** Chords introduced for the first time in this tier */
  readonly newChords: readonly ChordDefinition[];
  /** Chords reviewed from preceding tiers */
  readonly reviewChords: readonly ChordDefinition[];
  /** Lookup map of canonical voicings for this level by chord ID */
  readonly referenceVoicings: Record<string, CanonicalVoicing>;
  /** Weighted Markov transition matrix ensuring musical cadential phrases */
  readonly markovTransitions: ChordMarkovTransitions;
  readonly prerequisiteIds: readonly string[];
  readonly nextIds: readonly string[];
  readonly targetBpm: number;
}

export type ChordEnginePhase = 'LEARN' | 'COUNTDOWN' | 'SPEED_UP' | 'HOLD' | 'LEVEL_COMPLETE';
export type ChordEngineSubstate = 'NORMAL' | 'WAITING_FOR_CORRECTION' | 'RECOVERY_PAUSE';
export type ActiveChordState = 'approaching' | 'hit' | 'failed';

/**
 * Active scrolling chord event in the engine stream
 */
export interface ActiveChordEvent {
  readonly id: string;
  readonly chord: ChordDefinition;
  readonly durationBeats: number;
  x: number;
  state: ActiveChordState;
  stateTimeMs: number;
  failedOnCurrentPrompt: boolean;
}

/**
 * Real-time engine snapshot for UI and visual rendering
 */
export interface ChordEngineSnapshot {
  readonly levelId: string;
  readonly phase: ChordEnginePhase;
  readonly substate: ChordEngineSubstate;
  readonly recoveryRemainingMs: number;
  readonly countdownRemainingSec: number;
  readonly actualBpm: number;
  readonly targetBpm: number;
  readonly learnStepIndex: number;
  readonly learnTotalSteps: number;
  readonly speedStepIndex: number;
  readonly speedTotalSteps: number;
  readonly holdCompletedCount: number;
  readonly holdTotalCount: number;
  readonly activeChords: readonly ActiveChordEvent[];
  readonly activeHeldMidis: readonly number[];
  readonly settlingRemainingMs: number;
  readonly notationSystem: ChordNotationSystem;
  readonly currentTargetChord: ChordDefinition | null;
  readonly isSettling: boolean;
  readonly emptyZonePulseRemainingMs?: number;
}
