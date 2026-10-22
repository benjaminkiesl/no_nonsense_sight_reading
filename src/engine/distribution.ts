import { StaffNoteTarget } from '../types/music';

export class AdaptiveDistribution {
  private readonly allNotes: readonly StaffNoteTarget[];
  private readonly newNoteTargetIds: Set<string>;
  private readonly rng: () => number;

  private readonly urgency: Map<string, number> = new Map();
  private readonly bigramBoost: Map<string, Map<string, number>> = new Map();

  private lastShownTargetId: string | null = null;
  private secondLastShownTargetId: string | null = null;

  constructor(
    allNotes: readonly StaffNoteTarget[],
    newNotes: readonly StaffNoteTarget[],
    rng: () => number = Math.random
  ) {
    if (allNotes.length === 0) {
      throw new Error('AdaptiveDistribution requires at least one note.');
    }
    this.allNotes = allNotes;
    this.newNoteTargetIds = new Set(newNotes.map((n) => n.targetId));
    this.rng = rng;

    for (const note of allNotes) {
      this.urgency.set(note.targetId, 0);
    }
  }

  public recordFailure(
    failedTarget: StaffNoteTarget,
    precedingTarget?: StaffNoteTarget | null
  ): void {
    const curU = this.urgency.get(failedTarget.targetId) ?? 0;
    this.urgency.set(failedTarget.targetId, Math.min(18.0, curU + 6.0));

    if (precedingTarget && precedingTarget.targetId !== failedTarget.targetId) {
      const prevU = this.urgency.get(precedingTarget.targetId) ?? 0;
      this.urgency.set(precedingTarget.targetId, Math.min(18.0, prevU + 2.5));

      let row = this.bigramBoost.get(precedingTarget.targetId);
      if (!row) {
        row = new Map<string, number>();
        this.bigramBoost.set(precedingTarget.targetId, row);
      }
      const curT = row.get(failedTarget.targetId) ?? 0;
      row.set(failedTarget.targetId, Math.min(10.0, curT + 4.5));
    }
  }

  public recordCorrectHit(hitTarget: StaffNoteTarget): void {
    const curU = this.urgency.get(hitTarget.targetId) ?? 0;
    const newU = curU * 0.75;
    this.urgency.set(hitTarget.targetId, newU < 0.05 ? 0 : newU);
  }

  public getProbabilities(): ReadonlyMap<string, number> {
    const scores = new Map<string, number>();
    let totalScore = 0;

    for (const note of this.allNotes) {
      const baseline = this.newNoteTargetIds.has(note.targetId) ? 2.5 : 1.0;
      const u = this.urgency.get(note.targetId) ?? 0;

      let t = 0;
      if (this.lastShownTargetId) {
        const row = this.bigramBoost.get(this.lastShownTargetId);
        if (row) {
          t = row.get(note.targetId) ?? 0;
        }
      }

      // Repetition dampener
      let r = 1.0;
      if (this.allNotes.length > 1) {
        if (note.targetId === this.lastShownTargetId && note.targetId === this.secondLastShownTargetId) {
          r = 0.05;
        } else if (note.targetId === this.lastShownTargetId) {
          r = 0.35;
        }
      }

      const score = (baseline + u + t) * r;
      scores.set(note.targetId, score);
      totalScore += score;
    }

    const probabilities = new Map<string, number>();
    for (const [id, score] of scores) {
      probabilities.set(id, totalScore > 0 ? score / totalScore : 1 / this.allNotes.length);
    }

    return probabilities;
  }

  public sampleNextNote(): StaffNoteTarget {
    if (this.allNotes.length === 1) {
      return this.allNotes[0]!;
    }

    const probs = this.getProbabilities();
    const r = this.rng();
    let accumulated = 0;
    let chosen: StaffNoteTarget = this.allNotes[this.allNotes.length - 1]!;

    for (const note of this.allNotes) {
      accumulated += probs.get(note.targetId) ?? 0;
      if (r <= accumulated) {
        chosen = note;
        break;
      }
    }

    // Decay urgency and transition boosts by 0.92 on step
    for (const [id, u] of this.urgency.entries()) {
      const decayed = u * 0.92;
      this.urgency.set(id, decayed < 0.05 ? 0 : decayed);
    }

    for (const row of this.bigramBoost.values()) {
      for (const [targetId, val] of row.entries()) {
        const decayed = val * 0.92;
        if (decayed < 0.05) {
          row.delete(targetId);
        } else {
          row.set(targetId, decayed);
        }
      }
    }

    this.secondLastShownTargetId = this.lastShownTargetId;
    this.lastShownTargetId = chosen.targetId;

    return chosen;
  }
}
