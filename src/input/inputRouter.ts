import { UserNoteInput } from '../types/input';
import { StaffNoteTarget } from '../types/music';

/**
 * Checks whether user input matches the expected staff note target.
 * MIDI and piano clicks require exact MIDI note (exact octave).
 * Computer keyboard input auto-adapts octave (matches pitch class modulo 12).
 */
export function matchesTarget(input: UserNoteInput, target: StaffNoteTarget): boolean {
  if (input.source === 'computer_keyboard') {
    const targetPitchClass = ((target.pitch.midi % 12) + 12) % 12;
    return input.pitchClass === targetPitchClass;
  }

  // ExactNoteInput (midi or piano_click)
  return input.midi === target.pitch.midi;
}

/**
 * Resolves the MIDI number to highlight on the visual piano for any user input.
 * For computer keyboard input, adapts to the octave of the reference target note
 * (or defaults to octave 4 if no target note is available).
 */
export function resolveVisualPianoMidi(
  input: UserNoteInput,
  currentReferenceTarget: StaffNoteTarget | null
): number {
  if (input.source === 'computer_keyboard') {
    const targetOctave = currentReferenceTarget ? currentReferenceTarget.pitch.octave : 4;
    let midi = (targetOctave + 1) * 12 + input.pitchClass;

    // Keep within visible 4-octave piano range (C2 = 36 to C6 = 84)
    while (midi < 36) {
      midi += 12;
    }
    while (midi > 84) {
      midi -= 12;
    }

    return midi;
  }

  return input.midi;
}
