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
} from '../types/rhythm';
import { flattenPhraseToNotes } from './curriculum';

export interface TickResult {
  readonly transitionedToFeedback?: boolean;
  readonly advancedPhrase?: boolean;
  readonly levelComplete?: boolean;
}

export class RhythmEngine {
  private levelSpec: RhythmLevelSpec;
  private phraseIndex: number;
  private phrase: RhythmPhrase;
  private phase: RhythmExercisePhase = 'READY';
  private flattenedNotes: readonly FlattenedRhythmNote[];
  private currentNoteIndex: number = 0;
  private activeHoldNoteIndex: number | null = null;
  private recordedTaps: RecordedTap[] = [];
  private phrasesCompletedInLevel: number = 0;
  private phrasesRequiredForLevel: number;
  private feedback: RhythmFeedbackSummary | null = null;
  private feedbackEnteredTimeMs: number = 0;
  private lastTapPressTimeMs: number = 0;

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
    this.phase = 'READY';
    this.currentNoteIndex = 0;
    this.activeHoldNoteIndex = null;
    this.recordedTaps = [];
    this.feedback = null;
    this.feedbackEnteredTimeMs = 0;
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
      // Loop or complete
      if (this.phrasesCompletedInLevel >= this.phrasesRequiredForLevel) {
        this.phase = 'LEVEL_COMPLETE';
        return false;
      }
      // Wrap phrase index within the level
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

    // In FEEDBACK phase:
    if (this.phase === 'FEEDBACK') {
      // Require 350ms debounce after finishing the last note so an accidental trailing press
      // doesn't immediately dismiss the feedback screen before the user sees their green/red score!
      if (nowMs - this.feedbackEnteredTimeMs < 350) {
        return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
      }

      if (this.feedback?.passed) {
        // User saw their passed green phrase and pressed a key to load the next phrase (or finish level)
        if (this.phrasesCompletedInLevel >= this.phrasesRequiredForLevel) {
          this.phase = 'LEVEL_COMPLETE';
          return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
        }
        this.advanceToNextPhrase();
        // Put the new phrase in READY state so the user can look at the new phrase before tapping Note 1!
        return { noteIndex: -1, isLanding: false, durationBeats: 1.0 };
      } else {
        // Failed phrase: reset to READY (or start Note 0 of retry? Resetting to READY lets user see clean staff, or starting Note 0 directly)
        // Wait: if they are looking at the SAME phrase on screen and press Space to retry, starting Note 0 directly or resetting?
        // Actually, starting Note 0 directly when retrying the same phrase is natural porque they are already looking at the same phrase!
        this.resetForPhrase();
        this.phase = 'PLAYING';
        return this.recordNotePress(nowMs, 0);
      }
    }

    // In READY phase:
    if (this.phase === 'READY') {
      this.phase = 'PLAYING';
      this.recordedTaps = [];
      this.currentNoteIndex = 0;
      this.feedback = null;
      return this.recordNotePress(nowMs, 0);
    }

