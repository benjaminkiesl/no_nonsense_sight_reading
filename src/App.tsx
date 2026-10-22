import React, { useEffect, useRef, useState, useCallback } from 'react';
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

export default function App(): React.JSX.Element {
  const {
    currentLevelId,
    allFinishedLevelIds,
    midiDeviceName,
    selectLevel,
    markLevelCompleted,
    setMidiDeviceName,
  } = useAppStore();

  const currentLevel = getLevelById(currentLevelId);
  const engineRef = useRef<SightReadingEngine>(new SightReadingEngine(currentLevel));
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engineRef.current.getSnapshot());
  const [activeHighlights, setActiveHighlights] = useState<ActiveKeyHighlight[]>([]);

  // Re-create engine whenever selected level changes
  useEffect(() => {
    engineRef.current = new SightReadingEngine(currentLevel);
    setSnapshot(engineRef.current.getSnapshot());
  }, [currentLevelId]);

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
    [currentLevelId, allFinishedLevelIds, markLevelCompleted, selectLevel]
  );

  // Manual advance on celebration continue
  const handleCelebrationContinue = useCallback(() => {
    const nextId = getNextRecommendedLevel(currentLevelId, allFinishedLevelIds);
    markLevelCompleted(currentLevelId);
    selectLevel(nextId);
  }, [currentLevelId, allFinishedLevelIds, markLevelCompleted, selectLevel]);

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
  }, [handleNoteInput, handleCelebrationContinue]);

  return (
    <div className="nnsr-app">
      <Header midiDeviceName={midiDeviceName} />

      <main className="nnsr-workspace">
        <section className="nnsr-main-column">
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
            onSelectLevel={(id) => selectLevel(id)}
          />
        </aside>
      </main>

      {snapshot.phase === 'LEVEL_COMPLETE' && (
        <CelebrationOverlay level={currentLevel} onContinue={handleCelebrationContinue} />
      )}
    </div>
  );
}
