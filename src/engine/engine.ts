import { matchesTarget } from '../input/inputRouter';
import { LevelSpec } from '../types/curriculum';
import { ActiveNote, EnginePhase, EngineSnapshot, EngineSubstate } from '../types/engine';
import { UserNoteInput } from '../types/input';
import { StaffNoteTarget } from '../types/music';
import { AdaptiveDistribution } from './distribution';
import { LearnSessionManager } from './learnQueue';
import { SpeedController } from './speed';

export const ENGINE_GEOMETRY = {
  CANVAS_WIDTH: 840,
  NOTE_SPACING_PX: 114,
  HIT_ZONE_LEFT_X: 120,
  HIT_ZONE_RIGHT_X: 156,
  HIT_ZONE_CENTER_X: 138,
  EARLY_GRACE_PX: 28,
  FIRST_NOTE_COUNTDOWN_X: 216,
} as const;

export const RECOVERY_PAUSE_TOTAL_MS = 6500;
export const RECOVERY_LOOKAHEAD_MS = 1000; // Final 1.0s of the 6.5s pause is static lookahead
export const ERROR_CLUSTER_THRESHOLD = 6;  // <= 6 correct hits since previous failure

export interface EngineOptions {
  mode?: 'standard' | 'accelerando';
  accelerandoStartingBpm?: number;
  customNotes?: readonly StaffNoteTarget[];
}

export class SightReadingEngine {
  public readonly level: LevelSpec;
  public readonly isAccelerando: boolean;
  public readonly accelerandoStartBpm: number;
  public readonly speedController: SpeedController;

  private readonly learnSession: LearnSessionManager;
  private readonly distribution: AdaptiveDistribution;

  private phase: EnginePhase = 'LEARN';
  private substate: EngineSubstate = 'NORMAL';
  private countdownRemainingSec = 3.0;
  private activeNotes: ActiveNote[] = [];
  private emptyZonePulseRemainingMs = 0;
  private levelCompleteGuardRemainingMs = 0;
  private recoveryRemainingMs = 0;
  private pendingRecoveryPause = false;
  private wrongAttemptsDuringCorrection = 0;

  private noteIdCounter = 0;
  private lastPrecedingTarget: StaffNoteTarget | null = null;
  private failedNote: ActiveNote | null = null;

  constructor(
    level: LevelSpec,
    rng: () => number = Math.random,
    options?: EngineOptions
  ) {
    this.level = level;
    this.isAccelerando = options?.mode === 'accelerando';
    this.accelerandoStartBpm = options?.accelerandoStartingBpm ?? 40.0;

    if (this.isAccelerando) {
      const notes =
        options?.customNotes && options.customNotes.length > 0
          ? options.customNotes
          : level.allNotes;
      this.learnSession = new LearnSessionManager([], [], rng);
      this.distribution = new AdaptiveDistribution(notes, notes, rng);
      this.speedController = new SpeedController({
        mode: 'accelerando',
        startingBpm: this.accelerandoStartBpm,
        maxBpm: 240.0,
      });

      // In Accelerando mode, start with countdown
      this.transitionToCountdown();
    } else {
      this.learnSession = new LearnSessionManager(level.newNotes, level.reviewNotes, rng);
      this.distribution = new AdaptiveDistribution(level.allNotes, level.newNotes, rng);
      this.speedController = new SpeedController();

      // Spawn first learn note
      const firstLearnTarget = this.learnSession.getCurrentTarget();
      if (firstLearnTarget) {
        this.spawnLearnNote(firstLearnTarget);
      }
    }
  }

