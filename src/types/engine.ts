import { StaffNoteTarget } from './music';

export type EnginePhase = 'LEARN' | 'COUNTDOWN' | 'SPEED_UP' | 'HOLD' | 'LEVEL_COMPLETE';
export type EngineSubstate = 'NORMAL' | 'WAITING_FOR_CORRECTION';
export type ActiveNoteState = 'approaching' | 'hit' | 'failed';

export interface ActiveNote {
  readonly id: string;
  readonly target: StaffNoteTarget;
  x: number;
  state: ActiveNoteState;
  stateTimeMs: number;
  failedOnCurrentPrompt: boolean;
}

export interface EngineSnapshot {
  readonly levelId: string;
  readonly phase: EnginePhase;
  readonly substate: EngineSubstate;
  readonly countdownRemainingSec: number;
  readonly actualBpm: number;
  readonly targetBpm: number;
  readonly learnStepIndex: number;
  readonly learnTotalSteps: number;
  readonly speedStepIndex: number;      // 0..24 derived strictly from targetBpm
  readonly speedTotalSteps: number;     // 24
  readonly holdCompletedCount: number;  // 0..32
  readonly holdTotalCount: number;      // 32
  readonly activeNotes: readonly ActiveNote[];
  readonly emptyZonePulseRemainingMs: number;
  readonly levelCompleteGuardRemainingMs: number;
  readonly isAccelerando?: boolean;
  readonly accelerandoStartBpm?: number;
}
