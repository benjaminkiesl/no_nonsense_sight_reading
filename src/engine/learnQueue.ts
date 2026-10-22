import { StaffNoteTarget } from '../types/music';

export class LearnSessionManager {
  private readonly rng: () => number;
  private readonly allTargets: readonly StaffNoteTarget[];
  private readonly remainingHits: Map<string, number> = new Map();
  private readonly targetsById: Map<string, StaffNoteTarget> = new Map();
  private readonly totalRequiredCount: number;

  private currentTarget: StaffNoteTarget | null = null;
  private lastShownTargetId: string | null = null;
  private failedOnCurrentPrompt = false;

  constructor(
    newNotes: readonly StaffNoteTarget[],
    reviewNotes: readonly StaffNoteTarget[],
    rng: () => number = Math.random
  ) {
    this.rng = rng;

    // Deduplicate targets by targetId
    for (const note of newNotes) {
      this.targetsById.set(note.targetId, note);
    }

    // Limit review notes so total <= 24 constraint is never violated
    const distinctReviewNotes: StaffNoteTarget[] = [];
    for (const note of reviewNotes) {
      if (!this.targetsById.has(note.targetId)) {
        this.targetsById.set(note.targetId, note);
        distinctReviewNotes.push(note);
      }
    }

    // Cap review notes if needed
    const maxReviewNotes = Math.max(0, 24 - newNotes.length * 3);
    const selectedReviewNotes = distinctReviewNotes.slice(0, Math.min(4, maxReviewNotes));

    // Determine required hits per note
    let requiredNewHits = 5;
    if (newNotes.length > 0) {
      const budgetForNew = 24 - selectedReviewNotes.length;
      requiredNewHits = Math.min(5, Math.max(1, Math.floor(budgetForNew / newNotes.length)));
    }

    let total = 0;
    for (const note of newNotes) {
      this.remainingHits.set(note.targetId, requiredNewHits);
      total += requiredNewHits;
    }
    for (const note of selectedReviewNotes) {
      this.remainingHits.set(note.targetId, 1);
      total += 1;
    }

    this.totalRequiredCount = total;
    this.allTargets = [...newNotes, ...selectedReviewNotes];

    this.pickNextTarget();
  }

  public getCurrentTarget(): StaffNoteTarget | null {
    return this.currentTarget;
  }

  public getCompletedCount(): number {
    let remaining = 0;
    for (const count of this.remainingHits.values()) {
      remaining += count;
    }
    return Math.max(0, this.totalRequiredCount - remaining);
  }

  public getTotalRequiredCount(): number {
    return this.totalRequiredCount;
  }

  public recordAttempt(isCorrect: boolean): { completedPrompt: boolean; sessionFinished: boolean } {
    if (!this.currentTarget) {
      return { completedPrompt: true, sessionFinished: true };
    }

    if (!isCorrect) {
      this.failedOnCurrentPrompt = true;
      return { completedPrompt: false, sessionFinished: false };
    }

    // Correct hit!
    if (!this.failedOnCurrentPrompt) {
      const remaining = (this.remainingHits.get(this.currentTarget.targetId) ?? 1) - 1;
      this.remainingHits.set(this.currentTarget.targetId, Math.max(0, remaining));
    }

    this.lastShownTargetId = this.currentTarget.targetId;
    this.failedOnCurrentPrompt = false;
    this.pickNextTarget();

    const sessionFinished = this.currentTarget === null;
    return { completedPrompt: true, sessionFinished };
  }

  private pickNextTarget(): void {
    const candidates = this.allTargets.filter(
      (n) => (this.remainingHits.get(n.targetId) ?? 0) > 0
    );

    if (candidates.length === 0) {
      this.currentTarget = null;
      return;
    }

    // Avoid immediate repetition when multiple candidates exist
    let eligible = candidates;
    if (candidates.length > 1 && this.lastShownTargetId) {
      const withoutLast = candidates.filter((n) => n.targetId !== this.lastShownTargetId);
      if (withoutLast.length > 0) {
        eligible = withoutLast;
      }
    }

    // Weighted selection proportional to remaining hits
    let totalWeight = 0;
    for (const c of eligible) {
      totalWeight += this.remainingHits.get(c.targetId) ?? 1;
    }

    let r = this.rng() * totalWeight;
    for (const c of eligible) {
      const weight = this.remainingHits.get(c.targetId) ?? 1;
      if (r < weight) {
        this.currentTarget = c;
        return;
      }
      r -= weight;
    }

    this.currentTarget = eligible[eligible.length - 1] ?? null;
  }
}