  public tick(deltaMs: number): void {
    if (deltaMs <= 0) return;

    // Pulse timers
    if (this.emptyZonePulseRemainingMs > 0) {
      this.emptyZonePulseRemainingMs = Math.max(0, this.emptyZonePulseRemainingMs - deltaMs);
    }
    if (this.levelCompleteGuardRemainingMs > 0) {
      this.levelCompleteGuardRemainingMs = Math.max(0, this.levelCompleteGuardRemainingMs - deltaMs);
    }

    // Clean up finished 'hit' notes after 200ms animation
    for (const note of this.activeNotes) {
      if (note.state === 'hit') {
        note.stateTimeMs += deltaMs;
      }
    }
    this.activeNotes = this.activeNotes.filter(
      (n) => n.state !== 'hit' || n.stateTimeMs < 200
    );

    // State machine logic
    if (this.phase === 'LEARN') {
      // Notes are stationary in hit zone
      return;
    }

    if (this.phase === 'COUNTDOWN') {
      this.countdownRemainingSec = Math.max(0, this.countdownRemainingSec - deltaMs / 1000);
      if (this.countdownRemainingSec <= 0) {
        this.phase = 'SPEED_UP';
      }
      return;
    }

    if (this.phase === 'SPEED_UP' || this.phase === 'HOLD') {
      const deltaSec = deltaMs / 1000;

      if (this.substate === 'RECOVERY_PAUSE') {
        this.speedController.tick(deltaSec, true);
        this.recoveryRemainingMs = Math.max(0, this.recoveryRemainingMs - deltaMs);
        if (this.recoveryRemainingMs <= 0) {
          this.recoveryRemainingMs = 0;
          this.substate = 'NORMAL';
          this.speedController.startRecoveryRamp();
        }
        return;
      }

      if (this.substate === 'NORMAL') {
        this.speedController.tick(deltaSec, false);

        // Note scroll velocity in px/s: 114 * (actualBpm / 60)
        const scrollVx = ENGINE_GEOMETRY.NOTE_SPACING_PX * (this.speedController.actualBpm / 60.0);
        const deltaX = scrollVx * deltaSec;

        for (const note of this.activeNotes) {
          if (note.state === 'approaching') {
            note.x -= deltaX;
          }
        }

        // Spawn new approaching notes to keep the staff filled to the right edge
        let maxX = 0;
        for (const note of this.activeNotes) {
          if (note.state === 'approaching' && note.x > maxX) {
            maxX = note.x;
          }
        }

        while (maxX < ENGINE_GEOMETRY.CANVAS_WIDTH + ENGINE_GEOMETRY.NOTE_SPACING_PX) {
          const spawnX = maxX === 0 ? ENGINE_GEOMETRY.CANVAS_WIDTH : maxX + ENGINE_GEOMETRY.NOTE_SPACING_PX;
          const nextTarget = this.distribution.sampleNextNote();
          this.activeNotes.push({
            id: `note-${++this.noteIdCounter}`,
            target: nextTarget,
            x: spawnX,
            state: 'approaching',
            stateTimeMs: 0,
            failedOnCurrentPrompt: false,
          });
          maxX = spawnX;
        }

        // Check for late misses (note crossed left border of hit zone)
        const frontmost = this.getFrontmostApproachingNote();
        if (frontmost && frontmost.x < ENGINE_GEOMETRY.HIT_ZONE_LEFT_X) {
          frontmost.x = ENGINE_GEOMETRY.HIT_ZONE_LEFT_X;
          this.triggerNoteFailure(frontmost);
        }
      } else {
        // substate === 'WAITING_FOR_CORRECTION'
        this.speedController.tick(deltaSec, true);
      }
    }
  }

