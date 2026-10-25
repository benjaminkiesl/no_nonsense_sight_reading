import {
  FlattenedRhythmNote,
  NoteErrorHint,
  NoteEvaluation,
  RecordedTap,
  RhythmEngineSnapshot,
  RhythmExercisePhase,
  RhythmFeedbackSummary,
  RhythmLevelSpec,
  RhythmPhrase,
  ShiftedTap,
} from '../types/rhythm';
import { flattenPhraseToNotes } from './curriculum';
import { playMetricCountInClick } from '../audio/rhythmAudio';

export interface TickResult {
  readonly transitionedToReadyToPlay?: boolean;
  readonly transitionedToFeedback?: boolean;
  readonly advancedPhrase?: boolean;
  readonly levelComplete?: boolean;
}

export class RhythmEngine {
  private levelSpec: RhythmLevelSpec;
  private phraseIndex: number;
  private phrase: RhythmPhrase;
  private phase: RhythmExercisePhase = 'STUDY';
  private flattenedNotes: readonly FlattenedRhythmNote[];
  private currentNoteIndex: number = 0;
  private activeHoldNoteIndex: number | null = null;
  private recordedTaps: RecordedTap[] = [];
  private phrasesCompletedInLevel: number = 0;
  private phrasesRequiredForLevel: number;
  private feedback: RhythmFeedbackSummary | null = null;
  private feedbackEnteredTimeMs: number = 0;
  private lastTapPressTimeMs: number = 0;
  private firstTapPressMs: number = 0;

  // Count-in state
  private countInStartTimeMs: number = 0;
  private countInBeatIndex: number | undefined = undefined;
  private countInTotalBeats: number | undefined = undefined;

  constructor(levelSpec: RhythmLevelSpec, phraseIndex = 0) {
    this.levelSpec = levelSpec;
    const clampedIndex = Math.max(0, Math.min(phraseIndex, levelSpec.phrases.length - 1));
    this.phraseIndex = clampedIndex;
    const initialPhrase = levelSpec.phrases[clampedIndex] ?? levelSpec.phrases[0];
    if (!initialPhrase) {
      throw new Error(`Level ${levelSpec.id} contains no phrases.`);
    }
    this.phrase = initialPhrase;
    this.flattenedNotes = flattenPhraseToNotes(this.phrase);
    this.phrasesRequiredForLevel = Math.min(5, levelSpec.phrases.length);
  }

  public getSnapshot(): RhythmEngineSnapshot {
    return {
      levelId: this.levelSpec.id,
      levelTitle: this.levelSpec.title,
      phase: this.phase,
      phrase: this.phrase,
      flattenedNotes: this.flattenedNotes,
      currentNoteIndex: this.currentNoteIndex,
      activeHoldNoteIndex: this.activeHoldNoteIndex,
      phrasesCompletedInLevel: this.phrasesCompletedInLevel,
      phrasesRequiredForLevel: this.phrasesRequiredForLevel,
      feedback: this.feedback,
      countInBeatIndex: this.countInBeatIndex,
      countInTotalBeats: this.countInTotalBeats,
    };
  }

  public selectLevel(levelSpec: RhythmLevelSpec, phraseIndex = 0): void {
    this.levelSpec = levelSpec;
    const clampedIndex = Math.max(0, Math.min(phraseIndex, levelSpec.phrases.length - 1));
    this.phraseIndex = clampedIndex;
    const selected = levelSpec.phrases[clampedIndex] ?? levelSpec.phrases[0];
    if (selected) {
      this.phrase = selected;
      this.flattenedNotes = flattenPhraseToNotes(this.phrase);
      this.phrasesCompletedInLevel = 0;
      this.phrasesRequiredForLevel = Math.min(5, levelSpec.phrases.length);
      this.resetForPhrase();
    }
  }

  public selectPhraseIndex(index: number): void {
    const target = this.levelSpec.phrases[index];
    if (target) {
      this.phraseIndex = index;
      this.phrase = target;
      this.flattenedNotes = flattenPhraseToNotes(this.phrase);
      this.resetForPhrase();
    }
  }

