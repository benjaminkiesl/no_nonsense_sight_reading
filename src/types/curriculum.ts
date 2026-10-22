import { KeySignatureId } from '../music/scales';
import { StaffNoteTarget } from './music';

export type ClefLane = 'treble' | 'both' | 'bass';

export interface LevelSpec {
  readonly id: string;           // "treble-1".."treble-12", "bass-1".."bass-12", "both-1".."both-12"
  readonly tier: number;         // 1..12
  readonly lane: ClefLane;
  readonly title: string;
  readonly keySignature: KeySignatureId;
  readonly allNotes: readonly StaffNoteTarget[];
  readonly newNotes: readonly StaffNoteTarget[];
  readonly reviewNotes: readonly StaffNoteTarget[]; // New notes from tier-1 and tier-2 in same lane
  readonly prerequisiteIds: readonly string[];     // Incoming directed edges
  readonly nextIds: readonly string[];             // Outgoing directed edges
  readonly displayInterval: {
    readonly treble?: readonly [StaffNoteTarget, StaffNoteTarget]; // [lowest, highest by diatonicStep]
    readonly bass?: readonly [StaffNoteTarget, StaffNoteTarget];   // [lowest, highest by diatonicStep]
  };
}
