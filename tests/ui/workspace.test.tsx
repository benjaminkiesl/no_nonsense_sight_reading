import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CelebrationOverlay } from '../../src/components/CelebrationOverlay';
import { GrandStaffCanvas } from '../../src/components/GrandStaffCanvas';
import { Header } from '../../src/components/Header';
import { PianoKeyboard } from '../../src/components/PianoKeyboard';
import { ProgressBar } from '../../src/components/ProgressBar';
import { getLevelById } from '../../src/curriculum/graph';
import { EngineSnapshot } from '../../src/types/engine';

describe('UI Workspace Components', () => {
  describe('Header', () => {
    it('renders title and disconnected MIDI state', () => {
      render(<Header midiDeviceName={null} />);
      expect(screen.getByText('No-Nonsense Sight-Reading')).toBeDefined();
      expect(screen.getByText(/No device connected/)).toBeDefined();
    });

    it('renders connected MIDI device name', () => {
      render(<Header midiDeviceName="Yamaha NU1XA" />);
      expect(screen.getByText(/Yamaha NU1XA/)).toBeDefined();
    });
  });

  describe('ProgressBar', () => {
    it('renders discrete step progress for learn, speed up, and hold', () => {
      const mockSnapshot: EngineSnapshot = {
        levelId: 'treble-1',
        phase: 'SPEED_UP',
        substate: 'NORMAL',
        recoveryRemainingMs: 0,
        countdownRemainingSec: 0,
        actualBpm: 60,
        targetBpm: 75,
        learnStepIndex: 10,
        learnTotalSteps: 15,
        speedStepIndex: 12,
        speedTotalSteps: 24,
        holdCompletedCount: 5,
        holdTotalCount: 32,
        activeNotes: [],
        emptyZonePulseRemainingMs: 0,
        levelCompleteGuardRemainingMs: 0,
      };

      const { container } = render(<ProgressBar snapshot={mockSnapshot} />);
      expect(screen.getByText('Learn')).toBeDefined();
      expect(screen.getByText('Speed Up')).toBeDefined();
      expect(screen.getByText('Hold')).toBeDefined();

      const filledSteps = container.querySelectorAll('.nnsr-progress-step.filled');
      // 10 learn + 12 speed + 5 hold = 27 filled steps
      expect(filledSteps.length).toBe(27);
    });
  });

  describe('PianoKeyboard', () => {
    it('renders white and black keys and dispatches click callbacks', () => {
      const onKeyPress = vi.fn();
      render(<PianoKeyboard onKeyPress={onKeyPress} activeHighlights={[]} />);

      // Find SVG rects
      const rects = document.querySelectorAll('rect');
      // 29 white keys + 20 black keys = 49 rects
      expect(rects.length).toBe(49);

      // Click Middle C (MIDI 60)
      const middleCRect = rects[14]; // C4 is the 15th white key (index 14)
      expect(middleCRect).toBeDefined();
      fireEvent.pointerDown(middleCRect!);

      expect(onKeyPress).toHaveBeenCalledWith(60);
    });

    it('highlights pressed keys with specified status', () => {
      render(
        <PianoKeyboard
          onKeyPress={vi.fn()}
          activeHighlights={[
            { midi: 60, status: 'correct' },
            { midi: 62, status: 'wrong' },
          ]}
        />
      );

      const rects = document.querySelectorAll('rect');
      const middleC = rects[14];
      expect(middleC?.getAttribute('fill')).toBe('var(--emerald)');

      const d4 = rects[15];
      expect(d4?.getAttribute('fill')).toBe('var(--vibrant-coral)');
    });
  });

  describe('CelebrationOverlay', () => {
    it('renders completion title and continues on click', () => {
      const level = getLevelById('treble-1');
      const onContinue = vi.fn();

      render(<CelebrationOverlay level={level} onContinue={onContinue} />);
      expect(screen.getByText('✦ LEVEL COMPLETE ✦')).toBeDefined();
      expect(screen.getByText(level.title)).toBeDefined();

      const button = screen.getByText('Next Level →');
      fireEvent.click(button);
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('GrandStaffCanvas', () => {
    it('mounts gracefully without canvas errors in jsdom', () => {
      const level = getLevelById('treble-1');
      const mockSnapshot: EngineSnapshot = {
        levelId: 'treble-1',
        phase: 'LEARN',
        substate: 'NORMAL',
        recoveryRemainingMs: 0,
        countdownRemainingSec: 0,
        actualBpm: 60,
        targetBpm: 60,
        learnStepIndex: 0,
        learnTotalSteps: 15,
        speedStepIndex: 0,
        speedTotalSteps: 24,
        holdCompletedCount: 0,
        holdTotalCount: 32,
        activeNotes: [],
        emptyZonePulseRemainingMs: 0,
        levelCompleteGuardRemainingMs: 0,
      };

      const { container } = render(<GrandStaffCanvas snapshot={mockSnapshot} level={level} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeDefined();
    });
  });
});