  public resetForPhrase(): void {
    this.phase = 'STUDY';
    this.currentNoteIndex = 0;
    this.activeHoldNoteIndex = null;
    this.recordedTaps = [];
    this.feedback = null;
    this.feedbackEnteredTimeMs = 0;
    this.lastTapPressTimeMs = 0;
    this.firstTapPressMs = 0;
    this.countInBeatIndex = undefined;
    this.countInTotalBeats = undefined;
    this.countInStartTimeMs = 0;
  }

  public startCountIn(nowMs: number): void {
    this.phase = 'COUNT_IN';
    this.countInStartTimeMs = nowMs;
    this.countInBeatIndex = 0;
    this.countInTotalBeats = this.phrase.beatsPerBar;
    playMetricCountInClick(0, this.countInTotalBeats);
  }

  public advanceToNextPhrase(): boolean {
    if (this.phrasesCompletedInLevel >= this.phrasesRequiredForLevel) {
      this.phase = 'LEVEL_COMPLETE';
      return false;
    }

    if (this.phraseIndex < this.levelSpec.phrases.length - 1) {
      this.phraseIndex++;
      const next = this.levelSpec.phrases[this.phraseIndex];
      if (next) {
        this.phrase = next;
        this.flattenedNotes = flattenPhraseToNotes(this.phrase);
        this.resetForPhrase();
        return true;
      }
    } else {
      if (this.phrasesCompletedInLevel >= this.phrasesRequiredForLevel) {
        this.phase = 'LEVEL_COMPLETE';
        return false;
      }
      this.phraseIndex = 0;
      const first = this.levelSpec.phrases[0];
      if (first) {
        this.phrase = first;
        this.flattenedNotes = flattenPhraseToNotes(this.phrase);
        this.resetForPhrase();
        return true;
      }
    }

    return false;
  }

  public handleNotePress(nowMs: number): {
    noteIndex: number;
    isLanding: boolean;
    durationBeats: number;
  } {
    if (this.phase === 'LEVEL_COMPLETE') {
      return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
    }

    // In STUDY phase, pressing Space/Enter can start count-in
    if (this.phase === 'STUDY') {
      this.startCountIn(nowMs);
      return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
    }

    // In COUNT_IN phase, ignore taps until metronome stops
    if (this.phase === 'COUNT_IN') {
      return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
    }

    // In FEEDBACK phase:
    if (this.phase === 'FEEDBACK') {
      // Require 350ms debounce after finishing the last note
      if (nowMs - this.feedbackEnteredTimeMs < 350) {
        return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
      }

      if (this.feedback?.passed) {
        if (this.phrasesCompletedInLevel >= this.phrasesRequiredForLevel) {
          this.phase = 'LEVEL_COMPLETE';
          return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
        }
        this.advanceToNextPhrase();
        return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
      } else {
        // Failed phrase: directly begin Note 0 of a fresh retry
        this.resetForPhrase();
        this.phase = 'PLAYING';
        this.firstTapPressMs = nowMs;
        return this.recordNotePress(nowMs, 0);
      }
    }

    // In READY_TO_PLAY phase:
    // The very first tap IS Note 1 (index 0) and transitions to PLAYING!
    if (this.phase === 'READY_TO_PLAY') {
      this.phase = 'PLAYING';
      this.recordedTaps = [];
      this.firstTapPressMs = nowMs;
      this.currentNoteIndex = 0;
      this.feedback = null;
      return this.recordNotePress(nowMs, 0);
    }

    // In PLAYING phase:
    if (this.phase === 'PLAYING') {
      if (this.recordedTaps.length < this.flattenedNotes.length) {
        const nextIndex = this.recordedTaps.length;
        return this.recordNotePress(nowMs, nextIndex);
      } else {
        // Extra unmatched tap
        this.recordedTaps.push({ pressTimeMs: nowMs, releaseTimeMs: null });
        this.activeHoldNoteIndex = this.recordedTaps.length - 1;
        this.lastTapPressTimeMs = nowMs;
        return { noteIndex: this.recordedTaps.length - 1, isLanding: false, durationBeats: 1.0 };
      }
    }

    return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
  }

