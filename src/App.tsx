import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playMutedFeltThud, playSanctuaryRestChime, playSanctuaryWakeChime } from './audio/recoveryAudio';
import { AccelerandoModal } from './components/AccelerandoModal';
import { RhythmStreamModal } from './components/RhythmStreamModal';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { ChordArena } from './components/ChordArena';
import { GrandStaffCanvas } from './components/GrandStaffCanvas';
import { Header } from './components/Header';
import { LevelGraph } from './components/LevelGraph';
import { ActiveKeyHighlight, PianoKeyboard } from './components/PianoKeyboard';
import { ProgressBar } from './components/ProgressBar';
import { RhythmArena, RhythmStreamOptionsProp } from './components/RhythmArena';
import { getChordLevelById, isChordLevelId } from './chord/curriculum';
import { getLevelById, getNextRecommendedLevel } from './curriculum/graph';
import { getRhythmLevelById, isRhythmLevelId } from './rhythm/curriculum';
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
    chordNotationSystem,
    selectLevel,
    markLevelCompleted,
    setMidiDeviceName,
    updateBestAccelerandoBpm,
    setLastCustomAccelerandoNotes,
    setChordNotationSystem,
  } = useAppStore();

  const [isAccelerandoModalOpen, setIsAccelerandoModalOpen] = useState(false);
  const [isAccelerandoActive, setIsAccelerandoActive] = useState(false);
  const [isRhythmStreamModalOpen, setIsRhythmStreamModalOpen] = useState(false);
  const [isRhythmStreamActive, setIsRhythmStreamActive] = useState(false);
  const [rhythmStreamOptions, setRhythmStreamOptions] = useState<RhythmStreamOptionsProp | null>(null);
  const [isRhythmLevelCelebrating, setIsRhythmLevelCelebrating] = useState(false);
  const [isChordLevelCelebrating, setIsChordLevelCelebrating] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  const isChordMode = !isAccelerandoActive && isChordLevelId(currentLevelId);
  const isRhythmMode = (!isAccelerandoActive && isRhythmLevelId(currentLevelId)) || isRhythmStreamActive;
  const isPitchMode = !isChordMode && !isRhythmMode;
  const currentLevel = isPitchMode ? getLevelById(currentLevelId) : getLevelById('treble-1');

  const [activeView, setActiveView] = useState<'practice' | 'levels'>('practice');
  const engineRef = useRef<SightReadingEngine>(new SightReadingEngine(currentLevel));
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engineRef.current.getSnapshot());
  const [activeHighlights, setActiveHighlights] = useState<ActiveKeyHighlight[]>([]);

  // Transition to Levels view and mark level completed upon LEVEL_COMPLETE phase
  useEffect(() => {
    if (isPitchMode && snapshot.phase === 'LEVEL_COMPLETE') {
      markLevelCompleted(currentLevelId);
      setActiveView('levels');
    }
  }, [snapshot.phase, currentLevelId, markLevelCompleted, isPitchMode]);

  // Re-create engine whenever selected level changes (unless in accelerando run or in rhythm/chord mode)
  useEffect(() => {
    if (!isAccelerandoActive && isPitchMode) {
      engineRef.current = new SightReadingEngine(currentLevel);
      setSnapshot(engineRef.current.getSnapshot());
    }
  }, [currentLevelId, isAccelerandoActive, currentLevel, isPitchMode]);

  // Launch Accelerando Perpetuo mode
  const handleStartAccelerando = useCallback(
    (notes: readonly StaffNoteTarget[], startingBpm: number) => {
      setIsAccelerandoActive(true);
      setIsAccelerandoModalOpen(false);
      setIsManuallyPaused(false);
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
      setIsRhythmStreamActive(false);
      setRhythmStreamOptions(null);
      setIsRhythmLevelCelebrating(false);
      setIsChordLevelCelebrating(false);
      setIsManuallyPaused(false);
      selectLevel(id);
      if (!isRhythmLevelId(id) && !isChordLevelId(id)) {
        const level = getLevelById(id);
        engineRef.current = new SightReadingEngine(level);
        setSnapshot(engineRef.current.getSnapshot());
      }
      setActiveView('practice');
    },
    [selectLevel]
  );

  // Launch Infinite Rhythm Stream mode
  const handleStartRhythmStream = useCallback(
    (options: RhythmStreamOptionsProp) => {
      setRhythmStreamOptions(options);
      setIsRhythmStreamActive(true);
      setIsAccelerandoActive(false);
      setIsRhythmStreamModalOpen(false);
      setIsManuallyPaused(false);
      setActiveView('practice');
    },
    []
  );

  const handleExitRhythmStream = useCallback(() => {
    setIsRhythmStreamActive(false);
    setRhythmStreamOptions(null);
    setActiveView('levels');
  }, []);

  // Manual advance on celebration continue
  const handleCelebrationContinue = useCallback(() => {
    const nextId = getNextRecommendedLevel(currentLevelId, allFinishedLevelIds);
    markLevelCompleted(currentLevelId);
    setIsRhythmLevelCelebrating(false);
    setIsChordLevelCelebrating(false);
    selectLevel(nextId);
    if (!isRhythmLevelId(nextId) && !isChordLevelId(nextId)) {
      const nextLevel = getLevelById(nextId);
      engineRef.current = new SightReadingEngine(nextLevel);
      setSnapshot(engineRef.current.getSnapshot());
    }
    setActiveView('practice');
  }, [currentLevelId, allFinishedLevelIds, markLevelCompleted, selectLevel]);

  // Continue to Accelerando Perpetuo from celebration overlay (at 90 BPM)
  const handleCelebrationAccelerando = useCallback(() => {
    handleStartAccelerando(currentLevel.allNotes, SpeedController.V_TARGET_MAX);
  }, [currentLevel.allNotes, handleStartAccelerando]);

  // Handle note dispatch
  const handleNoteInput = useCallback(
    (input: UserNoteInput) => {
      if (isRhythmMode || isChordMode) return;

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
    [handleCelebrationContinue, updateBestAccelerandoBpm, isRhythmMode, isChordMode]
  );

  // Main 60fps Animation Loop - Pauses ticking when viewing map, when modal is open, or in rhythm/chord mode
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;

      if (activeView === 'practice' && !isAccelerandoModalOpen && isPitchMode && !isManuallyPaused) {
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
  }, [activeView, isAccelerandoModalOpen, isPitchMode, isManuallyPaused]);

  const chordMidiHandlersRef = useRef<{
    onNoteOn: (midi: number) => void;
    onNoteOff: (midi: number) => void;
  } | null>(null);

  // Web MIDI API Initialization
  useEffect(() => {
    const midi = new MidiManager({
      onNoteOn: (midi) => {
        if (isPitchMode) {
          handleNoteInput({ source: 'midi', midi });
        } else if (isChordMode) {
          chordMidiHandlersRef.current?.onNoteOn(midi);
        }
      },
      onNoteOff: (midi) => {
        if (isChordMode) {
          chordMidiHandlersRef.current?.onNoteOff(midi);
        }
      },
      onConnectionChange: (deviceName) => {
        setMidiDeviceName(deviceName);
      },
    });

    midi.init();
    return () => midi.dispose();
  }, [handleNoteInput, setMidiDeviceName, isPitchMode, isChordMode]);

  // Computer Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsManuallyPaused((prev) => !prev);
        return;
      }

      if (isManuallyPaused) {
        // Any key unpauses without registering as a note input
        e.preventDefault();
        setIsManuallyPaused(false);
        return;
      }

      if (
        (snapshot.phase === 'LEVEL_COMPLETE' && isPitchMode) ||
        isRhythmLevelCelebrating ||
        isChordLevelCelebrating
      ) {
        handleCelebrationContinue();
        return;
      }

      if (isRhythmMode || isChordMode || activeView === 'levels') {
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
  }, [
    handleNoteInput,
    handleCelebrationContinue,
    isAccelerandoModalOpen,
    activeView,
    isPitchMode,
    isRhythmMode,
    isChordMode,
    isManuallyPaused,
    isRhythmLevelCelebrating,
    isChordLevelCelebrating,
    snapshot.phase,
  ]);

  return (
    <div className="nnsr-app">
      <Header
        midiDeviceName={midiDeviceName}
        activeView={activeView}
        onToggleView={() => setActiveView((v) => (v === 'practice' ? 'levels' : 'practice'))}
        chordNotationSystem={chordNotationSystem}
        onToggleChordNotation={
          isChordMode
            ? () => setChordNotationSystem(chordNotationSystem === 'international' ? 'german' : 'international')
            : undefined
        }
      />

      {activeView === 'practice' ? (
        !isAccelerandoActive && isChordMode ? (
          <main className="nnsr-workspace nnsr-practice-workspace">
            <section className="nnsr-main-column" style={{ position: 'relative' }}>
              <ChordArena
                levelId={currentLevelId}
                isPaused={isManuallyPaused}
                onMidiRegister={(handlers) => {
                  chordMidiHandlersRef.current = handlers;
                }}
                onLevelComplete={() => {
                  markLevelCompleted(currentLevelId);
                  setIsChordLevelCelebrating(true);
                  setActiveView('levels');
                }}
              />
              {isManuallyPaused && (
                <div
                  data-testid="manual-pause-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '840px',
                    height: '280px',
                    backgroundColor: 'rgba(26, 32, 28, 0.75)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    borderRadius: '12px',
                    zIndex: 20,
                  }}
                >
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Paused</p>
                  <p style={{ fontSize: '14px', color: '#b0aba2', margin: 0 }}>
                    Press Esc or any key to resume
                  </p>
                </div>
              )}
            </section>
          </main>
        ) : !isAccelerandoActive && isRhythmMode ? (
          <main className="nnsr-workspace nnsr-practice-workspace">
            <section className="nnsr-main-column">
              <RhythmArena
                levelId={currentLevelId}
                streamOptions={isRhythmStreamActive ? rhythmStreamOptions : null}
                onExitStream={handleExitRhythmStream}
                onLevelComplete={() => {
                  markLevelCompleted(currentLevelId);
                  setIsRhythmLevelCelebrating(true);
                  setActiveView('levels');
                }}
              />
            </section>
          </main>
        ) : (
          <main className="nnsr-workspace nnsr-practice-workspace">
            <section className="nnsr-main-column" style={{ position: 'relative' }}>
              <GrandStaffCanvas snapshot={snapshot} level={currentLevel} />
              {isManuallyPaused && (
                <div
                  data-testid="manual-pause-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '840px',
                    height: '280px',
                    backgroundColor: 'rgba(26, 32, 28, 0.75)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    borderRadius: '12px',
                    zIndex: 20,
                  }}
                >
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Paused</p>
                  <p style={{ fontSize: '14px', color: '#b0aba2', margin: 0 }}>
                    Press Esc or any key to resume
                  </p>
                </div>
              )}
              <ProgressBar snapshot={snapshot} />
              <PianoKeyboard
                onKeyPress={(midi) => handleNoteInput({ source: 'piano_click', midi })}
                activeHighlights={activeHighlights}
              />
            </section>
          </main>
        )
      ) : (
        <main className="nnsr-workspace nnsr-level-map-container">
          <div className="nnsr-map-view">
            {snapshot.phase === 'LEVEL_COMPLETE' && isPitchMode && (
              <CelebrationOverlay
                level={currentLevel}
                onContinue={handleCelebrationContinue}
                onAccelerandoContinue={handleCelebrationAccelerando}
              />
            )}
            {isRhythmLevelCelebrating && isRhythmMode && (
              <CelebrationOverlay
                customTitle={`Rhythm — ${getRhythmLevelById(currentLevelId).title}`}
                customDescription="Outstanding rhythm sight-reading! You played all 10 two-bar phrases in steady proportion."
                onContinue={handleCelebrationContinue}
              />
            )}
            {isChordLevelCelebrating && isChordMode && (
              <CelebrationOverlay
                customTitle={`Chord Symbols — ${getChordLevelById(currentLevelId).title}`}
                customDescription={`Incredible work! You mastered the harmony and cadential flow of ${getChordLevelById(currentLevelId).title}.`}
                onContinue={handleCelebrationContinue}
              />
            )}
            <LevelGraph
              currentLevelId={currentLevelId}
              completedLevelIds={allFinishedLevelIds}
              onSelectLevel={handleSelectLevel}
              onOpenAccelerando={() => setIsAccelerandoModalOpen(true)}
              onOpenRhythmStream={() => setIsRhythmStreamModalOpen(true)}
              chordNotationSystem={chordNotationSystem}
              celebratingLevelId={
                (snapshot.phase === 'LEVEL_COMPLETE' && isPitchMode) ||
                (isRhythmLevelCelebrating && isRhythmMode) ||
                (isChordLevelCelebrating && isChordMode)
                  ? currentLevelId
                  : null
              }
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

      <RhythmStreamModal
        isOpen={isRhythmStreamModalOpen}
        onClose={() => setIsRhythmStreamModalOpen(false)}
        onStart={handleStartRhythmStream}
      />
    </div>
  );
}
