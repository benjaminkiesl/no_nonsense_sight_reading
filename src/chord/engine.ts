import {
  ActiveChordEvent,
  ChordDefinition,
  ChordEnginePhase,
  ChordEngineSnapshot,
  ChordEngineSubstate,
  ChordLevelSpec,
  ChordNotationSystem,
} from '../types/chord';
import { toPitchClass, validateChordMidis } from './chords';
import { getNextMarkovChord } from './curriculum';

export const CHORD_ENGINE_GEOMETRY = {
  CANVAS_WIDTH: 840,
  HIT_ZONE_LEFT_X: 116,
  HIT_ZONE_RIGHT_X: 176,
  HIT_ZONE_CENTER_X: 146,
  EARLY_GRACE_PX: 44,
  CHORD_SPACING_PX: 220,
  FIRST_CHORD_COUNTDOWN_X: 230,
} as const;

export interface ChordNoteInputResult {
  outcome:
    | 'correct_hit'
    | 'wrong_notes'
    | 'correction_complete'
    | 'building_chord'
    | 'level_advance'
    | 'empty_zone'
    | 'ignored';
  targetChord?: ChordDefinition;
  validMidis?: number[];
  invalidMidis?: number[];
}

export function midiToBassDiatonicStep(midi: number): {
  diatonicStep: number;
  stepOffset: number;
  accidental: number;
  noteLetter: string;
  octave: number;
} {
  const pc = toPitchClass(midi);
  const octave = Math.floor(midi / 12) - 1;

  const PC_SPELLING: Record<number, { letterIndex: number; accidental: number; noteLetter: string }> = {
    0: { letterIndex: 0, accidental: 0, noteLetter: 'C' },
    1: { letterIndex: 0, accidental: 1, noteLetter: 'C#' },
    2: { letterIndex: 1, accidental: 0, noteLetter: 'D' },
    3: { letterIndex: 2, accidental: -1, noteLetter: 'Eb' },
    4: { letterIndex: 2, accidental: 0, noteLetter: 'E' },
    5: { letterIndex: 3, accidental: 0, noteLetter: 'F' },
    6: { letterIndex: 3, accidental: 1, noteLetter: 'F#' },
    7: { letterIndex: 4, accidental: 0, noteLetter: 'G' },
    8: { letterIndex: 4, accidental: 1, noteLetter: 'G#' },
    9: { letterIndex: 5, accidental: 0, noteLetter: 'A' },
    10: { letterIndex: 6, accidental: -1, noteLetter: 'Bb' },
    11: { letterIndex: 6, accidental: 0, noteLetter: 'B' },
  };

  const sp = PC_SPELLING[pc]!;
  const diatonicStep = octave * 7 + sp.letterIndex;
  // Bass bottom line G2 has diatonicStep = 2 * 7 + 4 = 18
  const stepOffset = diatonicStep - 18;

  return {
    diatonicStep,
    stepOffset,
    accidental: sp.accidental,
    noteLetter: sp.noteLetter,
    octave,
  };
}

export function midiToBassStaffY(midi: number): number {
  const { stepOffset } = midiToBassDiatonicStep(midi);
  // Bottom line G2 of bass staff sits at y = 148
  return 148 - stepOffset * 6;
}

export class ChordEngine {
  public readonly level: ChordLevelSpec;
  public notationSystem: ChordNotationSystem;
  public readonly rng: () => number;

  private phase: ChordEnginePhase = 'LEARN';
  private substate: ChordEngineSubstate = 'NORMAL';
  private countdownRemainingSec = 3.0;
  private recoveryRemainingMs = 0;
  private emptyZonePulseRemainingMs = 0;
  private actualBpm: number;
  private targetBpm: number;

  private learnStepIndex = 0;
  private readonly learnChords: readonly ChordDefinition[];
  private readonly learnTotalSteps: number;

  private speedStepIndex = 0;
  private readonly speedTotalSteps = 8;
  private holdCompletedCount = 0;
  private readonly holdTotalCount = 8;

  private activeChords: ActiveChordEvent[] = [];
  private activeHeldMidis: Set<number> = new Set();
  private chordIdCounter = 0;
  private failedChord: ActiveChordEvent | null = null;
  private currentTargetChord: ChordDefinition | null = null;

  constructor(
    level: ChordLevelSpec,
    notationSystem: ChordNotationSystem = 'international',
    randomFn: () => number = Math.random
  ) {
    this.level = level;
    this.notationSystem = notationSystem;
    this.rng = randomFn;

    this.targetBpm = level.targetBpm;
    this.actualBpm = Math.max(24, Math.round(level.targetBpm * 0.55));

    this.learnChords =
      level.newChords.length > 0 ? level.newChords : level.targetChords;
    this.learnTotalSteps = this.learnChords.length;

    if (this.learnTotalSteps > 0) {
      this.phase = 'LEARN';
      this.currentTargetChord = this.learnChords[0]!;
    } else {
      this.transitionToCountdown();
    }
  }