  private recordNotePress(
    nowMs: number,
    noteIndex: number
  ): { noteIndex: number; isLanding: boolean; durationBeats: number } {
    const note = this.flattenedNotes[noteIndex];
    if (!note) {
      return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
    }

    this.recordedTaps.push({ pressTimeMs: nowMs, releaseTimeMs: null });
    this.activeHoldNoteIndex = noteIndex;
    this.currentNoteIndex = noteIndex + 1;
    this.lastTapPressTimeMs = nowMs;

    return {
      noteIndex,
      isLanding: note.isLandingNote,
      durationBeats: note.durationBeats,
    };
  }

  public handleNoteRelease(nowMs: number): void {
    if (this.activeHoldNoteIndex !== null) {
      const tap = this.recordedTaps[this.activeHoldNoteIndex];
      if (tap) {
        tap.releaseTimeMs = nowMs;
      }
      this.activeHoldNoteIndex = null;
    }

    // If in PLAYING phase and all notes are tapped, transition to FEEDBACK
    if (this.phase === 'PLAYING' && this.recordedTaps.length >= this.flattenedNotes.length) {
      this.finishPhrasePlaying(nowMs);
    }
  }

  public tick(nowMs: number): TickResult {
    // Stage 2: COUNT_IN metronome progression
    if (this.phase === 'COUNT_IN') {
      const beatPeriodMs = 60000 / this.phrase.targetBpm;
      const elapsed = nowMs - this.countInStartTimeMs;
      const totalBeats = this.countInTotalBeats ?? this.phrase.beatsPerBar;
      const currentBeat = Math.floor((elapsed + 1) / beatPeriodMs);

      if (
        this.countInBeatIndex !== undefined &&
        currentBeat > this.countInBeatIndex &&
        currentBeat < totalBeats
      ) {
        this.countInBeatIndex = currentBeat;
        playMetricCountInClick(currentBeat, totalBeats);
      }

      if (elapsed >= totalBeats * beatPeriodMs - 1) {
        this.phase = 'READY_TO_PLAY';
        this.countInBeatIndex = undefined;
        return { transitionedToReadyToPlay: true };
      }
    }

    // Stage 3: PLAYING completion or time window timeout
    if (this.phase === 'PLAYING') {
      const beatPeriodMs = 60000 / this.phrase.targetBpm;
      const totalPhraseBeats = this.phrase.beatCells.length;

      // 1. All notes tapped and 250ms passed since final tap
      if (this.recordedTaps.length >= this.flattenedNotes.length && this.recordedTaps.length > 0) {
        if (nowMs - this.lastTapPressTimeMs >= 250) {
          this.finishPhrasePlaying(nowMs);
          return { transitionedToFeedback: true };
        }
      }

      // 2. User missed/skipped notes and phrase time window elapsed
      if (
        this.recordedTaps.length > 0 &&
        nowMs - this.firstTapPressMs >= (totalPhraseBeats + 1.0) * beatPeriodMs
      ) {
        this.finishPhrasePlaying(nowMs);
        return { transitionedToFeedback: true };
      }
    }

    return {};
  }

  private finishPhrasePlaying(nowMs: number): void {
    this.phase = 'FEEDBACK';
    this.feedbackEnteredTimeMs = nowMs;
    this.feedback = this.evaluatePerformance(nowMs);

    if (this.feedback.passed) {
      this.phrasesCompletedInLevel++;
    }
  }

