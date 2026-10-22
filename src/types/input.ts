import { Accidental, LetterName } from './music';

export type InputSource = 'midi' | 'piano_click' | 'computer_keyboard';

export interface ExactNoteInput {
  readonly source: 'midi' | 'piano_click';
  /** Exact MIDI note number (e.g., 60 for C4) */
  readonly midi: number;
}

export interface PitchClassInput {
  readonly source: 'computer_keyboard';
  readonly letter: LetterName;
  readonly accidental: Accidental;
  /** Semitone class 0..11: (LETTER_SEMITONE[letter] + accidental + 12) % 12 */
  readonly pitchClass: number;
}

export type UserNoteInput = ExactNoteInput | PitchClassInput;
