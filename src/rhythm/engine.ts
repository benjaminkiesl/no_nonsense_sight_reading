import {
  FlattenedRhythmNote,
  NoteEvaluation,
  PulseAutonomyMode,
  RecordedTap,
  RhythmEngineSnapshot,
  RhythmExercisePhase,
  RhythmFeedbackSummary,
  RhythmLevelSpec,
  RhythmPhrase,
} from '../types/rhythm';
import { flattenPhraseToNotes, findZoomTwinPhrase } from './curriculum';

export interface TickResult {
  readonly countInClick?: { readonly beatIndex: number; readonly totalBeats: number };
  readonly anchorClick?: boolean;
  readonly finished?: boolean;
}

export class RhythmEngine {
  private levelSpec: RhythmLevelSpec;
  private phraseIndex: number;
  private phrase: RhythmPhrase;
  private phase: RhythmExercisePhase = 'SANDBOX';
  private pulseMode: PulseAutonomyMode;
  private countInBeatIndex: number = 0;
  private countInStartMs: number = 0;
  private performStartMs: number = 0;
  private flattenedNotes: readonly FlattenedRhythmNote[];
  private sandboxMatchedCount: number = 0;
  private activeHoldNoteIndex: number | null = null;
  private recordedTaps: RecordedTap[] = [];
  private leftHandPulseCount: number = 0;
  private showWordBoxes: boolean = true;
  private feedback: RhythmFeedbackSummary | null = null;
  private lastTickedCountInBeat: number = -1;
  private lastTickedAnchorBar: number = -1;

  constructor(
    levelSpec: RhythmLevelSpec,
    phraseIndex = 0,
    initialPulseMode: PulseAutonomyMode = 'SILENT_CONTINUATION'
  ) {
    this.levelSpec = levelSpec;
    const clampedIndex = Math.max(0, Math.min(phraseIndex, levelSpec.phrases.length - 1));
    this.phraseIndex = clampedIndex;
    const selected = levelSpec.phrases[clampedIndex] ?? levelSpec.phrases[0];
    if (!selected) {
      throw new Error(`Level ${levelSpec.id} contains no phrases.`);
    }
    this.phrase = selected;
    this.pulseMode = initialPulseMode;
    this.flattenedNotes = flattenPhraseToNotes(this.phrase);
  }

  public getSnapshot(): RhythmEngineSnapshot {
    return {
      levelId: this.levelSpec.id,
      phrase: this.phrase,
      phase: this.phase,
      pulseMode: this.pulseMode,
      countInBeatIndex: this.countInBeatIndex,
      flattenedNotes: this.flattenedNotes,
      sandboxMatchedCount: this.sandboxMatchedCount,
      performTapCount: this.recordedTaps.length,
      activeHoldNoteIndex: this.activeHoldNoteIndex,
      leftHandPulseCount: this.leftHandPulseCount,
      showWordBoxes: this.showWordBoxes,
      feedback: this.feedback,
    };
  }

  public selectLevel(levelSpec: RhythmLevelSpec, phraseIndex = 0): void {
    this.levelSpec = levelSpec;
    const clampedIndex = Math.max(0, Math.min(phraseIndex, levelSpec.phrases.length - 1));
    this.phraseIndex = clampedIndex;
    const selected = levelSpec.phrases[clampedIndex] ?? levelSpec.phrases[0];
    if (selected) {
      this.selectPhrase(selected);
    }
  }

  public selectPhraseIndex(index: number): void {
    const target = this.levelSpec.phrases[index];
    if (target) {
      this.phraseIndex = index;
      this.selectPhrase(target);
    }
  }

  public selectPhraseById(phraseId: string): boolean {
    const idx = this.levelSpec.phrases.findIndex((p) => p.id === phraseId);
    if (idx !== -1) {
      const phrase = this.levelSpec.phrases[idx];
      if (phrase) {
        this.phraseIndex = idx;
        this.selectPhrase(phrase);
        return true;
      }
    }
    return false;
  }

  public selectPhrase(phrase: RhythmPhrase): void {
    this.phrase = phrase;
    this.flattenedNotes = flattenPhraseToNotes(phrase);
    this.resetToSandbox();
  }

  public advanceToNextPhrase(): boolean {
    const nextPhrase = this.levelSpec.phrases[this.phraseIndex + 1];
    if (nextPhrase) {
      this.phraseIndex++;
      this.selectPhrase(nextPhrase);
      return true;
    }
    return false;
  }

  public toggleMetricZoom(): boolean {
    const twin = findZoomTwinPhrase(this.phrase);
    if (twin) {
      this.selectPhrase(twin);
      return true;
    }
    return false;
  }

  public setPulseMode(mode: PulseAutonomyMode): void {
    this.pulseMode = mode;
  }

  public toggleWordBoxes(): void {
    this.showWordBoxes = !this.showWordBoxes;
  }