  public evaluatePerformance(nowMs?: number): RhythmFeedbackSummary {
    const N = this.flattenedNotes.length;
    const M = this.recordedTaps.length;
    const targetBpm = this.phrase.targetBpm;
    const T = 60000 / targetBpm;

    if (N === 0) {
      return {
        grooveScorePct: 100,
        holdScorePct: 100,
        overallScorePct: 100,
        estimatedUserBpm: targetBpm,
        targetBpm,
        noteEvaluations: [],
        shiftedTaps: [],
        passed: true,
      };
    }

    const t0 = this.recordedTaps[0]?.pressTimeMs ?? 0;
    const approxBeats = this.recordedTaps.map((tap) => (tap.pressTimeMs - t0) / T);

    // Step 1: Chronological Nearest-Note Matching
    const matchedTapForNote = new Array<number | null>(N).fill(null);
    const matchedNoteForTap = new Array<number | null>(M).fill(null);

    if (M > 0) {
      matchedTapForNote[0] = 0;
      matchedNoteForTap[0] = 0;
      let jLastMatched = 0;

      for (let i = 1; i < N; i++) {
        const b_i = this.flattenedNotes[i]!.startBeat;
        let bestJ: number | null = null;
        let bestDiff = Infinity;

        for (let j = jLastMatched + 1; j < M; j++) {
          const b_tilde_j = approxBeats[j]!;
          const diff = Math.abs(b_tilde_j - b_i);
          if (diff <= 0.48 && diff < bestDiff) {
            // If i + 1 < N, ensure tap is not closer to note i+1
            if (i + 1 < N) {
              const b_next = this.flattenedNotes[i + 1]!.startBeat;
              const diffNext = Math.abs(b_tilde_j - b_next);
              if (diff > diffNext) {
                continue;
              }
            }
            bestDiff = diff;
            bestJ = j;
          }
        }

        if (bestJ !== null) {
          matchedTapForNote[i] = bestJ;
          matchedNoteForTap[bestJ] = i;
          jLastMatched = bestJ;
        }
      }
    }

    // Step 2: Global 1-Parameter Least-Squares Shift (t0_hat)
    const uList: number[] = [];
    for (let i = 0; i < N; i++) {
      const j = matchedTapForNote[i];
      if (j !== null && j !== undefined) {
        const note = this.flattenedNotes[i]!;
        const tap = this.recordedTaps[j]!;
        const u_k = tap.pressTimeMs - T * note.startBeat;
        uList.push(u_k);
      }
    }

    let t0_hat = t0;
    if (uList.length > 0) {
      const sortedU = [...uList].sort((a, b) => a - b);
      const mid = Math.floor(sortedU.length / 2);
      const uMed =
        sortedU.length % 2 === 0
          ? ((sortedU[mid - 1] ?? 0) + (sortedU[mid] ?? 0)) / 2
          : (sortedU[mid] ?? 0);

      const inliers = uList.filter((u) => Math.abs(u - uMed) <= 0.25 * T);
      if (inliers.length > 0) {
        t0_hat = inliers.reduce((sum, val) => sum + val, 0) / inliers.length;
      } else {
        t0_hat = uMed;
      }
    }

    // Step 3: Compute Globally-Shifted User Taps (ShiftedTap[]) & Note Evaluations
    const shiftedTaps: ShiftedTap[] = this.recordedTaps.map((tap, j) => {
      const startBeat = Number(((tap.pressTimeMs - t0_hat) / T).toFixed(4));
      const releaseMs = tap.releaseTimeMs ?? (nowMs ?? tap.pressTimeMs + 200);
      const heldMs = Math.max(40, releaseMs - tap.pressTimeMs);
      const durationBeats = Number((heldMs / T).toFixed(4));
      const matchedNote = matchedNoteForTap[j] ?? null;

      return {
        tapIndex: j,
        matchedNoteIndex: matchedNote,
        startBeat,
        durationBeats,
        status: 'missed',
      };
    });

    const noteEvaluations: NoteEvaluation[] = [];
    const grooveScores: number[] = [];
    const holdScores: number[] = [];

    for (let i = 0; i < N; i++) {
      const note = this.flattenedNotes[i]!;
      const j = matchedTapForNote[i];

      if (j === null || j === undefined) {
        grooveScores.push(0);
        holdScores.push(0);
        noteEvaluations.push({
          noteIndex: i,
          expectedStartBeat: note.startBeat,
          expectedDurationBeats: note.durationBeats,
          relativeOnsetError: 1.0,
          holdRatio: 0.0,
          status: 'missed',
          errorHint: 'missed',
          userStartBeat: null,
        });
      } else {
        const tap = shiftedTaps[j]!;
        const onsetErrorBeats = Number((tap.startBeat - note.startBeat).toFixed(4));
        const absErr = Math.abs(onsetErrorBeats);

        let status: 'perfect' | 'loose' | 'missed';
        let noteGrooveScore: number;

        if (absErr <= 0.12) {
          status = 'perfect';
          noteGrooveScore = 100;
        } else if (absErr <= 0.22) {
          status = 'loose';
          const factor = (absErr - 0.12) / (0.22 - 0.12);
          noteGrooveScore = Math.round(100 - factor * 35);
        } else {
          status = 'missed';
          noteGrooveScore = 0;
        }
        grooveScores.push(noteGrooveScore);

        let holdRatio = 1.0;
        let noteHoldScore = 100;
        let holdError: NoteErrorHint = null;

        if (note.isLandingNote) {
          holdRatio = 1.0;
          noteHoldScore = 100;
        } else if (note.durationBeats >= 1.5) {
          holdRatio = Number((tap.durationBeats / note.durationBeats).toFixed(3));
          if (holdRatio < 0.40) {
            noteHoldScore = Math.max(0, Math.round((holdRatio / 0.40) * 100));
            holdError = 'short';
          } else if (holdRatio > 1.60) {
            noteHoldScore = Math.max(30, Math.round(100 - (holdRatio - 1.60) * 70));
            holdError = 'long';
          } else {
            noteHoldScore = 100;
          }
        } else {
          holdRatio = Number((tap.durationBeats / note.durationBeats).toFixed(3));
          noteHoldScore = 100;
        }
        holdScores.push(noteHoldScore);

        let errorHint: NoteErrorHint = null;
        if (status === 'missed' || status === 'loose') {
          errorHint = onsetErrorBeats < 0 ? 'early' : 'late';
        } else if (holdError) {
          errorHint = holdError;
        }

        // Update mutable copy in shiftedTaps
        (shiftedTaps[j] as { status: 'perfect' | 'loose' | 'missed' }).status = status;

        noteEvaluations.push({
          noteIndex: i,
          expectedStartBeat: note.startBeat,
          expectedDurationBeats: note.durationBeats,
          relativeOnsetError: onsetErrorBeats,
          holdRatio,
          status,
          errorHint,
          userStartBeat: tap.startBeat,
        });
      }
    }

    // Linear regression slope to estimate actual user BPM
    let estimatedUserBpm = targetBpm;
    if (uList.length >= 2) {
      let sumB = 0;
      let sumT = 0;
      let count = 0;
      for (let i = 0; i < N; i++) {
        const j = matchedTapForNote[i];
        if (j !== null && j !== undefined) {
          const note = this.flattenedNotes[i]!;
          const tap = this.recordedTaps[j]!;
          sumB += note.startBeat;
          sumT += tap.pressTimeMs;
          count++;
        }
      }
      const meanB = sumB / count;
      const meanT = sumT / count;
      let sBB = 0;
      let sBT = 0;
      for (let i = 0; i < N; i++) {
        const j = matchedTapForNote[i];
        if (j !== null && j !== undefined) {
          const note = this.flattenedNotes[i]!;
          const tap = this.recordedTaps[j]!;
          const diffB = note.startBeat - meanB;
          const diffT = tap.pressTimeMs - meanT;
          sBB += diffB * diffB;
          sBT += diffB * diffT;
        }
      }
      if (sBB > 1e-6) {
        const slope = sBT / sBB;
        const clampedSlope = Math.max(300, Math.min(1714, slope));
        estimatedUserBpm = Math.round(60000 / clampedSlope);
      }
    }

    const hasMissedNote = noteEvaluations.some((e) => e.status === 'missed');
    const hasExtraTap = shiftedTaps.some((t) => t.matchedNoteIndex === null);

    const meanGroove =
      grooveScores.length > 0
        ? grooveScores.reduce((a, b) => a + b, 0) / Math.max(1, N)
        : 0;
    const meanHold =
      holdScores.length > 0
        ? holdScores.reduce((a, b) => a + b, 0) / Math.max(1, N)
        : 0;

    const grooveScorePct = Math.round(meanGroove);
    const holdScorePct = Math.round(meanHold);
    const overallScorePct = Math.round(0.8 * grooveScorePct + 0.2 * holdScorePct);
    const passed = overallScorePct >= 80 && !hasMissedNote && !hasExtraTap;

    return {
      grooveScorePct,
      holdScorePct,
      overallScorePct,
      estimatedUserBpm,
      targetBpm,
      noteEvaluations,
      shiftedTaps,
      passed,
    };
  }
}
