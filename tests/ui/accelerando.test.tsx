import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccelerandoModal } from '../../src/components/AccelerandoModal';
import { CelebrationOverlay } from '../../src/components/CelebrationOverlay';
import { LevelGraph } from '../../src/components/LevelGraph';
import { ProgressBar } from '../../src/components/ProgressBar';
import { getLevelById } from '../../src/curriculum/graph';
import { useAppStore, STORAGE_KEY } from '../../src/store/useAppStore';
import { EngineSnapshot } from '../../src/types/engine';
import { createTarget } from '../../src/music/pitch';

describe('Infinite Speed-Up UI Components & Flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAppStore.setState({
      currentLevelId: 'treble-1',
      directlyCompletedLevelIds: [],
      allFinishedLevelIds: new Set(),
      midiDeviceName: null,
      bestAccelerandoBpm: null,
    });
  });

  describe('CelebrationOverlay Infinite Speed-Up Option', () => {
    it('renders "Infinite Speed-Up →" next to "Next Level →"', () => {
      const level = getLevelById('treble-1');
      const onContinue = vi.fn();
      const onAccelerando = vi.fn();

      render(
        <CelebrationOverlay
          level={level}
          onContinue={onContinue}
          onAccelerandoContinue={onAccelerando}
        />
      );

      const nextBtn = screen.getByText('Next Level →');
      expect(nextBtn).toBeDefined();

      const accelBtn = screen.getByText('Infinite Speed-Up →');
      expect(accelBtn).toBeDefined();

      fireEvent.click(accelBtn);
      expect(onAccelerando).toHaveBeenCalledTimes(1);
    });
  });

  describe('LevelGraph Summit & Octagon Nodes', () => {
    it('renders Trophy icon node at summit and connects both-12 to Trophy', () => {
      const { container } = render(
        <LevelGraph
          currentLevelId="both-12"
          completedLevelIds={new Set()}
          onSelectLevel={vi.fn()}
        />
      );

      // Trophy node exists at summit
      const trophyNode = screen.getByTestId('summit-trophy-node');
      expect(trophyNode).toBeDefined();
      expect(screen.getByText('SUMMIT')).toBeDefined();

      // Directed arrow connecting both-12 to Trophy
      const trophyArrow = container.querySelector('line[marker-end="url(#arrowhead)"]');
      expect(trophyArrow).toBeDefined();
    });

    it('highlights Trophy node when both-12 is completed', () => {
      const { rerender } = render(
        <LevelGraph
          currentLevelId="treble-1"
          completedLevelIds={new Set()}
          onSelectLevel={vi.fn()}
        />
      );

      const trophyNodeBefore = screen.getByTestId('summit-trophy-node');
      expect(trophyNodeBefore.classList.contains('completed')).toBe(false);

      rerender(
        <LevelGraph
          currentLevelId="treble-1"
          completedLevelIds={new Set(['both-12'])}
          onSelectLevel={vi.fn()}
        />
      );

      const trophyNodeAfter = screen.getByTestId('summit-trophy-node');
      expect(trophyNodeAfter.classList.contains('completed')).toBe(true);
    });

    it('renders Octagon node with speedometer and triggers callback on click', () => {
      const onOpen = vi.fn();
      render(
        <LevelGraph
          currentLevelId="treble-1"
          completedLevelIds={new Set()}
          onSelectLevel={vi.fn()}
          onOpenAccelerando={onOpen}
        />
      );

      const octagon = screen.getByTestId('accelerando-octagon-node');
      expect(octagon).toBeDefined();
      expect(screen.getByText('PERPETUO')).toBeDefined();

      fireEvent.click(octagon);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProgressBar in Infinite Speed-Up Mode', () => {
    it('displays tempo progression from starting tempo to 240 BPM', () => {
      const mockSnapshot: EngineSnapshot = {
        levelId: 'treble-1',
        phase: 'SPEED_UP',
        substate: 'NORMAL',
        countdownRemainingSec: 0,
        actualBpm: 60,
        targetBpm: 60,
        learnStepIndex: 0,
        learnTotalSteps: 0,
        speedStepIndex: 5,
        speedTotalSteps: 24,
        holdCompletedCount: 0,
        holdTotalCount: 32,
        activeNotes: [],
        emptyZonePulseRemainingMs: 0,
        levelCompleteGuardRemainingMs: 0,
        isAccelerando: true,
        accelerandoStartBpm: 40,
      };

      render(<ProgressBar snapshot={mockSnapshot} />);
      expect(screen.getByText('⚡ INFINITE SPEED-UP')).toBeDefined();
      expect(screen.getByText('40 BPM')).toBeDefined();
      expect(screen.getByText('240 BPM')).toBeDefined();
      expect(screen.getByText('60.0')).toBeDefined();
    });
  });

  describe('AccelerandoModal Setup', () => {
    it('defaults to 40 BPM when no best recorded, or 10% below best BPM when recorded', () => {
      const onStart = vi.fn();

      // Case 1: No previous best recorded -> 40 BPM
      const { unmount } = render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={onStart}
          bestAccelerandoBpm={null}
        />
      );

      const inputNoBest = screen.getByLabelText('Starting BPM Input') as HTMLInputElement;
      expect(Number(inputNoBest.value)).toBe(40);
      unmount();

      // Case 2: Best recorded 100 BPM -> 10% below = 90 BPM
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={onStart}
          bestAccelerandoBpm={100}
        />
      );

      const inputWithBest = screen.getByLabelText('Starting BPM Input') as HTMLInputElement;
      expect(Number(inputWithBest.value)).toBe(90);
    });

    it('toggles notes and highlights them on the grand staff and keyboard', () => {
      const onStart = vi.fn();
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={onStart}
          bestAccelerandoBpm={50}
          initialLevelNotes={[createTarget('treble', 'C4')]}
        />
      );

      // Initially 1 note selected
      expect(screen.getByText(/1 selected/)).toBeDefined();

      // Toggle Treble D4 on the staff
      const toggleD4 = screen.getByLabelText('Toggle treble:D4');
      fireEvent.click(toggleD4);

      expect(screen.getByText(/2 selected/)).toBeDefined();

      // Click Start button
      const startBtn = screen.getByRole('button', { name: 'Start' });
      fireEvent.click(startBtn);

      expect(onStart).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ targetId: 'treble:C4' }),
          expect.objectContaining({ targetId: 'treble:D4' }),
        ]),
        45 // 10% below 50 BPM = 45 BPM
      );
    });

    it('populates scale notes when selecting a scale from the scale picker', () => {
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={vi.fn()}
          bestAccelerandoBpm={null}
        />
      );

      const scaleSelect = screen.getByLabelText('Scale Selector') as HTMLSelectElement;
      expect(scaleSelect.value).toBe('C_MAJOR');

      // Change scale to G Major (1♯)
      fireEvent.change(scaleSelect, { target: { value: 'G_MAJOR' } });
      expect(scaleSelect.value).toBe('G_MAJOR');

      // G Major includes F#4
      const toggleFSharp = screen.getByLabelText('Toggle treble:F#4');
      expect(toggleFSharp).toBeDefined();
    });

    it('synchronizes staff note view and piano keyboard when toggling overlap or chromatic keys', () => {
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={vi.fn()}
          bestAccelerandoBpm={null}
        />
      );

      // Initially C Major has all 34 staff slots selected (17 treble + 17 bass)
      expect(screen.getByText(/34 selected/)).toBeDefined();

      // Click Middle C (MIDI 60, 15th white key -> index 14 in piano keyboard rects)
      const pianoContainer = document.querySelector('.nnsr-piano-container')!;
      const pianoRects = pianoContainer.querySelectorAll('rect');
      const middleCRect = pianoRects[14]!;

      // Unselect Middle C via piano key -> removes both treble:C4 and bass:C4 (32 selected)
      fireEvent.pointerDown(middleCRect);
      expect(screen.getByText(/32 selected/)).toBeDefined();

      // Re-select Middle C via piano key -> selects both treble:C4 and bass:C4 (34 selected)
      fireEvent.pointerDown(middleCRect);
      expect(screen.getByText(/34 selected/)).toBeDefined();
    });
  });

  describe('AppStore Best Accelerando BPM Persistence', () => {
    it('records and persists new best BPM to localStorage', () => {
      useAppStore.getState().updateBestAccelerandoBpm(72.4);
      expect(useAppStore.getState().bestAccelerandoBpm).toBe(72.4);

      // Verify localStorage
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
      expect(saved.bestAccelerandoBpm).toBe(72.4);

      // A lower BPM does not overwrite
      useAppStore.getState().updateBestAccelerandoBpm(65.0);
      expect(useAppStore.getState().bestAccelerandoBpm).toBe(72.4);

      // A higher BPM updates
      useAppStore.getState().updateBestAccelerandoBpm(85.8);
      expect(useAppStore.getState().bestAccelerandoBpm).toBe(85.8);
    });
  });
});