  public resetToSandbox(): void {
    this.phase = 'SANDBOX';
    this.sandboxMatchedCount = 0;
    this.activeHoldNoteIndex = null;
    this.recordedTaps = [];
    this.feedback = null;
    this.countInBeatIndex = 0;
    this.lastTickedCountInBeat = -1;
    this.lastTickedAnchorBar = -1;
  }

  public startCountIn(nowMs: number): void {
    this.phase = 'COUNT_IN';
    this.countInStartMs = nowMs;
    this.countInBeatIndex = 0;
    this.lastTickedCountInBeat = 0;
    this.recordedTaps = [];
    this.activeHoldNoteIndex = null;
    this.feedback = null;
  }

  public handleLeftHandPulse(_nowMs: number): void {
    this.leftHandPulseCount++;
  }

  public handleNotePress(nowMs: number): {
    isLanding: boolean;
    noteIndex: number;
    durationBeats: number;
  } {
    if (this.phase === 'SANDBOX') {
      const idx = this.sandboxMatchedCount;
      const note = this.flattenedNotes[idx];
      this.activeHoldNoteIndex = idx;
      this.sandboxMatchedCount = (this.sandboxMatchedCount + 1) % Math.max(1, this.flattenedNotes.length);
      return {
        isLanding: note?.isLandingNote ?? false,
        noteIndex: idx,
        durationBeats: note?.durationBeats ?? 1.0,
      };
    }

    if (this.phase === 'PERFORM') {
      if (this.recordedTaps.length < this.flattenedNotes.length) {
        const noteIndex = this.recordedTaps.length;
        const note = this.flattenedNotes[noteIndex];
        this.recordedTaps.push({ pressTimeMs: nowMs, releaseTimeMs: null });
        this.activeHoldNoteIndex = noteIndex;
        return {
          isLanding: note?.isLandingNote ?? false,
          noteIndex,
          durationBeats: note?.durationBeats ?? 1.0,
        };
      }
    }

    return { isLanding: false, noteIndex: -1, durationBeats: 1.0 };
  }

  public handleNoteRelease(nowMs: number): void {
    if (this.phase === 'SANDBOX') {
      this.activeHoldNoteIndex = null;
      return;
    }

    if (this.phase === 'PERFORM') {
      if (this.activeHoldNoteIndex !== null) {
        const tap = this.recordedTaps[this.activeHoldNoteIndex];
        if (tap) {
          tap.releaseTimeMs = nowMs;
        }
        this.activeHoldNoteIndex = null;
      }

      // If all notes are tapped and the final note is released, complete immediately
      if (this.recordedTaps.length === this.flattenedNotes.length) {
        this.phase = 'FEEDBACK';
        this.feedback = this.evaluatePerformance(nowMs);
      }
    }
  }

