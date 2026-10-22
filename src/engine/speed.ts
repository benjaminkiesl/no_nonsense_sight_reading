export class SpeedController {
  public static readonly V_MIN_START = 15.0;     // Initial very slow scroll speed after countdown
  public static readonly V_TARGET_INIT = 28.0;   // Starting target speed
  public static readonly V_TARGET_MAX = 52.0;    // Maximum target speed where Hold begins
  public static readonly RAMP_DURATION_SEC = 4.0;
  public static readonly DELTA_HIT = 0.2;        // 120 hits to go from 28 to 52 BPM

  public targetBpm = SpeedController.V_TARGET_INIT;
  public actualBpm = SpeedController.V_MIN_START;
  public holdNotesRemaining = 32;

  private rampElapsedSec = 0.0;
  private rampStartBpm = SpeedController.V_MIN_START;
  private notesHitSinceLastFailure = Infinity;

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

    if (currentPhase === 'SPEED_UP') {
      this.targetBpm = Math.min(SpeedController.V_TARGET_MAX, this.targetBpm + SpeedController.DELTA_HIT);
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

    this.targetBpm = Math.max(
      SpeedController.V_TARGET_INIT,
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
    const span = SpeedController.V_TARGET_MAX - SpeedController.V_TARGET_INIT;
    const raw = Math.round(((this.targetBpm - SpeedController.V_TARGET_INIT) / span) * 24);
    return Math.max(0, Math.min(24, raw));
  }
}
