export type LetterName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/**
 * -1 = Flat (b), 0 = Natural, +1 = Sharp (#)
 */
export type Accidental = -1 | 0 | 1;

export type Clef = 'treble' | 'bass';

export type Octave = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Canonical spelled pitch.
 * Preserves enharmonic spelling (e.g. F#4 vs Gb4 have the same midiNumber 66,
 * but sit on different staff steps and require different keyboard shortcuts).
 */
export interface SpelledPitch {
  readonly letter: LetterName;
  readonly accidental: Accidental;
  readonly octave: Octave;
  /** Standard MIDI note number: C4 (Middle C) = 60, A4 = 69 */
  readonly midi: number;
  /** Canonical ID string, e.g., "C4", "F#4", "Bb3" */
  readonly id: string;
  /**
   * Diatonic step relative to C0 (C0 = 0, D0 = 1, ..., C4 = 28, D4 = 29, etc.)
   * Used for staff vertical position and ledger line calculation:
   * diatonicStep = octave * 7 + LETTER_INDEX[letter]
   */
  readonly diatonicStep: number;
}

/**
 * A NoteTarget on a specific clef.
 * Note that the same pitch (e.g. C4, midi 60) can be written on the treble clef
 * or on the bass clef. They are distinct sight-reading targets!
 */
export interface StaffNoteTarget {
  /** Unique target key: `${clef}:${pitch.id}`, e.g. "treble:C4" or "bass:C4" */
  readonly targetId: string;
  readonly clef: Clef;
  readonly pitch: SpelledPitch;
}

/**
 * Container: A MusicalEvent can hold 1 note (Single Note),
 * 2 notes (Interval), or 3+ notes (Chord/Two-hand voicing).
 * In v1, `notes` always has length 1.
 */
export interface MusicalEvent {
  readonly eventId: string;
  readonly notes: readonly StaffNoteTarget[];
  /** Quarter note = 1.0, Half = 2.0, Eighth = 0.5. Always 1.0 in v1. */
  readonly durationBeats: number;
}