  public setNotationSystem(system: ChordNotationSystem): void {
    this.notationSystem = system;
  }

  public getSnapshot(): ChordEngineSnapshot {
    return {
      levelId: this.level.id,
      phase: this.phase,
      substate: this.substate,
      recoveryRemainingMs: this.recoveryRemainingMs,
      countdownRemainingSec: this.countdownRemainingSec,
      actualBpm: this.actualBpm,
      targetBpm: this.targetBpm,
      learnStepIndex: this.learnStepIndex,
      learnTotalSteps: this.learnTotalSteps,
      speedStepIndex: this.speedStepIndex,
      speedTotalSteps: this.speedTotalSteps,
      holdCompletedCount: this.holdCompletedCount,
      holdTotalCount: this.holdTotalCount,
      activeChords: [...this.activeChords],
      activeHeldMidis: Array.from(this.activeHeldMidis),
      settlingRemainingMs: 0,
      notationSystem: this.notationSystem,
      currentTargetChord: this.currentTargetChord,
      isSettling: false,
      emptyZonePulseRemainingMs: this.emptyZonePulseRemainingMs,
    };
  }

  public tick(deltaMs: number): void {
    if (deltaMs <= 0) return;

    this.emptyZonePulseRemainingMs = Math.max(0, this.emptyZonePulseRemainingMs - deltaMs);

    // Clean up finished 'hit' chords after 220ms
    for (const chord of this.activeChords) {
      if (chord.state === 'hit') {
        chord.stateTimeMs += deltaMs;
      }
    }
    this.activeChords = this.activeChords.filter(
      (c) => c.state !== 'hit' || c.stateTimeMs < 220
    );

    if (this.phase === 'LEARN') {
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
        this.recoveryRemainingMs = Math.max(0, this.recoveryRemainingMs - deltaMs);
        if (this.recoveryRemainingMs <= 0) {
          this.substate = 'NORMAL';
        }
        return;
      }

      if (this.substate === 'NORMAL') {
        // Scroll velocity in px/s
        const beatsPerChord = 2.0;
        const scrollVx = (CHORD_ENGINE_GEOMETRY.CHORD_SPACING_PX * (this.actualBpm / 60.0)) / beatsPerChord;
        const deltaX = scrollVx * deltaSec;

        for (const chord of this.activeChords) {
          if (chord.state === 'approaching') {
            chord.x -= deltaX;
          }
        }

        // Spawn new approaching chords to fill timeline
        let maxX = 0;
        for (const chord of this.activeChords) {
          if (chord.state === 'approaching' && chord.x > maxX) {
            maxX = chord.x;
          }
        }

        while (maxX < CHORD_ENGINE_GEOMETRY.CANVAS_WIDTH + CHORD_ENGINE_GEOMETRY.CHORD_SPACING_PX) {
          const spawnX =
            maxX === 0
              ? CHORD_ENGINE_GEOMETRY.FIRST_CHORD_COUNTDOWN_X
              : maxX + CHORD_ENGINE_GEOMETRY.CHORD_SPACING_PX;

          const lastChordId =
            this.activeChords.length > 0
              ? this.activeChords[this.activeChords.length - 1]!.chord.id
              : this.learnChords[0]!.id;

          const nextChordDef = getNextMarkovChord(lastChordId, this.level, this.rng);

          this.activeChords.push({
            id: `chord-${++this.chordIdCounter}`,
            chord: nextChordDef,
            durationBeats: 2,
            x: spawnX,
            state: 'approaching',
            stateTimeMs: 0,
            failedOnCurrentPrompt: false,
          });

          maxX = spawnX;
        }

        // Determine current target chord from frontmost approaching chord
        const frontmost = this.getFrontmostApproachingChord();
        this.currentTargetChord = frontmost ? frontmost.chord : null;

        // Check for late miss (chord crossed left edge of hit zone)
        if (frontmost && frontmost.x < CHORD_ENGINE_GEOMETRY.HIT_ZONE_LEFT_X) {
          this.triggerChordFailure(frontmost);
        }
      } else {
        // substate === 'WAITING_FOR_CORRECTION'
        // Frozen in hit zone
      }
    }
  }

  public handleNoteOn(midi: number): ChordNoteInputResult {
    this.activeHeldMidis.add(midi);
    return this.evaluateCurrentInput();
  }

  public handleNoteOff(midi: number): void {
    this.activeHeldMidis.delete(midi);
  }

  public handleClearNotes(): void {
    this.activeHeldMidis.clear();
  }

  public setHeldMidis(midis: Iterable<number>): ChordNoteInputResult {
    this.activeHeldMidis = new Set(midis);
    return this.evaluateCurrentInput();
  }

  private evaluateCurrentInput(): ChordNoteInputResult {
    if (this.phase === 'LEVEL_COMPLETE') {
      return { outcome: 'level_advance' };
    }

    if (this.phase === 'COUNTDOWN') {
      return { outcome: 'ignored' };
    }

    const target = this.currentTargetChord;
    if (!target) {
      return { outcome: 'ignored' };
    }

    const validation = validateChordMidis(this.activeHeldMidis, target);

    if (validation.valid) {
      // Immediate Hit!
      if (this.phase === 'LEARN') {
        this.learnStepIndex++;
        if (this.learnStepIndex >= this.learnTotalSteps) {
          this.transitionToCountdown();
        } else {
          this.currentTargetChord = this.learnChords[this.learnStepIndex]!;
        }
        return { outcome: 'correct_hit', targetChord: target };
      }

      if (this.substate === 'WAITING_FOR_CORRECTION') {
        if (this.failedChord) {
          this.failedChord.state = 'hit';
          this.failedChord.stateTimeMs = 0;
          this.failedChord = null;
        }
        this.substate = 'NORMAL';
        const frontmost = this.getFrontmostApproachingChord();
        this.currentTargetChord = frontmost ? frontmost.chord : null;
        return { outcome: 'correction_complete', targetChord: target };
      }

      // SPEED_UP or HOLD phase
      const frontmost = this.getFrontmostApproachingChord();
      const inWindow =
        frontmost !== null &&
        frontmost.x >= CHORD_ENGINE_GEOMETRY.HIT_ZONE_LEFT_X &&
        frontmost.x <= CHORD_ENGINE_GEOMETRY.HIT_ZONE_RIGHT_X + CHORD_ENGINE_GEOMETRY.EARLY_GRACE_PX;

      if (!inWindow) {
        this.emptyZonePulseRemainingMs = 150;
        return { outcome: 'empty_zone' };
      }

      frontmost.state = 'hit';
      frontmost.stateTimeMs = 0;

      if (this.phase === 'SPEED_UP') {
        this.speedStepIndex++;
        const fraction = Math.min(1, this.speedStepIndex / this.speedTotalSteps);
        const startBpm = Math.max(24, Math.round(this.targetBpm * 0.55));
        this.actualBpm = Math.round(startBpm + fraction * (this.targetBpm - startBpm));

        if (this.speedStepIndex >= this.speedTotalSteps || this.actualBpm >= this.targetBpm) {
          this.phase = 'HOLD';
          this.actualBpm = this.targetBpm;
        }
        return { outcome: 'correct_hit', targetChord: target };
      }

      if (this.phase === 'HOLD') {
        this.holdCompletedCount++;
        if (this.holdCompletedCount >= this.holdTotalCount) {
          this.phase = 'LEVEL_COMPLETE';
          return { outcome: 'level_advance', targetChord: target };
        }
        return { outcome: 'correct_hit', targetChord: target };
      }
    }

    // Validation failed:
    if (validation.reason === 'missing_notes') {
      // Rolling tolerance: notes are currently being accumulated
      return { outcome: 'building_chord', targetChord: target };
    }

    if (validation.reason === 'wrong_notes' || validation.reason === 'wrong_bass') {
      return { outcome: 'wrong_notes', targetChord: target };
    }

    return { outcome: 'ignored', targetChord: target };
  }

  private triggerChordFailure(chord: ActiveChordEvent): void {
    chord.state = 'failed';
    chord.failedOnCurrentPrompt = true;
    chord.x = CHORD_ENGINE_GEOMETRY.HIT_ZONE_CENTER_X;
    this.failedChord = chord;
    this.currentTargetChord = chord.chord;
    this.substate = 'WAITING_FOR_CORRECTION';
  }

  private transitionToCountdown(): void {
    this.phase = 'COUNTDOWN';
    this.countdownRemainingSec = 3.0;
    this.activeChords = [];

    // Pre-populate timeline with initial scrolling chords
    let x = CHORD_ENGINE_GEOMETRY.FIRST_CHORD_COUNTDOWN_X;
    let lastChordId = this.learnChords.length > 0 ? this.learnChords[0]!.id : this.level.targetChords[0]!.id;

    for (let i = 0; i < 4; i++) {
      const nextChord = getNextMarkovChord(lastChordId, this.level, this.rng);
      this.activeChords.push({
        id: `chord-${++this.chordIdCounter}`,
        chord: nextChord,
        durationBeats: 2,
        x,
        state: 'approaching',
        stateTimeMs: 0,
        failedOnCurrentPrompt: false,
      });
      lastChordId = nextChord.id;
      x += CHORD_ENGINE_GEOMETRY.CHORD_SPACING_PX;
    }

    this.currentTargetChord = this.activeChords[0] ? this.activeChords[0].chord : null;
  }

  private getFrontmostApproachingChord(): ActiveChordEvent | null {
    let frontmost: ActiveChordEvent | null = null;
    let minX = Infinity;

    for (const chord of this.activeChords) {
      if (chord.state === 'approaching' && chord.x < minX) {
        minX = chord.x;
        frontmost = chord;
      }
    }

    return frontmost;
  }
}
