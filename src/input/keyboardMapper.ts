import { LETTER_SEMITONE } from '../music/pitch';
import { PitchClassInput } from '../types/input';
import { Accidental, LetterName } from '../types/music';

const CODE_TO_LETTER: Record<string, LetterName> = {
  KeyC: 'C',
  KeyD: 'D',
  KeyE: 'E',
  KeyF: 'F',
  KeyG: 'G',
  KeyA: 'A',
  KeyB: 'B',
  KeyH: 'B',
};

const KEY_TO_LETTER: Record<string, LetterName> = {
  c: 'C',
  d: 'D',
  e: 'E',
  f: 'F',
  g: 'G',
  a: 'A',
  b: 'B',
  h: 'B',
};

/**
 * Maps computer keyboard events to PitchClassInput.
 * Keys: c->C, d->D, e->E, f->F, g->G, a->A, {b,h}->B.
 * Modifiers:
 *   Shift -> # (+1)
 *   Cmd (macOS metaKey) / Alt (Linux/Windows altKey) -> b (-1)
 */
export function mapKeyboardEventToInput(event: KeyboardEvent): PitchClassInput | null {
  if (event.repeat) {
    return null;
  }

  // Resolve base letter name
  const keyLower = event.key ? event.key.toLowerCase() : '';
  let letter: LetterName | undefined = KEY_TO_LETTER[keyLower];

  // Fallback to event.code when Alt or Cmd turns key into a special glyph (e.g. Option+D -> ∂)
  if (!letter && event.code) {
    letter = CODE_TO_LETTER[event.code];
  }

  if (!letter) {
    return null;
  }

  const isSharp = event.shiftKey;
  const isFlat = Boolean(event.metaKey || event.altKey);

  let accidental: Accidental = 0;
  if (isSharp && !isFlat) {
    accidental = 1;
  } else if (isFlat && !isSharp) {
    accidental = -1;
  }

  const semitone = LETTER_SEMITONE[letter];
  const pitchClass = ((semitone + accidental) % 12 + 12) % 12;

  return {
    source: 'computer_keyboard',
    letter,
    accidental,
    pitchClass,
  };
}
