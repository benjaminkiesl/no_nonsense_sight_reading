import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import {
  ALL_ROMAN_KEY_IDS,
  AdaptiveNamingScheduler,
  ChordNamingConfig,
  ChordNamingPrompt,
  INITIAL_ADAPTIVE_NAMING_STATE,
  ROMAN_SCALE_SPECS,
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
      chordNamingAdaptiveState: INITIAL_ADAPTIVE_NAMING_STATE,
    });
  });

  afterEach(() => {
    window.history.replaceState(null, '', '#');
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

    it('generates diatonic Roman numeral prompts across all 24 Major and Minor scales', () => {
      expect(ALL_ROMAN_KEY_IDS.length).toBe(24);
      for (const keyId of ALL_ROMAN_KEY_IDS) {
        const spec = ROMAN_SCALE_SPECS[keyId];
        const drill = generateChordNamingDrill({
          answerMode: 'roman_numeral',
          clefMode: 'treble',
          poolId: 'adaptive',
          fixedKey: keyId,
          totalChords: 10,
        });
        expect(drill.length).toBe(10);
        expect(drill.every((p) => p.keySignature === spec.keySignature)).toBe(true);
        expect(drill.every((p) => p.notes.length >= 3)).toBe(true);
      }

      // Minor scale uses harmonic minor V with leading-tone accidental (G# in A minor)
      const aMinorScheduler = new AdaptiveNamingScheduler(
        {
          answerMode: 'roman_numeral',
          clefMode: 'treble',
          poolId: 'adaptive',
          fixedKey: 'A_MINOR',
          totalChords: 50,
        },
        INITIAL_ADAPTIVE_NAMING_STATE
      );
      expect(aMinorScheduler.getActiveKeys()).toEqual(['i', 'iv', 'V']);
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
      });
      act(() => {
        fireEvent.click(screen.getByTestId('start-chord-naming-btn'));
      });

      expect(onStart).toHaveBeenCalledWith({
        answerMode: 'roman_numeral',
        clefMode: 'both',
        poolId: 'adaptive',
        fixedKey: 'G_MAJOR',
        totalChords: 50,
      });
    });

    it('runs continuous infinite flashcards in ChordNamingArena with live s/chord speed and Unlocked m/n', () => {
      const config: ChordNamingConfig = {
        answerMode: 'chord_name',
        clefMode: 'treble',
        poolId: 'core_triads',
        fixedKey: 'C_MAJOR',
        totalChords: 50,
      };

      const prompts = generateChordNamingDrill(config, () => 0.1);
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

      expect(screen.getByTestId('chord-naming-unlocked').textContent).toContain('Unlocked:');

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
      expect(screen.getByTestId('chord-naming-speed').textContent).toContain('s/chord');

      // Second chord correct -> continues seamlessly without stopping
      act(() => {
        fireEvent.change(input, { target: { value: 'am' } });
        fireEvent.click(submitBtn);
      });
      expect(screen.getByTestId('chord-naming-last-solved').textContent).toContain('Am');
    });

    it('supports full 96-chord pool (+ dim, sus2, sus4) and touch-friendly root + quality tap pad', () => {
      const config: ChordNamingConfig = {
        answerMode: 'chord_name',
        clefMode: 'treble',
        poolId: 'all_chords',
        fixedKey: 'C_MAJOR',
        totalChords: 50,
      };

      const fullPoolDrill = generateChordNamingDrill({ ...config, totalChords: 96 });
      expect(fullPoolDrill.length).toBe(96);

      const deterministicPrompts: ChordNamingPrompt[] = [
        { ...fullPoolDrill[0]!, chordId: 'F#m', quality: 'minor' },
        { ...fullPoolDrill[1]!, chordId: 'Csus4', quality: 'sus4' },
      ];

      render(
        <ChordNamingArena
          config={config}
          onExit={vi.fn()}
          onReconfigure={vi.fn()}
          initialPrompts={deterministicPrompts}
        />
      );

      // Tap F#/Gb root + m quality + Check
      act(() => {
        fireEvent.click(screen.getByTestId('root-btn-F#'));
        fireEvent.click(screen.getByTestId('quality-btn-minor'));
      });
      act(() => {
        fireEvent.click(screen.getByTestId('chord-naming-submit-btn'));
      });
      expect(screen.getByTestId('chord-naming-last-solved').textContent).toContain('F#m');

      // Tap C root + sus4 quality + Check
      act(() => {
        fireEvent.click(screen.getByTestId('root-btn-C'));
        fireEvent.click(screen.getByTestId('quality-btn-sus4'));
      });
      act(() => {
        fireEvent.click(screen.getByTestId('chord-naming-submit-btn'));
      });
      expect(screen.getByTestId('chord-naming-last-solved').textContent).toContain('Csus4');
    });

    it('supports 1-tap Roman numeral buttons for mobile/tablet', () => {
      const config: ChordNamingConfig = {
        answerMode: 'roman_numeral',
        clefMode: 'bass',
        poolId: 'core_triads',
        fixedKey: 'G_MAJOR',
        totalChords: 50,
      };

      const prompts = generateChordNamingDrill(config, () => 0.1);
      const deterministicPrompts: ChordNamingPrompt[] = [
        { ...prompts[0]!, chordId: 'C', quality: 'major', romanNumeral: 'IV' },
      ];

      render(
        <ChordNamingArena
          config={config}
          onExit={vi.fn()}
          onReconfigure={vi.fn()}
          initialPrompts={deterministicPrompts}
        />
      );

      // Single tap on IV solves immediately and keeps going
      act(() => {
        fireEvent.click(screen.getByTestId('roman-btn-IV'));
      });
      expect(screen.getByTestId('chord-naming-last-solved').textContent).toContain('IV');
    });
  });

  describe('AdaptiveNamingScheduler (Spaced Repetition + Gradual Unlock)', () => {
    it('starts with 3 highest-ROI chords (C, F, G), boosts missed chords, and unlocks Am once comfortable', () => {
      const config: ChordNamingConfig = {
        answerMode: 'chord_name',
        clefMode: 'both',
        poolId: 'adaptive',
        fixedKey: 'C_MAJOR',
        totalChords: 50,
      };
      const scheduler = new AdaptiveNamingScheduler(config, INITIAL_ADAPTIVE_NAMING_STATE);

      expect(scheduler.getUnlockedCount()).toBe(3);
      expect(scheduler.getActiveKeys()).toEqual(['C', 'F', 'G']);

      const makePrompt = (chordId: string): ChordNamingPrompt => ({
        index: 0,
        clef: 'treble',
        keySignature: 'C_MAJOR',
        chordId,
        quality: 'major',
        inversion: 0,
        inversionLabel: 'Root position',
        bassSpelling: { letter: 'C', accidental: 0 },
        notes: [],
      });

      // Miss on C boosts urgency significantly and keeps streak at 0
      scheduler.recordResult(makePrompt('C'), { firstTry: false, elapsedMs: 3000 });
      expect(scheduler.getStats('C').urgency).toBeGreaterThanOrEqual(6.0);
      expect(scheduler.getStats('C').streak).toBe(0);

      // Clean fast hits on C, F, G until all 3 are comfortable (streak >= 2, urgency <= 1.5)
      for (let i = 0; i < 4; i++) {
        scheduler.recordResult(makePrompt('C'), { firstTry: true, elapsedMs: 1500 });
      }
      scheduler.recordResult(makePrompt('F'), { firstTry: true, elapsedMs: 1500 });
      scheduler.recordResult(makePrompt('F'), { firstTry: true, elapsedMs: 1500 });
      scheduler.recordResult(makePrompt('G'), { firstTry: true, elapsedMs: 1500 });
      const res = scheduler.recordResult(makePrompt('G'), { firstTry: true, elapsedMs: 1500 });

      // Am (4th highest-ROI chord) unlocks automatically!
      expect(res.newlyUnlockedId).toBe('Am');
      expect(scheduler.getUnlockedCount()).toBe(4);
      expect(scheduler.getActiveKeys()).toEqual(['C', 'F', 'G', 'Am']);
      expect(scheduler.getStats('Am').urgency).toBe(5.0);
    });
  });

  describe('Bookmarkable Hash URL Routing', () => {
    it('launches Name the Chord directly when opening #name-the-chord', () => {
      window.history.replaceState(null, '', '#name-the-chord');
      render(<App />);
      expect(screen.getByTestId('chord-naming-arena')).toBeDefined();
      expect(screen.getByTestId('chord-tap-pad')).toBeDefined();
    });

    it('launches Roman Numerals in G Major directly when opening #roman/G_MAJOR', () => {
      window.history.replaceState(null, '', '#roman/G_MAJOR');
      render(<App />);
      expect(screen.getByTestId('chord-naming-arena')).toBeDefined();
      expect(screen.getByTestId('roman-tap-grid')).toBeDefined();
      expect(screen.getByTestId('roman-btn-I')).toBeDefined();
    });

    it('launches Roman Numerals in A Minor directly when opening #roman/A_MINOR with minor buttons', () => {
      window.history.replaceState(null, '', '#roman/A_MINOR');
      render(<App />);
      expect(screen.getByTestId('chord-naming-arena')).toBeDefined();
      expect(screen.getByTestId('roman-tap-grid')).toBeDefined();
      expect(screen.getByTestId('roman-btn-i')).toBeDefined();
      expect(screen.getByTestId('roman-btn-iv')).toBeDefined();
      expect(screen.getByTestId('roman-btn-V')).toBeDefined();
      expect(screen.getByTestId('roman-btn-VI')).toBeDefined();
    });
  });
});
