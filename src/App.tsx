import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AccelerandoModal } from './components/AccelerandoModal';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { GrandStaffCanvas } from './components/GrandStaffCanvas';
import { Header } from './components/Header';
import { LevelGraph } from './components/LevelGraph';
import { ActiveKeyHighlight, PianoKeyboard } from './components/PianoKeyboard';
import { ProgressBar } from './components/ProgressBar';
import { getLevelById, getNextRecommendedLevel } from './curriculum/graph';
import { SightReadingEngine } from './engine/engine';
import { mapKeyboardEventToInput } from './input/keyboardMapper';
import { MidiManager } from './input/midiManager';
import { resolveVisualPianoMidi } from './input/inputRouter';
import { useAppStore } from './store/useAppStore';
import { EngineSnapshot } from './types/engine';
import { UserNoteInput } from './types/input';
import { StaffNoteTarget } from './types/music';

export default function App(): React.JSX.Element {
  const {
    currentLevelId,
    allFinishedLevelIds,
    midiDeviceName,
    bestAccelerandoBpm,
    selectLevel,
    markLevelCompleted,
    setMidiDeviceName,
    updateBestAccelerandoBpm,
  } = useAppStore();

  const currentLevel = getLevelById(currentLevelId);
  const engineRef = useRef<SightReadingEngine>(new SightReadingEngine(currentLevel));
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engineRef.current.getSnapshot());
  const [activeHighlights, setActiveHighlights] = useState<ActiveKeyHighlight[]>([]);
  const [isAccelerandoModalOpen, setIsAccelerandoModalOpen] = useState(false);
  const [isAccelerandoActive, setIsAccelerandoActive] = useState(false);

  // Re-create engine whenever selected level changes (unless in accelerando run)
  useEffect(() => {
    if (!isAccelerandoActive) {
      engineRef.current = new SightReadingEngine(currentLevel);
      setSnapshot(engineRef.current.getSnapshot());
    }
  }, [currentLevelId, isAccelerandoActive, currentLevel]);

  // Launch Accelerando Perpetuo mode
  const handleStartAccelerando = useCallback(
    (notes: readonly StaffNoteTarget[], startingBpm: number) => {
      setIsAccelerandoActive(true);
      setIsAccelerandoModalOpen(false);
      engineRef.current = new SightReadingEngine(currentLevel, Math.random, {
        mode: 'accelerando',
        accelerandoStartingBpm: startingBpm,
        customNotes: notes,
      });
      setSnapshot(engineRef.current.getSnapshot());
    },
    [currentLevel]
  );

  // Exit Accelerando Perpetuo back to standard level
  const handleExitAccelerando = useCallback(() => {
    setIsAccelerandoActive(false);
    engineRef.current = new SightReadingEngine(currentLevel);
    setSnapshot(engineRef.current.getSnapshot());
  }, [currentLevel]);

  // Handle level selection from Graph
  const handleSelectLevel = useCallback(
    (id: string) => {
      setIsAccelerandoActive(false);
      selectLevel(id);
    },
    [selectLevel]
  );

  // Handle note dispatch
  const handleNoteInput = useCallback(
    (input: UserNoteInput) => {
      const engine = engineRef.current;
      const result = engine.handleNoteInput(input);

      if (result.outcome === 'level_advance') {
        const nextId = getNextRecommendedLevel(currentLevelId, allFinishedLevelIds);
        markLevelCompleted(currentLevelId);
        selectLevel(nextId);
        return;
      }

      if (result.outcome === 'ignored') {
        return;
      }

      // Record best Accelerando BPM on hits
      if (engine.isAccelerando && (result.outcome === 'correct_hit' || result.outcome === 'correction_complete')) {
        updateBestAccelerandoBpm(engine.speedController.targetBpm);
      }

      const activeTarget = result.matchedTarget ?? null;
      const midi = resolveVisualPianoMidi(input, activeTarget);
      const status: 'correct' | 'wrong' | 'neutral' =
        result.outcome === 'wrong_hit'
          ? 'wrong'
          : result.outcome === 'correct_hit' || result.outcome === 'correction_complete'
          ? 'correct'
          : 'neutral';

      setActiveHighlights([{ midi, status }]);
      setTimeout(() => {
        setActiveHighlights([]);
      }, 180);
    },
    [currentLevelId, allFinishedLevelIds, markLevelCompleted, selectLevel, updateBestAccelerandoBpm]
  );

  // Manual advance on celebration continue
  const handleCelebrationContinue = useCallback(() => {
    const nextId = getNextRecommendedLevel(currentLevelId, allFinishedLevelIds);
    markLevelCompleted(currentLevelId);
    selectLevel(nextId);
  }, [currentLevelId, allFinishedLevelIds, markLevelCompleted, selectLevel]);

  // Continue to Accelerando Perpetuo from celebration overlay
  const handleCelebrationAccelerando = useCallback(() => {
    // Current level finished tempo is 52 BPM
    handleStartAccelerando(currentLevel.allNotes, 52);
  }, [currentLevel.allNotes, handleStartAccelerando]);

  // Main 60fps Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;

      engineRef.current.tick(deltaMs);
      setSnapshot(engineRef.current.getSnapshot());

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Web MIDI API Initialization
  useEffect(() => {
    const midi = new MidiManager({
      onNoteOn: (midi) => {
        handleNoteInput({ source: 'midi', midi });
      },
      onConnectionChange: (deviceName) => {
        setMidiDeviceName(deviceName);
      },
    });

    midi.init();
    return () => midi.dispose();
  }, [handleNoteInput, setMidiDeviceName]);

  // Computer Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAccelerandoModalOpen) return;

      if (engineRef.current.getSnapshot().phase === 'LEVEL_COMPLETE') {
        handleCelebrationContinue();
        return;
      }

      const mapped = mapKeyboardEventToInput(e);
      if (mapped) {
        if (e.altKey || e.metaKey) {
          e.preventDefault();
        }
        handleNoteInput(mapped);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNoteInput, handleCelebrationContinue, isAccelerandoModalOpen]);

  return (
    <div className="nnsr-app">
      <Header midiDeviceName={midiDeviceName} />

      <main className="nnsr-workspace">
        <section className="nnsr-main-column">
          {isAccelerandoActive && (
            <div className="nnsr-accelerando-banner">
              <div className="nnsr-accelerando-banner-left">
                <span className="nnsr-banner-bolt">⚡</span>
                <span className="nnsr-banner-title">Accelerando Perpetuo Mode</span>
                <span className="nnsr-banner-badge">Max 240 BPM</span>
              </div>
              <button
                type="button"
                className="nnsr-banner-exit-btn"
                onClick={handleExitAccelerando}
              >
                Exit to Curriculum Level
              </button>
            </div>
          )}

          <GrandStaffCanvas snapshot={snapshot} level={currentLevel} />
          <ProgressBar snapshot={snapshot} />
          <PianoKeyboard
            onKeyPress={(midi) => handleNoteInput({ source: 'piano_click', midi })}
            activeHighlights={activeHighlights}
          />
        </section>

        <aside className="nnsr-sidebar">
          <LevelGraph
            currentLevelId={currentLevelId}
            completedLevelIds={allFinishedLevelIds}
            onSelectLevel={handleSelectLevel}
            onOpenAccelerando={() => setIsAccelerandoModalOpen(true)}
          />
        </aside>
      </main>

      {snapshot.phase === 'LEVEL_COMPLETE' && (
        <CelebrationOverlay
          level={currentLevel}
          onContinue={handleCelebrationContinue}
          onAccelerandoContinue={handleCelebrationAccelerando}
        />
      )}

      <AccelerandoModal
        isOpen={isAccelerandoModalOpen}
        onClose={() => setIsAccelerandoModalOpen(false)}
        onStart={handleStartAccelerando}
        bestAccelerandoBpm={bestAccelerandoBpm}
        initialLevelNotes={currentLevel.allNotes}
      />
    </div>
  );
}