  public tick(nowMs: number): TickResult {
    const beatPeriodMs = 60000 / this.phrase.targetBpm;

    if (this.phase === 'COUNT_IN') {
      const elapsedMs = nowMs - this.countInStartMs;
      const currentBeat = Math.floor(elapsedMs / beatPeriodMs);

      if (currentBeat < this.phrase.beatsPerBar) {
        this.countInBeatIndex = currentBeat;
        if (currentBeat !== this.lastTickedCountInBeat) {
          this.lastTickedCountInBeat = currentBeat;
          return {
            countInClick: {
              beatIndex: currentBeat,
              totalBeats: this.phrase.beatsPerBar,
            },
          };
        }
      } else {
        // Transition to PERFORM
        this.phase = 'PERFORM';
        this.performStartMs = this.countInStartMs + this.phrase.beatsPerBar * beatPeriodMs;
        this.recordedTaps = [];
        this.activeHoldNoteIndex = null;
        this.lastTickedAnchorBar = 0;
        return {};
      }
    }

    if (this.phase === 'PERFORM') {
      const elapsedPerformMs = nowMs - this.performStartMs;

      // Bar Downbeat Anchor pulse if enabled
      let anchorClick = false;
      if (this.pulseMode === 'BAR_DOWNBEAT_ANCHOR') {
        const barPeriodMs = this.phrase.beatsPerBar * beatPeriodMs;
        const currentBar = Math.floor(elapsedPerformMs / barPeriodMs);
        if (currentBar > this.lastTickedAnchorBar && currentBar >= 0) {
          this.lastTickedAnchorBar = currentBar;
          anchorClick = true;
        }
      }

      // Auto-complete if all notes tapped and 350ms elapsed since last press
      if (this.recordedTaps.length === this.flattenedNotes.length && this.recordedTaps.length > 0) {
        const lastTap = this.recordedTaps[this.recordedTaps.length - 1];
        if (lastTap && nowMs - lastTap.pressTimeMs >= 350) {
          this.phase = 'FEEDBACK';
          this.feedback = this.evaluatePerformance(nowMs);
          return { anchorClick, finished: true };
        }
      }

      // Timeout completion if user stops playing
      const totalPhraseBeats = this.phrase.beatCells.length;
      if (elapsedPerformMs >= (totalPhraseBeats + 2.0) * beatPeriodMs) {
        this.phase = 'FEEDBACK';
        this.feedback = this.evaluatePerformance(nowMs);
        return { anchorClick, finished: true };
      }

      if (anchorClick) {
        return { anchorClick };
      }
    }

    return {};
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
        pulseDriftPct: 0,
        estimatedUserBpm: this.phrase.targetBpm,
        noteEvaluations: [],
        passed: true,
      };
    }

    // 1. Estimate user's local beat period and origin via linear regression
    let estimatedUserBeatPeriodMs = targetBeatPeriodMs;
    let t0 = this.performStartMs;

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
        // Clamp slope between 0.5x and 2.0x target beat period
        estimatedUserBeatPeriodMs = Math.max(
          0.5 * targetBeatPeriodMs,
          Math.min(2.0 * targetBeatPeriodMs, slope)
        );
        t0 = meanT - estimatedUserBeatPeriodMs * meanB;
      } else {
        const firstTap = this.recordedTaps[0];
        const firstNote = this.flattenedNotes[0];
        if (firstTap && firstNote) {
          t0 = firstTap.pressTimeMs - estimatedUserBeatPeriodMs * firstNote.startBeat;
        }
      }
    } else if (M === 1) {
      const firstTap = this.recordedTaps[0];
      const firstNote = this.flattenedNotes[0];
      if (firstTap && firstNote) {
        t0 = firstTap.pressTimeMs - estimatedUserBeatPeriodMs * firstNote.startBeat;
      }
    }

    const estimatedUserBpm = Math.round(60000 / estimatedUserBeatPeriodMs);
    const pulseDriftPct = Number(
      (((estimatedUserBpm - this.phrase.targetBpm) / this.phrase.targetBpm) * 100).toFixed(1)
    );

    // 2. Evaluate each note for Groove (Relative IOI error) and Hold Articulation
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

        if (absErr <= 0.085) {
          status = 'perfect';
          noteGrooveScore = 100;
        } else if (absErr <= 0.16) {
          status = 'loose';
          // Linear interpolation between 100% and 60%
          const factor = (absErr - 0.085) / (0.16 - 0.085);
          noteGrooveScore = 100 - factor * 40;
        } else {
          status = 'missed';
          // Linear decay from 30% down to 0%
          const factor = Math.min(1.0, (absErr - 0.16) / 0.16);
          noteGrooveScore = Math.max(0, 30 - factor * 30);
        }
        grooveScores.push(noteGrooveScore);

        // Hold Articulation evaluation
        const expectedDurationMs = expectedDurationBeats * estimatedUserBeatPeriodMs;
        const releaseMs = tap.releaseTimeMs ?? (nowMs ?? tap.pressTimeMs + expectedDurationMs);
        const actualHoldMs = Math.max(0, releaseMs - tap.pressTimeMs);

        let holdRatio: number;
        let noteHoldScore: number;

        if (note.isLandingNote) {
          // Landing note only requires a clean landing strike
          holdRatio = 1.0;
          noteHoldScore = 100;
        } else {
          holdRatio = Number((actualHoldMs / Math.max(1, expectedDurationMs)).toFixed(3));
          if (holdRatio >= 0.40 && holdRatio <= 1.40) {
            noteHoldScore = 100;
          } else if (holdRatio < 0.40) {
            // Penalize ultra-short staccato touches on sustained notes
            noteHoldScore = Math.max(0, (holdRatio / 0.40) * 100);
          } else {
            // Held too long past note duration
            noteHoldScore = Math.max(20, 100 - (holdRatio - 1.40) * 80);
          }
        }
        holdScores.push(noteHoldScore);

        noteEvaluations.push({
          noteIndex: i,
          expectedStartBeat,
          expectedDurationBeats,
          relativeOnsetError,
          holdRatio,
          status,
        });
      } else {
        // Missing tap for note i
        grooveScores.push(0);
        holdScores.push(0);
        noteEvaluations.push({
          noteIndex: i,
          expectedStartBeat,
          expectedDurationBeats,
          relativeOnsetError: 1.0,
          holdRatio: 0.0,
          status: 'missed',
        });
      }
    }

    const meanGroove = grooveScores.length > 0 ? grooveScores.reduce((acc, v) => acc + v, 0) / N : 0;
    const meanHold = holdScores.length > 0 ? holdScores.reduce((acc, v) => acc + v, 0) / N : 0;

    const grooveScorePct = Math.round(meanGroove);
    const holdScorePct = Math.round(meanHold);
    const overallScorePct = Math.round(0.8 * grooveScorePct + 0.2 * holdScorePct);
    const passed = overallScorePct >= 80;

    return {
      grooveScorePct,
      holdScorePct,
      overallScorePct,
      pulseDriftPct,
      estimatedUserBpm,
      noteEvaluations,
      passed,
    };
  }
}