    // In PLAYING phase:
    if (this.phase === 'PLAYING') {
      if (this.recordedTaps.length < this.flattenedNotes.length) {
        const nextIndex = this.recordedTaps.length;
        return this.recordNotePress(nowMs, nextIndex);
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
    if (this.phase === 'PLAYING' && this.recordedTaps.length === this.flattenedNotes.length) {
      this.finishPhrasePlaying(nowMs);
    }
  }

  public tick(nowMs: number): TickResult {
    // If playing and final note was pressed > 300ms ago, evaluate
    if (this.phase === 'PLAYING') {
      if (this.recordedTaps.length === this.flattenedNotes.length && this.recordedTaps.length > 0) {
        if (nowMs - this.lastTapPressTimeMs >= 300) {
          this.finishPhrasePlaying(nowMs);
          return { transitionedToFeedback: true };
        }
      }
    }

    // Do NOT auto-wipe FEEDBACK on a fast timer! Keep the green/red graded phrase visible
    // until the user presses a key (or clicks Next Phrase) so they can see how they did.
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
    const targetBeatPeriodMs = 60000 / this.phrase.targetBpm;

    if (N === 0) {
      return {
        grooveScorePct: 100,
        holdScorePct: 100,
        overallScorePct: 100,
        estimatedUserBpm: this.phrase.targetBpm,
        noteEvaluations: [],
        passed: true,
      };
    }

    // Fit Ordinary Least-Squares regression line across all recorded taps: t(b_i) = t0 + T * b_i
    let estimatedUserBeatPeriodMs = targetBeatPeriodMs;
    let t0 = this.recordedTaps[0]?.pressTimeMs ?? 0;

    if (M >= 2) {
      let sumB = 0;
      let sumT = 0;
      let validCount = 0;

      for (let i = 0; i < M; i++) {
        const n = this.flattenedNotes[i];
        const t = this.recordedTaps[i];
        if (n && t) {
          sumB += n.startBeat;
          sumT += t.pressTimeMs;
          validCount++;
        }
      }

      const meanB = validCount > 0 ? sumB / validCount : 0;
      const meanT = validCount > 0 ? sumT / validCount : 0;

      let sBB = 0;
      let sBT = 0;
      for (let i = 0; i < M; i++) {
        const n = this.flattenedNotes[i];
        const t = this.recordedTaps[i];
        if (n && t) {
          const diffB = n.startBeat - meanB;
          const diffT = t.pressTimeMs - meanT;
          sBB += diffB * diffB;
          sBT += diffB * diffT;
        }
      }

      if (sBB > 1e-6) {
        const slope = sBT / sBB;
        // Clamp to human tempo range [35 BPM, 200 BPM] -> [300 ms, 1714 ms]
        estimatedUserBeatPeriodMs = Math.max(300, Math.min(1714, slope));
        t0 = meanT - estimatedUserBeatPeriodMs * meanB;
      }
    }

    const estimatedUserBpm = Math.round(60000 / estimatedUserBeatPeriodMs);

    const noteEvaluations: NoteEvaluation[] = [];
    const grooveScores: number[] = [];
    const holdScores: number[] = [];

    for (let i = 0; i < N; i++) {
      const note = this.flattenedNotes[i];
      if (!note) continue;

      const expectedStartBeat = note.startBeat;
      const expectedDurationBeats = note.durationBeats;

      if (i < M) {
        const tap = this.recordedTaps[i];
        if (!tap) continue;

        const expectedTimeMs = t0 + estimatedUserBeatPeriodMs * expectedStartBeat;
        const onsetErrorMs = tap.pressTimeMs - expectedTimeMs;
        const relativeOnsetError = Number((onsetErrorMs / estimatedUserBeatPeriodMs).toFixed(4));
        const absErr = Math.abs(relativeOnsetError);

        let status: 'perfect' | 'loose' | 'missed';
        let noteGrooveScore: number;

        if (absErr <= 0.10) {
          status = 'perfect';
          noteGrooveScore = 100;
        } else if (absErr <= 0.18) {
          status = 'loose';
          const factor = (absErr - 0.10) / (0.18 - 0.10);
          noteGrooveScore = 100 - factor * 40;
        } else {
          status = 'missed';
          const factor = Math.min(1.0, (absErr - 0.18) / 0.18);
          noteGrooveScore = Math.max(0, 30 - factor * 30);
        }
        grooveScores.push(noteGrooveScore);

        // Hold Articulation check
        const expectedDurationMs = expectedDurationBeats * estimatedUserBeatPeriodMs;
        const releaseMs = tap.releaseTimeMs ?? (nowMs ?? tap.pressTimeMs + expectedDurationMs);
        const actualHoldMs = Math.max(0, releaseMs - tap.pressTimeMs);

        let holdRatio: number;
        let noteHoldScore: number;

        if (note.isLandingNote) {
          holdRatio = 1.0;
          noteHoldScore = 100;
        } else {
          holdRatio = Number((actualHoldMs / Math.max(1, expectedDurationMs)).toFixed(3));
          if (expectedDurationBeats >= 1.5) {
            // Sustained note
            if (holdRatio >= 0.40 && holdRatio <= 1.45) {
              noteHoldScore = 100;
            } else if (holdRatio < 0.40) {
              noteHoldScore = Math.max(0, (holdRatio / 0.40) * 100);
            } else {
              noteHoldScore = Math.max(30, 100 - (holdRatio - 1.45) * 80);
            }
          } else {
            // Standard short note (quarter, eighth, sixteenth)
            if (holdRatio >= 0.25 && holdRatio <= 1.50) {
              noteHoldScore = 100;
            } else if (holdRatio < 0.25) {
              noteHoldScore = Math.max(0, (holdRatio / 0.25) * 100);
            } else {
              noteHoldScore = Math.max(30, 100 - (holdRatio - 1.50) * 80);
            }
          }
        }
        holdScores.push(noteHoldScore);

        // Determine error hint for this note
        let errorHint: NoteErrorHint = null;
        if (status === 'missed' || status === 'loose') {
          errorHint = relativeOnsetError < -0.10 ? 'early' : relativeOnsetError > 0.10 ? 'late' : null;
        } else if (noteHoldScore < 60) {
          errorHint = holdRatio < 0.40 ? 'short' : 'long';
        }

        noteEvaluations.push({
          noteIndex: i,
          expectedStartBeat,
          expectedDurationBeats,
          relativeOnsetError,
          holdRatio,
          status,
          errorHint,
        });
      } else {
        // Missing note
        grooveScores.push(0);
        holdScores.push(0);
        noteEvaluations.push({
          noteIndex: i,
          expectedStartBeat,
          expectedDurationBeats,
          relativeOnsetError: 1.0,
          holdRatio: 0.0,
          status: 'missed',
          errorHint: 'late',
        });
      }
    }

    const meanGroove = grooveScores.length > 0 ? grooveScores.reduce((a, b) => a + b, 0) / N : 0;
    const meanHold = holdScores.length > 0 ? holdScores.reduce((a, b) => a + b, 0) / N : 0;

    const grooveScorePct = Math.round(meanGroove);
    const holdScorePct = Math.round(meanHold);
    const overallScorePct = Math.round(0.8 * grooveScorePct + 0.2 * holdScorePct);
    const hasMissed = noteEvaluations.some((e) => e.status === 'missed');
    const passed = overallScorePct >= 80 && !hasMissed;

    return {
      grooveScorePct,
      holdScorePct,
      overallScorePct,
      estimatedUserBpm,
      noteEvaluations,
      passed,
    };
  }
}
