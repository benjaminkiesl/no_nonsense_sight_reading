import { describe, it, expect } from 'vitest';
import { mapKeyboardEventToInput } from '../../src/input/keyboardMapper';

describe('keyboardMapper', () => {
  it('maps standard letter keys c..g, a, b, h to pitch classes', () => {
    const testCases: Array<{ key: string; letter: string; pitchClass: number }> = [
      { key: 'c', letter: 'C', pitchClass: 0 },
      { key: 'd', letter: 'D', pitchClass: 2 },
      { key: 'e', letter: 'E', pitchClass: 4 },
      { key: 'f', letter: 'F', pitchClass: 5 },
      { key: 'g', letter: 'G', pitchClass: 7 },
      { key: 'a', letter: 'A', pitchClass: 9 },
      { key: 'b', letter: 'B', pitchClass: 11 },
      { key: 'h', letter: 'B', pitchClass: 11 }, // German H = B
    ];

    for (const tc of testCases) {
      const event = new KeyboardEvent('keydown', { key: tc.key });
      const input = mapKeyboardEventToInput(event);
      expect(input).not.toBeNull();
      expect(input?.letter).toBe(tc.letter);
      expect(input?.accidental).toBe(0);
      expect(input?.pitchClass).toBe(tc.pitchClass);
    }
  });

  it('handles Shift modifier for sharps (+1)', () => {
    // Shift + f -> F# (semitone 5 + 1 = 6)
    const event = new KeyboardEvent('keydown', { key: 'F', shiftKey: true });
    const input = mapKeyboardEventToInput(event);
    expect(input).not.toBeNull();
    expect(input?.letter).toBe('F');
    expect(input?.accidental).toBe(1);
    expect(input?.pitchClass).toBe(6);
  });

  it('handles Meta (Cmd) or Alt modifier for flats (-1)', () => {
    // Cmd + d -> Db (semitone 2 - 1 = 1)
    const macCmdEvent = new KeyboardEvent('keydown', { key: 'd', metaKey: true });
    const inputCmd = mapKeyboardEventToInput(macCmdEvent);
    expect(inputCmd).not.toBeNull();
    expect(inputCmd?.letter).toBe('D');
    expect(inputCmd?.accidental).toBe(-1);
    expect(inputCmd?.pitchClass).toBe(1);

    // Alt + e -> Eb (semitone 4 - 1 = 3)
    const winAltEvent = new KeyboardEvent('keydown', { key: 'e', altKey: true });
    const inputAlt = mapKeyboardEventToInput(winAltEvent);
    expect(inputAlt).not.toBeNull();
    expect(inputAlt?.letter).toBe('E');
    expect(inputAlt?.accidental).toBe(-1);
    expect(inputAlt?.pitchClass).toBe(3);
  });

  it('falls back to event.code if Alt or Meta changes key to special symbol', () => {
    // On macOS, Option+D produces '∂', Option+E produces '´'
    const event = new KeyboardEvent('keydown', { key: '∂', code: 'KeyD', altKey: true });
    const input = mapKeyboardEventToInput(event);
    expect(input).not.toBeNull();
    expect(input?.letter).toBe('D');
    expect(input?.accidental).toBe(-1);
    expect(input?.pitchClass).toBe(1);
  });

  it('ignores repeat key events', () => {
    const event = new KeyboardEvent('keydown', { key: 'c', repeat: true });
    expect(mapKeyboardEventToInput(event)).toBeNull();
  });

  it('returns null for non-note keys', () => {
    expect(mapKeyboardEventToInput(new KeyboardEvent('keydown', { key: 'x' }))).toBeNull();
    expect(mapKeyboardEventToInput(new KeyboardEvent('keydown', { key: '1' }))).toBeNull();
    expect(mapKeyboardEventToInput(new KeyboardEvent('keydown', { key: 'Enter' }))).toBeNull();
  });
});
