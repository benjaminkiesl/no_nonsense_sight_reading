import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playMutedFeltThud, playSanctuaryRestChime, playSanctuaryWakeChime } from './audio/recoveryAudio';
import { AccelerandoModal } from './components/AccelerandoModal';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { GrandStaffCanvas } from './components/GrandStaffCanvas';
import { Header } from './components/Header';
import { LevelGraph } from './components/LevelGraph';
import { ActiveKeyHighlight, PianoKeyboard } from './components/PianoKeyboard';
import { ProgressBar } from './components/ProgressBar';
import { getLevelById, getNextRecommendedLevel } from './curriculum/graph';
import { SightReadingEngine } from './engine/engine';
import { SpeedController } from './engine/speed';
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
    lastCustomAccelerandoNotes,
    selectLevel,
    markLevelCompleted,
    setMidiDeviceName,
    updateBestAccelerandoBpm,
    setLastCustomAccelerandoNotes,
  } = useAppStore();

  const [activeView, setActiveView] = useState<'practice' | 'levels'>('practice');
  const currentLevel = getLevelById(currentLevelId);
  const engineRef = useRef<SightReadingEngine>(new SightReadingEngine(currentLevel));
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engineRef.current.getSnapshot());
  const [activeHighlights, setActiveHighlights] = useState<ActiveKeyHighlight[]>([]);
  const [isAccelerandoModalOpen, setIsAccelerandoModalOpen] = useState(false);
  const [isAccelerandoActive, setIsAccelerandoActive] = useState(false);

  // Transition to Levels view and mark level completed upon LEVEL_COMPLETE phase
  useEffect(() => {
    if (snapshot.phase === 'LEVEL_COMPLETE') {
      markLevelCompleted(currentLevelId);
      setActiveView('levels');
    }
  }, [snapshot.phase, currentLevelId, markLevelCompleted]);

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
      setActiveView('practice');
      engineRef.current = new SightReadingEngine(currentLevel, Math.random, {
        mode: 'accelerando',
        accelerandoStartingBpm: startingBpm,
        customNotes: notes,
      });
      setSnapshot(engineRef.current.getSnapshot());
    },
    [currentLevel]
  );

  // Launch custom Infinite Speed-Up mode from modal
  const handleStartCustomAccelerando = useCallback(
    (notes: readonly StaffNoteTarget[], startingBpm: number) => {
      setLastCustomAccelerandoNotes([...notes]);
      handleStartAccelerando(notes, startingBpm);
    },
    [handleStartAccelerando, setLastCustomAccelerandoNotes]
  );

  // Handle level selection from Graph
  const handleSelectLevel = useCallback(
    (id: string) => {
      setIsAccelerandoActive(false);
      selectLevel(id);
      const level = getLevelById(id);
      engineRef.current = new SightReadingEngine(level);
      setSnapshot(engineRef.current.getSnapshot());
      setActiveView('practice');
    },
    [selectLevel]
  );

  // Manual advance on celebration continue
  const handleCelebrationContinue = useCallback(() => {
    const nextId = getNextRecommendedLevel(currentLevelId, allFinishedLevelIds);
    markLevelCompleted(currentLevelId);
    selectLevel(nextId);
    const nextLevel = getLevelById(nextId);
    engineRef.current = new SightReadingEngine(nextLevel);
    setSnapshot(engineRef.current.getSnapshot());
    setActiveView('practice');
  }, [currentLevelId, allFinishedLevelIds, markLevelCompleted, selectLevel]);

  // Continue to Accelerando Perpetuo from celebration overlay (at 90 BPM)
  const handleCelebrationAccelerando = useCallback(() => {
    handleStartAccelerando(currentLevel.allNotes, SpeedController.V_TARGET_MAX);
  }, [currentLevel.allNotes, handleStartAccelerando]);

  // Handle note dispatch
  const handleNoteInput = useCallback(
    (input: UserNoteInput) => {
      const engine = engineRef.current;
      const result = engine.handleNoteInput(input);

      if (result.outcome === 'level_advance') {
        handleCelebrationContinue();
        return;
      }

      if (result.outcome === 'ignored') {
        return;
      }

      if (result.outcome === 'recovery_muted') {
        playMutedFeltThud();
        return;
      }

      const nextSnapshot = engine.getSnapshot();
      if (result.outcome === 'correction_complete' && nextSnapshot.substate === 'RECOVERY_PAUSE') {
        playSanctuaryRestChime();
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
    [handleCelebrationContinue, updateBestAccelerandoBpm]
  );

  // Main 60fps Animation Loop - Pauses ticking when viewing map or when modal is open
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;

      if (activeView === 'practice' && !isAccelerandoModalOpen) {
        const prevRecoveryMs = engineRef.current.getSnapshot().recoveryRemainingMs;
        engineRef.current.tick(deltaMs);
        const nextSnap = engineRef.current.getSnapshot();
        const nextRecoveryMs = nextSnap.recoveryRemainingMs;

        if (prevRecoveryMs > 1000 && nextRecoveryMs <= 1000 && nextRecoveryMs > 0) {
          playSanctuaryWakeChime();
        }

        setSnapshot(nextSnap);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeView, isAccelerandoModalOpen]);

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

      if (activeView === 'levels') {
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
  }, [handleNoteInput, handleCelebrationContinue, isAccelerandoModalOpen, activeView]);

  return (
    <div className="nnsr-app">
      <Header
        midiDeviceName={midiDeviceName}
        activeView={activeView}
        onToggleView={() => setActiveView((v) => (v === 'practice' ? 'levels' : 'practice'))}
      />

      {activeView === 'practice' ? (
        <main className="nnsr-workspace nnsr-practice-workspace">
          <section className="nnsr-main-column">
            <GrandStaffCanvas snapshot={snapshot} level={currentLevel} />
            <ProgressBar snapshot={snapshot} />
            <PianoKeyboard
              onKeyPress={(midi) => handleNoteInput({ source: 'piano_click', midi })}
              activeHighlights={activeHighlights}
            />
          </section>
        </main>
      ) : (
        <main className="nnsr-workspace nnsr-level-map-container">
          <div className="nnsr-map-view">
            {snapshot.phase === 'LEVEL_COMPLETE' && (
              <CelebrationOverlay
                level={currentLevel}
                onContinue={handleCelebrationContinue}
                onAccelerandoContinue={handleCelebrationAccelerando}
              />
            )}
            <LevelGraph
              currentLevelId={currentLevelId}
              completedLevelIds={allFinishedLevelIds}
              onSelectLevel={handleSelectLevel}
              onOpenAccelerando={() => setIsAccelerandoModalOpen(true)}
              celebratingLevelId={snapshot.phase === 'LEVEL_COMPLETE' ? currentLevelId : null}
            />
          </div>
        </main>
      )}

      <AccelerandoModal
        isOpen={isAccelerandoModalOpen}
        onClose={() => setIsAccelerandoModalOpen(false)}
        onStart={handleStartCustomAccelerando}
        bestAccelerandoBpm={bestAccelerandoBpm}
        lastCustomNotes={lastCustomAccelerandoNotes}
      />
    </div>
  );
}
