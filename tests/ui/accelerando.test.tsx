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
      lastCustomAccelerandoNotes: null,
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
    it('renders Trophy icon node at summit and connects both wings to Trophy', () => {
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
      expect(screen.queryByText('SUMMIT')).toBeNull();

      // Directed arrow connecting wings to Trophy
      const trophyArrow = container.querySelector('line[marker-end="url(#arrowhead)"]');
      expect(trophyArrow).toBeDefined();
    });

    it('highlights Trophy node when both-12 and both-11 are completed', () => {
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
          completedLevelIds={new Set(['both-12', 'both-11'])}
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
      expect(screen.queryByText('PERPETUO')).toBeNull();

      fireEvent.click(octagon);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('ProgressBar in Infinite Speed-Up Mode', () => {
    it('displays only the current tempo in BPM with discrete steps', () => {
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
        accelerandoStartBpm: 20,
      };

      render(<ProgressBar snapshot={mockSnapshot} />);
      expect(screen.getByText('60.0 BPM')).toBeDefined();
      expect(screen.queryByText('⚡ INFINITE SPEED-UP')).toBeNull();
      expect(screen.queryByText('240 BPM')).toBeNull();
    });
  });

  describe('AccelerandoModal Setup', () => {
    it('defaults to 20 BPM when no best recorded, or 10% below best BPM when recorded', () => {
      const onStart = vi.fn();

      // Case 1: No previous best recorded -> 20 BPM
      const { unmount } = render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={onStart}
          bestAccelerandoBpm={null}
        />
      );

      const inputNoBest = screen.getByLabelText('Starting BPM Input') as HTMLInputElement;
      expect(Number(inputNoBest.value)).toBe(20);
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

    it('supports mouse drag to select and deselect notes on the grand staff', () => {
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={vi.fn()}
          bestAccelerandoBpm={null}
          initialLevelNotes={[createTarget('treble', 'C4')]}
        />
      );

      // Initially 1 note selected (C4)
      expect(screen.getByText(/1 selected/)).toBeDefined();

      const d4Note = screen.getByLabelText('Toggle treble:D4');
      const e4Note = screen.getByLabelText('Toggle treble:E4');

      // 1. Drag to SELECT: PointerDown on D4 (unselected -> select mode)
      fireEvent.pointerDown(d4Note);
      expect(screen.getByText(/2 selected/)).toBeDefined();

      // Drag over E4 while mouse is held
      fireEvent.pointerEnter(e4Note);
      expect(screen.getByText(/3 selected/)).toBeDefined();

      // PointerUp ends drag
      fireEvent.pointerUp(window);

      // Hovering without pointerdown does not change selection
      const f4Note = screen.getByLabelText('Toggle treble:F4');
      fireEvent.pointerEnter(f4Note);
      expect(screen.getByText(/3 selected/)).toBeDefined();

      // 2. Drag to DESELECT: PointerDown on E4 (selected -> deselect mode)
      fireEvent.pointerDown(e4Note);
      expect(screen.getByText(/2 selected/)).toBeDefined();

      // Drag back over D4
      fireEvent.pointerEnter(d4Note);
      expect(screen.getByText(/1 selected/)).toBeDefined();

      fireEvent.pointerUp(window);
    });

    it('supports swish to toggle by holding mouse down outside notes and entering/re-entering', () => {
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={vi.fn()}
          bestAccelerandoBpm={null}
          initialLevelNotes={[createTarget('treble', 'C4')]}
        />
      );

      // Initially 1 selected
      expect(screen.getByText(/1 selected/)).toBeDefined();

      const staffContainer = document.querySelector('.nnsr-modal-staff-container')!;
      const d4Note = screen.getByLabelText('Toggle treble:D4');

      // 1. Press mouse down OUTSIDE any note in the staff container
      fireEvent.pointerDown(staffContainer);

      // 2. Swish over D4 while mouse is held down -> selects D4
      fireEvent.pointerEnter(d4Note);
      expect(screen.getByText(/2 selected/)).toBeDefined();

      // 3. Move off D4
      fireEvent.pointerLeave(d4Note);
      expect(screen.getByText(/2 selected/)).toBeDefined();

      // 4. Move back over D4 while still holding mouse -> deselects D4
      fireEvent.pointerEnter(d4Note);
      expect(screen.getByText(/1 selected/)).toBeDefined();

      // 5. Release mouse
      fireEvent.pointerUp(window);

      // 6. Moving over D4 when mouse is released does not toggle
      fireEvent.pointerEnter(d4Note);
      expect(screen.getByText(/1 selected/)).toBeDefined();
    });

    it('supports swish to toggle piano keys by holding mouse down outside keys and entering/re-entering', () => {
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={vi.fn()}
          bestAccelerandoBpm={null}
          initialLevelNotes={[createTarget('treble', 'D4')]}
        />
      );

      // Initially 1 selected (D4)
      expect(screen.getByText(/1 selected/)).toBeDefined();

      const pianoContainer = document.querySelector('.nnsr-piano-container')!;
      const pianoRects = pianoContainer.querySelectorAll('rect');
      const middleCRect = pianoRects[14]!; // C4 (MIDI 60)

      // 1. Press mouse down on piano container outside keys
      fireEvent.pointerDown(pianoContainer);

      // 2. Swish over Middle C -> toggles Middle C to selected (adds treble:C4 and bass:C4)
      fireEvent.pointerEnter(middleCRect);
      expect(screen.getByText(/3 selected/)).toBeDefined();

      // 3. Move off Middle C
      fireEvent.pointerLeave(middleCRect);
      expect(screen.getByText(/3 selected/)).toBeDefined();

      // 4. Swish back over Middle C while still holding mouse -> deselects Middle C
      fireEvent.pointerEnter(middleCRect);
      expect(screen.getByText(/1 selected/)).toBeDefined();

      // 5. Release mouse
      fireEvent.pointerUp(window);

      // 6. Entering Middle C without mouse held does nothing
      fireEvent.pointerEnter(middleCRect);
      expect(screen.getByText(/1 selected/)).toBeDefined();
    });

    it('renders note stems with standard music engraving length (35px) connecting flush to rotated notehead', () => {
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={vi.fn()}
          bestAccelerandoBpm={null}
          initialLevelNotes={[createTarget('treble', 'C4'), createTarget('treble', 'C5')]}
        />
      );

      // Check up-stem on C4: bottom line E4 is 95, C4 is stepOffset -2 -> ny = 105.
      // Up-stem reaches ny - 35 = 70, starting at ny - 1 = 104.
      const c4Group = screen.getByLabelText('Toggle treble:C4');
      const c4Lines = c4Group.querySelectorAll('line');
      const c4StemLine = c4Lines[c4Lines.length - 1]!;
      expect(c4StemLine).toBeDefined();
      expect(Number(c4StemLine.getAttribute('y2'))).toBe(105 - 35); // 70
      expect(Number(c4StemLine.getAttribute('y1'))).toBe(105 - 1); // 104
      expect(Number(c4StemLine.getAttribute('x1'))).toBeCloseTo(164 + 4.8, 1);
      expect(Number(c4StemLine.getAttribute('x2'))).toBeCloseTo(164 + 4.8, 1);

      // Check down-stem on C5: stepOffset is 5 -> ny = 95 - 25 = 70.
      // Down-stem reaches ny + 35 = 105, starting at ny + 1 = 71.
      const c5Group = screen.getByLabelText('Toggle treble:C5');
      const c5Lines = c5Group.querySelectorAll('line');
      const c5StemLine = c5Lines[c5Lines.length - 1]!;
      expect(c5StemLine).toBeDefined();
      expect(Number(c5StemLine.getAttribute('y2'))).toBe(70 + 35); // 105
      expect(Number(c5StemLine.getAttribute('y1'))).toBe(70 + 1); // 71
      expect(Number(c5StemLine.getAttribute('x1'))).toBeCloseTo(430 - 4.8, 1);
      expect(Number(c5StemLine.getAttribute('x2'))).toBeCloseTo(430 - 4.8, 1);
    });

    it('renders entire selected note in green with no black borders and slider down to 15 BPM', () => {
      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={vi.fn()}
          bestAccelerandoBpm={null}
          initialLevelNotes={[createTarget('treble', 'C4')]}
        />
      );

      const slider = screen.getByLabelText('Starting BPM Slider') as HTMLInputElement;
      expect(slider.min).toBe('15');
      expect(slider.max).toBe('240');

      // Check selected note (C4)
      const c4Group = screen.getByLabelText('Toggle treble:C4');
      const ellipse = c4Group.querySelector('ellipse')!;
      expect(ellipse.getAttribute('fill')).toBe('var(--emerald)');
      expect(ellipse.getAttribute('stroke')).toBe('var(--emerald)');

      const lines = c4Group.querySelectorAll('line');
      for (const line of lines) {
        expect(line.getAttribute('stroke')).toBe('var(--emerald)');
      }

      const text = c4Group.querySelector('text')!;
      expect(text.getAttribute('fill')).toBe('var(--emerald)');
    });

    it('initializes from lastCustomAccelerandoNotes when present in store', () => {
      const customNotes = [createTarget('treble', 'E4'), createTarget('treble', 'G4')];
      useAppStore.getState().setLastCustomAccelerandoNotes(customNotes);

      render(
        <AccelerandoModal
          isOpen={true}
          onClose={vi.fn()}
          onStart={vi.fn()}
          bestAccelerandoBpm={null}
        />
      );

      expect(screen.getByText(/2 selected/)).toBeDefined();
      expect(screen.getByLabelText('Toggle treble:E4')).toBeDefined();
      expect(screen.getByLabelText('Toggle treble:G4')).toBeDefined();
    });
  });

  describe('AppStore Best Accelerando BPM and Custom Notes Persistence', () => {
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

    it('persists lastCustomAccelerandoNotes to localStorage and restores them', () => {
      const testNotes = [createTarget('treble', 'C4'), createTarget('bass', 'C3')];
      useAppStore.getState().setLastCustomAccelerandoNotes(testNotes);

      expect(useAppStore.getState().lastCustomAccelerandoNotes).toHaveLength(2);
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
      expect(saved.lastCustomAccelerandoNotes).toHaveLength(2);
      expect(saved.lastCustomAccelerandoNotes[0].targetId).toBe('treble:C4');
      expect(saved.lastCustomAccelerandoNotes[1].targetId).toBe('bass:C3');
    });
  });
});