  public handleNoteInput(input: UserNoteInput): {
    outcome:
      | 'correct_hit'
      | 'wrong_hit'
      | 'correction_complete'
      | 'empty_zone'
      | 'level_advance'
      | 'recovery_muted'
      | 'ignored';
    matchedTarget?: StaffNoteTarget;
  } {
    if (this.phase === 'LEVEL_COMPLETE') {
      if (this.levelCompleteGuardRemainingMs > 0) {
        return { outcome: 'ignored' };
      }
      return { outcome: 'level_advance' };
    }

    if (this.phase === 'COUNTDOWN') {
      this.emptyZonePulseRemainingMs = 150;
      return { outcome: 'ignored' };
    }

    if (this.phase === 'LEARN') {
      const activeNote = this.activeNotes.find((n) => n.state === 'approaching' || n.state === 'failed');
      if (!activeNote) {
        return { outcome: 'ignored' };
      }

      if (matchesTarget(input, activeNote.target)) {
        const outcome = activeNote.state === 'failed' ? 'correction_complete' : 'correct_hit';
        activeNote.state = 'hit';
        activeNote.stateTimeMs = 0;
        this.lastPrecedingTarget = activeNote.target;

        const res = this.learnSession.recordAttempt(true);
        if (res.sessionFinished) {
          this.transitionToCountdown();
        } else {
          const nextTarget = this.learnSession.getCurrentTarget();
          if (nextTarget) {
            this.spawnLearnNote(nextTarget);
          }
        }

        return { outcome, matchedTarget: activeNote.target };
      }

      // Wrong key in LEARN
      activeNote.state = 'failed';
      activeNote.failedOnCurrentPrompt = true;
      this.distribution.recordFailure(activeNote.target, this.lastPrecedingTarget);
      this.learnSession.recordAttempt(false);
      return { outcome: 'wrong_hit', matchedTarget: activeNote.target };
    }

    // SPEED_UP or HOLD phase
    if (this.substate === 'RECOVERY_PAUSE') {
      return { outcome: 'recovery_muted' };
    }

    if (this.substate === 'WAITING_FOR_CORRECTION') {
      if (!this.failedNote) {
        this.substate = 'NORMAL';
        return { outcome: 'ignored' };
      }

      if (matchesTarget(input, this.failedNote.target)) {
        const target = this.failedNote.target;
        this.failedNote.state = 'hit';
        this.failedNote.stateTimeMs = 0;
        this.lastPrecedingTarget = target;
        this.failedNote = null;

        if (this.pendingRecoveryPause) {
          this.substate = 'RECOVERY_PAUSE';
          this.recoveryRemainingMs = RECOVERY_PAUSE_TOTAL_MS;
          this.pendingRecoveryPause = false;
          this.wrongAttemptsDuringCorrection = 0;
        } else {
          this.substate = 'NORMAL';
          this.speedController.startRecoveryRamp();
        }
        return { outcome: 'correction_complete', matchedTarget: target };
      }

      this.wrongAttemptsDuringCorrection++;
      if (this.wrongAttemptsDuringCorrection >= 2) {
        this.pendingRecoveryPause = true;
      }
      return { outcome: 'wrong_hit', matchedTarget: this.failedNote.target };
    }

    // substate === 'NORMAL'
    const frontmost = this.getFrontmostApproachingNote();
    if (!frontmost) {
      this.emptyZonePulseRemainingMs = 150;
      return { outcome: 'empty_zone' };
    }

    // Hittable window: 120 <= x <= 184 (with 28px early grace)
    const inWindow =
      frontmost.x >= ENGINE_GEOMETRY.HIT_ZONE_LEFT_X &&
      frontmost.x <= ENGINE_GEOMETRY.HIT_ZONE_RIGHT_X + ENGINE_GEOMETRY.EARLY_GRACE_PX;

    if (!inWindow) {
      this.emptyZonePulseRemainingMs = 150;
      return { outcome: 'empty_zone' };
    }

    // Note is inside the hittable window
    if (matchesTarget(input, frontmost.target)) {
      frontmost.state = 'hit';
      frontmost.stateTimeMs = 0;
      this.distribution.recordCorrectHit(frontmost.target);
      this.lastPrecedingTarget = frontmost.target;

      const hitResult = this.speedController.onCorrectHit(this.phase as 'SPEED_UP' | 'HOLD');
      if (hitResult.nextPhase === 'HOLD') {
        this.phase = 'HOLD';
      } else if (hitResult.nextPhase === 'LEVEL_COMPLETE') {
        this.phase = 'LEVEL_COMPLETE';
        this.levelCompleteGuardRemainingMs = 400;
      }

      return { outcome: 'correct_hit', matchedTarget: frontmost.target };
    }

    // Wrong hit inside hittable window
    this.triggerNoteFailure(frontmost);

    return { outcome: 'wrong_hit', matchedTarget: frontmost.target };
  }

