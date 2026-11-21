import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChordNamingConfig,
  ChordNamingPrompt,
  evaluateChordNamingAnswer,
  generateChordNamingDrill,
} from '../../src/chord/naming';
import { ChordNamingArena } from '../../src/components/ChordNamingArena';
import { ChordNamingModal } from '../../src/components/ChordNamingModal';
import { useAppStore } from '../../src/store/useAppStore';

describe('Name the Chord Mode (Staff -> Textbox)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    useAppStore.setState({
      chordNotationSystem: 'international',
      bestChordNamingSecPerChord: null,
    });
  });

  describe('Lenient-but-honest chord answer parser', () => {
    const cFirstInvPrompt: ChordNamingPrompt = {
      index: 0,
      clef: 'treble',
      keySignature: 'C_MAJOR',
      chordId: 'C',
      quality: 'major',
      inversion: 1,
      inversionLabel: '1st inversion',
      bassSpelling: { letter: 'E', accidental: 0 },
      notes: [],
    };

    const g7Prompt: ChordNamingPrompt = {
      index: 1,
      clef: 'bass',
      keySignature: 'C_MAJOR',
      chordId: 'G7',
      quality: 'dominant7',
      inversion: 0,
      inversionLabel: 'Root position',
      bassSpelling: { letter: 'G', accidental: 0 },
      notes: [],
    };

    const bmPrompt: ChordNamingPrompt = {
      index: 2,
      clef: 'treble',
      keySignature: 'C_MAJOR',
      chordId: 'Bm',
      quality: 'minor',
      inversion: 0,
      inversionLabel: 'Root position',
      bassSpelling: { letter: 'B', accidental: 0 },
      notes: [],
    };

    const bbPrompt: ChordNamingPrompt = {
      index: 3,
      clef: 'bass',
      keySignature: 'C_MAJOR',
      chordId: 'Bb',
      quality: 'major',
      inversion: 0,
      inversionLabel: 'Root position',
      bassSpelling: { letter: 'B', accidental: -1 },
      notes: [],
    };

    const romanIVPrompt: ChordNamingPrompt = {
      index: 4,
      clef: 'treble',
      keySignature: 'G_MAJOR',
      chordId: 'C',
      quality: 'major',
      inversion: 2,
      inversionLabel: '2nd inversion',
      bassSpelling: { letter: 'G', accidental: 0 },
      romanNumeral: 'IV',
      notes: [],
    };

    it('accepts root chord name regardless of inversion and tolerates lowercase', () => {
      expect(evaluateChordNamingAnswer('C', cFirstInvPrompt, 'chord_name', 'international')).toBe(true);
      expect(evaluateChordNamingAnswer('c', cFirstInvPrompt, 'chord_name', 'international')).toBe(true);
      expect(evaluateChordNamingAnswer('C/E', cFirstInvPrompt, 'chord_name', 'international')).toBe(true);
      expect(evaluateChordNamingAnswer('c/e', cFirstInvPrompt, 'chord_name', 'international')).toBe(true);

      // Wrong explicit slash bass is rejected
      expect(evaluateChordNamingAnswer('C/G', cFirstInvPrompt, 'chord_name', 'international')).toBe(false);
      // Wrong quality is rejected
      expect(evaluateChordNamingAnswer('Cm', cFirstInvPrompt, 'chord_name', 'international')).toBe(false);
    });

    it('distinguishes 7th chords from plain triads', () => {
      expect(evaluateChordNamingAnswer('G7', g7Prompt, 'chord_name', 'international')).toBe(true);
      expect(evaluateChordNamingAnswer('g7', g7Prompt, 'chord_name', 'international')).toBe(true);
      expect(evaluateChordNamingAnswer('G', g7Prompt, 'chord_name', 'international')).toBe(false);
    });

    it('respects International (Bb/B) vs German (B/H) notation', () => {
      // International
      expect(evaluateChordNamingAnswer('Bm', bmPrompt, 'chord_name', 'international')).toBe(true);
      expect(evaluateChordNamingAnswer('bm', bmPrompt, 'chord_name', 'international')).toBe(true);
      expect(evaluateChordNamingAnswer('hm', bmPrompt, 'chord_name', 'international')).toBe(false);
      expect(evaluateChordNamingAnswer('bb', bbPrompt, 'chord_name', 'international')).toBe(true);

      // German
      expect(evaluateChordNamingAnswer('Hm', bmPrompt, 'chord_name', 'german')).toBe(true);
      expect(evaluateChordNamingAnswer('hm', bmPrompt, 'chord_name', 'german')).toBe(true);
      expect(evaluateChordNamingAnswer('bm', bmPrompt, 'chord_name', 'german')).toBe(false);
      expect(evaluateChordNamingAnswer('B', bbPrompt, 'chord_name', 'german')).toBe(true);
      expect(evaluateChordNamingAnswer('b', bbPrompt, 'chord_name', 'german')).toBe(true);
    });

    it('evaluates Roman numerals case-insensitively', () => {
      expect(evaluateChordNamingAnswer('IV', romanIVPrompt, 'roman_numeral')).toBe(true);
      expect(evaluateChordNamingAnswer('iv', romanIVPrompt, 'roman_numeral')).toBe(true);
      expect(evaluateChordNamingAnswer('V', romanIVPrompt, 'roman_numeral')).toBe(false);
      expect(evaluateChordNamingAnswer('C', romanIVPrompt, 'roman_numeral')).toBe(false);
    });
  });

  describe('Drill generator', () => {
    it('generates 50 prompts across both clefs and inversions in chord_name mode', () => {
      const config: ChordNamingConfig = {
        answerMode: 'chord_name',
        clefMode: 'both',
        poolId: 'core_triads',
        fixedKey: 'C_MAJOR',
        totalChords: 50,
      };
      const drill = generateChordNamingDrill(config);
      expect(drill.length).toBe(50);
      expect(drill.every((p) => p.notes.length >= 3)).toBe(true);
      expect(drill.some((p) => p.clef === 'treble')).toBe(true);
      expect(drill.some((p) => p.clef === 'bass')).toBe(true);
      expect(drill.some((p) => p.inversion > 0)).toBe(true);
    });

    it('generates diatonic Roman numeral prompts with the fixed key signature', () => {
      const config: ChordNamingConfig = {
        answerMode: 'roman_numeral',
        clefMode: 'treble',
        poolId: 'core_triads',
        fixedKey: 'G_MAJOR',
        totalChords: 25,
      };
      const drill = generateChordNamingDrill(config);
      expect(drill.length).toBe(25);
      expect(drill.every((p) => p.keySignature === 'G_MAJOR')).toBe(true);
      expect(drill.every((p) => p.clef === 'treble')).toBe(true);
      expect(drill.every((p) => typeof p.romanNumeral === 'string')).toBe(true);
    });
  });

  describe('UI Components (ChordNamingModal & ChordNamingArena)', () => {
    it('configures and starts a Roman Numeral drill via ChordNamingModal', () => {
      const onStart = vi.fn();
      const onClose = vi.fn();

      render(<ChordNamingModal isOpen={true} onClose={onClose} onStart={onStart} />);

      act(() => {
        fireEvent.click(screen.getByTestId('naming-mode-roman'));
      });
      act(() => {
        fireEvent.click(screen.getByTestId('naming-key-G_MAJOR'));
        fireEvent.click(screen.getByTestId('naming-length-25'));
      });
      act(() => {
        fireEvent.click(screen.getByTestId('start-chord-naming-btn'));
      });

      expect(onStart).toHaveBeenCalledWith({
        answerMode: 'roman_numeral',
        clefMode: 'both',
        poolId: 'core_triads',
        fixedKey: 'G_MAJOR',
        totalChords: 25,
      });
    });

    it('runs a complete drill in ChordNamingArena and shows seconds/chord summary', () => {
      const config: ChordNamingConfig = {
        answerMode: 'chord_name',
        clefMode: 'treble',
        poolId: 'core_triads',
        fixedKey: 'C_MAJOR',
        totalChords: 2,
      };

      const prompts = generateChordNamingDrill(config, () => 0.1);
      // Force deterministic chord IDs for test assertions
      const deterministicPrompts: ChordNamingPrompt[] = [
        { ...prompts[0]!, chordId: 'C', quality: 'major' },
        { ...prompts[1]!, chordId: 'Am', quality: 'minor' },
      ];

      render(
        <ChordNamingArena
          config={config}
          onExit={vi.fn()}
          onReconfigure={vi.fn()}
          initialPrompts={deterministicPrompts}
        />
      );

      expect(screen.getByTestId('chord-naming-counter').textContent).toBe('1 / 2');

      const input = screen.getByTestId('chord-naming-input') as HTMLInputElement;
      const submitBtn = screen.getByTestId('chord-naming-submit-btn');

      // Wrong answer first
      act(() => {
        fireEvent.change(input, { target: { value: 'F' } });
        fireEvent.click(submitBtn);
      });
      expect(screen.getByTestId('chord-naming-wrong-msg')).toBeDefined();

      // Correct answer (lowercase tolerated)
      act(() => {
        fireEvent.change(input, { target: { value: 'c' } });
        fireEvent.click(submitBtn);
      });
      expect(screen.getByTestId('chord-naming-counter').textContent).toBe('2 / 2');

      // Second chord correct on first try
      act(() => {
        fireEvent.change(input, { target: { value: 'am' } });
        fireEvent.click(submitBtn);
      });

      // Summary screen appears with s / chord result
      expect(screen.getByTestId('chord-naming-summary')).toBeDefined();
      expect(screen.getByTestId('chord-naming-speed-result').textContent).toContain('s / chord');
    });
  });
});
