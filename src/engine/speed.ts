export class SpeedController {
  public targetBpm = 60.0;          // 60..90
  public actualBpm = 40.0;          // 40..90
  public holdNotesRemaining = 32;   // 32..0

  private rampElapsedSec = 0.0;
  private rampStartBpm = 40.0;
  private notesHitSinceLastFailure = Infinity;

  public tick(deltaSec: number, isPaused: boolean): void {
    if (isPaused) {
      return;
    }

    if (this.rampElapsedSec < 4.0) {
      this.rampElapsedSec = Math.min(4.0, this.rampElapsedSec + deltaSec);
      const alpha = this.rampElapsedSec / 4.0;
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
      this.targetBpm = Math.min(90.0, this.targetBpm + 1.25);
      if (this.rampElapsedSec >= 4.0) {
        this.actualBpm = this.targetBpm;
      }
      if (this.targetBpm >= 90.0 && this.actualBpm >= 90.0) {
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

    this.targetBpm = Math.max(60.0, this.targetBpm * (1.0 - 0.08 * d));
    this.notesHitSinceLastFailure = 0;

    if (currentPhase === 'HOLD') {
      this.holdNotesRemaining = 32;
    }

    return { nextPhase: 'SPEED_UP' };
  }

  public startRecoveryRamp(): void {
    this.actualBpm = 40.0;
    this.rampStartBpm = 40.0;
    this.rampElapsedSec = 0.0;
  }

  public getSpeedStepIndex(): number {
    const raw = Math.round(((this.targetBpm - 60.0) / 30.0) * 24);
    return Math.max(0, Math.min(24, raw));
  }
}