  public getSnapshot(): EngineSnapshot {
    return {
      levelId: this.level.id,
      phase: this.phase,
      substate: this.substate,
      recoveryRemainingMs: this.recoveryRemainingMs,
      countdownRemainingSec: this.countdownRemainingSec,
      actualBpm: this.speedController.actualBpm,
      targetBpm: this.speedController.targetBpm,
      learnStepIndex: this.learnSession.getCompletedCount(),
      learnTotalSteps: this.learnSession.getTotalRequiredCount(),
      speedStepIndex: this.speedController.getSpeedStepIndex(),
      speedTotalSteps: 24,
      holdCompletedCount: 32 - this.speedController.holdNotesRemaining,
      holdTotalCount: 32,
      activeNotes: [...this.activeNotes],
      emptyZonePulseRemainingMs: this.emptyZonePulseRemainingMs,
      levelCompleteGuardRemainingMs: this.levelCompleteGuardRemainingMs,
      isAccelerando: this.isAccelerando,
      accelerandoStartBpm: this.accelerandoStartBpm,
    };
  }

  private triggerNoteFailure(note: ActiveNote): void {
    const hitsSinceLastFail = this.speedController.getNotesHitSinceLastFailure();
    const isClusterOrHoldFailure =
      hitsSinceLastFail <= ERROR_CLUSTER_THRESHOLD || this.phase === 'HOLD';

    this.pendingRecoveryPause = isClusterOrHoldFailure;
    this.wrongAttemptsDuringCorrection = 0;

    note.state = 'failed';
    this.failedNote = note;
    this.substate = 'WAITING_FOR_CORRECTION';
    this.distribution.recordFailure(note.target, this.lastPrecedingTarget);
    this.speedController.onFailure(this.phase as 'SPEED_UP' | 'HOLD');
    if (this.phase === 'HOLD') {
      this.phase = 'SPEED_UP';
    }
  }

  private spawnLearnNote(target: StaffNoteTarget): void {
    this.activeNotes = [
      {
        id: `learn-${++this.noteIdCounter}`,
        target,
        x: ENGINE_GEOMETRY.HIT_ZONE_CENTER_X,
        state: 'approaching',
        stateTimeMs: 0,
        failedOnCurrentPrompt: false,
      },
    ];
  }

  private transitionToCountdown(): void {
    this.phase = 'COUNTDOWN';
    this.countdownRemainingSec = 3.0;
    this.activeNotes = [];

    // Pre-spawn notes stationary during countdown
    let currentX = ENGINE_GEOMETRY.FIRST_NOTE_COUNTDOWN_X;
    while (currentX <= ENGINE_GEOMETRY.CANVAS_WIDTH + ENGINE_GEOMETRY.NOTE_SPACING_PX) {
      const target = this.distribution.sampleNextNote();
      this.activeNotes.push({
        id: `note-${++this.noteIdCounter}`,
        target,
        x: currentX,
        state: 'approaching',
        stateTimeMs: 0,
        failedOnCurrentPrompt: false,
      });
      currentX += ENGINE_GEOMETRY.NOTE_SPACING_PX;
    }
  }

  private getFrontmostApproachingNote(): ActiveNote | null {
    let frontmost: ActiveNote | null = null;
    for (const note of this.activeNotes) {
      if (note.state === 'approaching') {
        if (!frontmost || note.x < frontmost.x) {
          frontmost = note;
        }
      }
    }
    return frontmost;
  }
}
