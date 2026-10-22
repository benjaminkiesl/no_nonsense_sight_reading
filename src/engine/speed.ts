export interface SpeedControllerOptions {
  mode?: 'standard' | 'accelerando';
  startingBpm?: number;
  maxBpm?: number;
}

export class SpeedController {
  public static readonly V_MIN_START = 15.0;     // Initial very slow scroll speed after countdown
  public static readonly V_TARGET_INIT = 28.0;   // Starting target speed in standard mode
  public static readonly V_TARGET_MAX = 52.0;    // Maximum target speed where Hold begins in standard mode
  public static readonly V_ACCELERANDO_MAX = 240.0; // Maximum target speed in Accelerando mode
  public static readonly RAMP_DURATION_SEC = 4.0;
  public static readonly DELTA_HIT = 0.2;        // +0.2 BPM per correct hit

  public readonly isAccelerando: boolean;
  public readonly maxBpm: number;
  public targetBpm: number;
  public actualBpm: number;
  public holdNotesRemaining = 32;

  private rampElapsedSec = 0.0;
  private rampStartBpm = SpeedController.V_MIN_START;
  private notesHitSinceLastFailure = Infinity;

  constructor(options?: SpeedControllerOptions) {
    this.isAccelerando = options?.mode === 'accelerando';

    if (this.isAccelerando) {
      const startBpm = options?.startingBpm ?? 40.0;
      this.maxBpm = options?.maxBpm ?? SpeedController.V_ACCELERANDO_MAX;
      this.targetBpm = Math.min(this.maxBpm, Math.max(SpeedController.V_MIN_START, startBpm));
      this.actualBpm = this.targetBpm;
      // Already at running tempo when starting Accelerando Perpetuo
      this.rampElapsedSec = SpeedController.RAMP_DURATION_SEC;
    } else {
      this.maxBpm = SpeedController.V_TARGET_MAX;
      this.targetBpm = SpeedController.V_TARGET_INIT;
      this.actualBpm = SpeedController.V_MIN_START;
      this.rampElapsedSec = 0.0;
    }
  }

  public tick(deltaSec: number, isPaused: boolean): void {
    if (isPaused) {
      return;
    }

    if (this.rampElapsedSec < SpeedController.RAMP_DURATION_SEC) {
      this.rampElapsedSec = Math.min(SpeedController.RAMP_DURATION_SEC, this.rampElapsedSec + deltaSec);
      const alpha = this.rampElapsedSec / SpeedController.RAMP_DURATION_SEC;
      this.actualBpm = this.rampStartBpm + (this.targetBpm - this.rampStartBpm) * alpha;
    } else {
      this.actualBpm = this.targetBpm;
    }
  }

  public onCorrectHit(
    currentPhase: 'SPEED_UP' | 'HOLD'
  ): { nextPhase: 'SPEED_UP' | 'HOLD' | 'LEVEL_COMPLETE' } {
    this.notesHitSinceLastFailure++;

    if (this.isAccelerando) {
      const nextBpm = Math.round((this.targetBpm + SpeedController.DELTA_HIT) * 10) / 10;
      this.targetBpm = Math.min(this.maxBpm, nextBpm);
      if (this.rampElapsedSec >= SpeedController.RAMP_DURATION_SEC) {
        this.actualBpm = this.targetBpm;
      }
      return { nextPhase: 'SPEED_UP' };
    }

    if (currentPhase === 'SPEED_UP') {
      const nextBpm = Math.round((this.targetBpm + SpeedController.DELTA_HIT) * 10) / 10;
      this.targetBpm = Math.min(SpeedController.V_TARGET_MAX, nextBpm);
      if (this.rampElapsedSec >= SpeedController.RAMP_DURATION_SEC) {
        this.actualBpm = this.targetBpm;
      }
      if (
        this.targetBpm >= SpeedController.V_TARGET_MAX &&
        this.actualBpm >= SpeedController.V_TARGET_MAX
      ) {
        return { nextPhase: 'HOLD' };
      }
      return { nextPhase: 'SPEED_UP' };
    }

    // currentPhase === 'HOLD'
    this.holdNotesRemaining--;
    if (this.holdNotesRemaining <= 0) {
      return { nextPhase: 'LEVEL_COMPLETE' };
    }
    return { nextPhase: 'HOLD' };
  }

  public onFailure(currentPhase: 'SPEED_UP' | 'HOLD'): { nextPhase: 'SPEED_UP' } {
    let d = 1.0;
    if (this.notesHitSinceLastFailure === 2) {
      d = 0.5;
    } else if (this.notesHitSinceLastFailure <= 1) {
      d = 0.25;
    }

    const minFloor = this.isAccelerando ? SpeedController.V_MIN_START : SpeedController.V_TARGET_INIT;
    this.targetBpm = Math.max(
      minFloor,
      this.targetBpm * (1.0 - 0.08 * d)
    );
    this.notesHitSinceLastFailure = 0;

    if (currentPhase === 'HOLD') {
      this.holdNotesRemaining = 32;
    }

    return { nextPhase: 'SPEED_UP' };
  }

  public startRecoveryRamp(): void {
    this.actualBpm = SpeedController.V_MIN_START;
    this.rampStartBpm = SpeedController.V_MIN_START;
    this.rampElapsedSec = 0.0;
  }

  public getSpeedStepIndex(): number {
    const minBpm = this.isAccelerando ? SpeedController.V_MIN_START : SpeedController.V_TARGET_INIT;
    const maxBpm = this.maxBpm;
    const span = maxBpm - minBpm;
    if (span <= 0) return 0;
    const raw = Math.round(((this.targetBpm - minBpm) / span) * 24);
    return Math.max(0, Math.min(24, raw));
  }
}
