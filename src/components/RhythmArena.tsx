import React, { useCallback, useEffect, useRef, useState } from 'react';
import { playRhythmNoteVoice } from '../audio/rhythmAudio';
import { getRhythmLevelById } from '../rhythm/curriculum';
import { RhythmEngine } from '../rhythm/engine';
import { RhythmEngineSnapshot } from '../types/rhythm';

export interface RhythmArenaProps {
  levelId: string;
  onLevelComplete?: () => void;
}

export const RhythmArena: React.FC<RhythmArenaProps> = ({
  levelId,
  onLevelComplete,
}) => {
  const levelSpec = getRhythmLevelById(levelId);
  const engineRef = useRef<RhythmEngine>(new RhythmEngine(levelSpec, 0));
  const [snapshot, setSnapshot] = useState<RhythmEngineSnapshot>(() =>
    engineRef.current.getSnapshot()
  );

  // Sync snapshot
  const updateSnapshot = useCallback(() => {
    setSnapshot(engineRef.current.getSnapshot());
  }, []);

  // When levelId prop changes, update engine
  useEffect(() => {
    const spec = getRhythmLevelById(levelId);
    engineRef.current.selectLevel(spec, 0);
    updateSnapshot();
  }, [levelId, updateSnapshot]);

  // Check if level completed
  useEffect(() => {
    if (snapshot.phase === 'LEVEL_COMPLETE') {
      onLevelComplete?.();
    }
  }, [snapshot.phase, onLevelComplete]);

  // Animation / Ticking Loop for auto-advance or timeout
  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const snap = engineRef.current.getSnapshot();
      if (snap.phase === 'PLAYING' || snap.phase === 'FEEDBACK') {
        const res = engineRef.current.tick(now);
        if (res.transitionedToFeedback || res.advancedPhrase || res.levelComplete) {
          updateSnapshot();
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [updateSnapshot]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys and function keys
      if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab' || e.key === 'Escape') {
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Space, Enter, or any letter/number/punctuation note key
      const isPlayKey =
        e.code === 'Space' ||
        e.key === ' ' ||
        e.key === 'Enter' ||
        (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey);

      if (isPlayKey) {
        e.preventDefault();
        if (!e.repeat) {
          const res = engineRef.current.handleNotePress(performance.now());
          if (res.noteIndex !== -1) {
            playRhythmNoteVoice(res.durationBeats * 0.45, res.isLanding);
          }
          updateSnapshot();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isPlayKey =
        e.code === 'Space' ||
        e.key === ' ' ||
        e.key === 'Enter' ||
        (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey);

      if (isPlayKey) {
        engineRef.current.handleNoteRelease(performance.now());
        updateSnapshot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [updateSnapshot]);

  // SVG Layout Calculations
  const beats = snapshot.phrase.beatCells;
  const totalBeats = beats.length;
  const xStart = 85;
  const scoreWidth = 720;
  const wBeat = scoreWidth / Math.max(1, totalBeats);
  const baselineY = 100;

  const timeSigParts = snapshot.phrase.timeSignature.split('/');
  const timeSigTop = timeSigParts[0] ?? '4';
  const timeSigBottom = timeSigParts[1] ?? '4';

  // Compute positions of noteheads to render guidance and feedback
  const renderedNotePositions: {
    noteIndex: number;
    x: number;
    y: number;
    color: string;
    errorHint: string | null;
  }[] = [];

  let noteCounter = 0;

  // Bottom Status Prompt
  let statusPrompt = '';
  if (snapshot.phase === 'READY') {
    statusPrompt = 'Play the 1st note (Space or any piano key) to start at your own tempo';
  } else if (snapshot.phase === 'PLAYING') {
    statusPrompt = 'Keep your steady beat through the final note...';
  } else if (snapshot.phase === 'FEEDBACK') {
    if (snapshot.feedback?.passed) {
      statusPrompt = `✓ Steady rhythm (~${snapshot.feedback.estimatedUserBpm} BPM)`;
    } else {
      statusPrompt = 'Timing off on highlighted notes — play the 1st note to try again';
    }
  } else if (snapshot.phase === 'LEVEL_COMPLETE') {
    statusPrompt = '✓ Level Complete!';
  }

  return (
    <div className="nnsr-rhythm-practice-container" style={{ width: '840px' }}>
      {/* 1. Rhythm Staff Card */}
      <div className="nnsr-rhythm-canvas-card">
        <svg
          className="nnsr-rhythm-svg"
          viewBox="0 0 840 200"
          role="img"
          aria-label={`Rhythm notation for ${snapshot.phrase.id}`}
        >
          {/* Percussion Clef (two vertical parallel bars) */}
          <rect x="34" y="78" width="4.5" height="44" rx="1.5" fill="var(--ink-primary)" />
          <rect x="43" y="78" width="4.5" height="44" rx="1.5" fill="var(--ink-primary)" />

          {/* Time Signature */}
          <text
            x="64"
            y="93"
            textAnchor="middle"
            fontFamily="var(--font-serif)"
            fontWeight="bold"
            fontSize="22"
            fill="var(--ink-primary)"
          >
            {timeSigTop}
          </text>
          <text
            x="64"
            y="115"
            textAnchor="middle"
            fontFamily="var(--font-serif)"
            fontWeight="bold"
            fontSize="22"
            fill="var(--ink-primary)"
          >
            {timeSigBottom}
          </text>

          {/* Horizontal Rhythm Baseline */}
          <line
            x1="22"
            y1={baselineY}
            x2={xStart + scoreWidth + 18}
            y2={baselineY}
            stroke="var(--ink-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Barlines across measures */}
          {Array.from({ length: totalBeats }).map((_, b) => {
            const isBarStart = b > 0 && b % snapshot.phrase.beatsPerBar === 0;
            if (!isBarStart) return null;
            const xBar = xStart + b * wBeat;

            return (
              <line
                key={`barline-${b}`}
                x1={xBar}
                y1={65}
                x2={xBar}
                y2={135}
                stroke="var(--ink-primary)"
                strokeWidth="1.6"
              />
            );
          })}

          {/* Final Double Barline */}
          <line
            x1={xStart + scoreWidth + 12}
            y1={65}
            x2={xStart + scoreWidth + 12}
            y2={135}
            stroke="var(--ink-primary)"
            strokeWidth="1.5"
          />
          <line
            x1={xStart + scoreWidth + 17}
            y1={65}
            x2={xStart + scoreWidth + 17}
            y2={135}
            stroke="var(--ink-primary)"
            strokeWidth="3.5"
          />

          {/* Beat Cells: Notes, Stems, Beams & Rests */}
          {beats.map((cell, b) => {
            const xBeat = xStart + b * wBeat;
            const innerW = wBeat;

            const cellNotes: {
              xNote: number;
              xStem: number;
              durationBeats: number;
              noteIndex: number;
            }[] = [];

            const renderedEvents = cell.events.map((evt, eIdx) => {
              // Position inside beat
              let relPos = 0.5;
              const nEvt = cell.events.length;
              if (nEvt === 2) {
                relPos = eIdx === 0 ? 0.28 : 0.72;
              } else if (nEvt === 3) {
                if (cell.cellId === 'gallop') {
                  relPos = eIdx === 0 ? 0.25 : eIdx === 1 ? 0.62 : 0.86;
                } else if (cell.cellId === 'rev_gallop') {
                  relPos = eIdx === 0 ? 0.16 : eIdx === 1 ? 0.40 : 0.75;
                } else {
                  relPos = eIdx === 0 ? 0.20 : eIdx === 1 ? 0.50 : 0.80;
                }
              } else if (nEvt === 4) {
                relPos = 0.15 + eIdx * 0.24;
              }

              const xEvt = xBeat + relPos * innerW;

              if (evt.kind === 'rest') {
                return (
                  <g key={`rest-${b}-${eIdx}`}>
                    {evt.durationBeats >= 1.0 ? (
                      <text
                        x={xEvt}
                        y={baselineY + 11}
                        fontSize="28"
                        fontFamily="serif"
                        fill="var(--ink-primary)"
                        textAnchor="middle"
                      >
                        𝄽
                      </text>
                    ) : (
                      <text
                        x={xEvt}
                        y={baselineY + 9}
                        fontSize="22"
                        fontFamily="serif"
                        fill="var(--ink-primary)"
                        textAnchor="middle"
                      >
                        𝄾
                      </text>
                    )}
                  </g>
                );
              }

              // Note Attack
              const currentNoteIndex = evt.tiedFromPrev
                ? Math.max(0, noteCounter - 1)
                : noteCounter++;

              const xNote = xEvt;
              const xStem = xNote + 5.5;

              // Color determination
              let noteColor = 'var(--ink-primary)';
              let errorHint: string | null = null;

              if (snapshot.phase === 'READY') {
                noteColor = 'var(--ink-primary)';
              } else if (snapshot.phase === 'PLAYING') {
                if (currentNoteIndex < snapshot.currentNoteIndex) {
                  noteColor = '#04724d'; // Already tapped
                }
              } else if (snapshot.phase === 'FEEDBACK' && snapshot.feedback) {
                const evalRes = snapshot.feedback.noteEvaluations[currentNoteIndex];
                if (evalRes) {
                  if (evalRes.status === 'perfect' || evalRes.status === 'loose') {
                    noteColor = '#04724d'; // Green
                  } else {
                    noteColor = '#e05a47'; // Coral Red
                  }
                  errorHint = evalRes.errorHint;
                }
              }

              renderedNotePositions.push({
                noteIndex: currentNoteIndex,
                x: xNote,
                y: baselineY,
                color: noteColor,
                errorHint,
              });

              cellNotes.push({
                xNote,
                xStem,
                durationBeats: evt.durationBeats,
                noteIndex: currentNoteIndex,
              });

              const isHalfNote = cell.cellId === 'h_start';

              return (
                <g key={`note-${b}-${eIdx}`}>
                  {/* Tie Arc from previous beat if tied */}
                  {evt.tiedFromPrev && (
                    <path
                      d={`M ${xNote - 22} ${baselineY + 7} Q ${xNote - 11} ${baselineY + 16} ${xNote - 2} ${baselineY + 7}`}
                      fill="none"
                      stroke={noteColor}
                      strokeWidth="2"
                    />
                  )}

                  {/* Notehead */}
                  {isHalfNote ? (
                    <ellipse
                      cx={xNote}
                      cy={baselineY}
                      rx="6.5"
                      ry="4.5"
                      fill="#ffffff"
                      stroke={noteColor}
                      strokeWidth="2.5"
                      transform={`rotate(-20 ${xNote} ${baselineY})`}
                    />
                  ) : (
                    <ellipse
                      cx={xNote}
                      cy={baselineY}
                      rx="6"
                      ry="4.5"
                      fill={noteColor}
                      transform={`rotate(-20 ${xNote} ${baselineY})`}
                    />
                  )}

                  {/* Dot if dotted note */}
                  {(evt.dotted || (cell.cellId === 'dot8_s' && eIdx === 0)) && (
                    <circle cx={xNote + 13} cy={baselineY - 5} r="2.5" fill={noteColor} />
                  )}

                  {/* Error hint below note in FEEDBACK */}
                  {errorHint && (
                    <text
                      x={xNote}
                      y={baselineY + 28}
                      fontSize="11"
                      fontFamily="var(--font-sans)"
                      fontWeight="bold"
                      fill="#e05a47"
                      textAnchor="middle"
                    >
                      {errorHint}
                    </text>
                  )}
                </g>
              );
            });

            // Stems and Beams
            const yStemTop = 55;
            const stemsAndBeams = (() => {
              if (cellNotes.length === 0) return null;

              if (cellNotes.length === 1) {
                const singleNote = cellNotes[0];
                if (!singleNote) return null;
                return (
                  <line
                    x1={singleNote.xStem}
                    y1={baselineY}
                    x2={singleNote.xStem}
                    y2={yStemTop}
                    stroke="var(--ink-primary)"
                    strokeWidth="1.8"
                  />
                );
              }

              const firstStem = cellNotes[0]?.xStem ?? 0;
              const lastStem = cellNotes[cellNotes.length - 1]?.xStem ?? 0;
              const stem1 = cellNotes[1]?.xStem;

              return (
                <g key={`beam-${b}`}>
                  {cellNotes.map((cn, i) => (
                    <line
                      key={`stem-${b}-${i}`}
                      x1={cn.xStem}
                      y1={baselineY}
                      x2={cn.xStem}
                      y2={yStemTop}
                      stroke="var(--ink-primary)"
                      strokeWidth="1.8"
                    />
                  ))}
                  {/* Primary Beam */}
                  <line
                    x1={firstStem - 1}
                    y1={yStemTop}
                    x2={lastStem + 1}
                    y2={yStemTop}
                    stroke="var(--ink-primary)"
                    strokeWidth="3.8"
                  />
                  {/* Secondary Beam for Sixteenths */}
                  {cell.cellId === 's4' && (
                    <line
                      x1={firstStem - 1}
                      y1={yStemTop + 6.5}
                      x2={lastStem + 1}
                      y2={yStemTop + 6.5}
                      stroke="var(--ink-primary)"
                      strokeWidth="3.8"
                    />
                  )}
                  {cell.cellId === 'gallop' && stem1 !== undefined && (
                    <line
                      x1={stem1 - 1}
                      y1={yStemTop + 6.5}
                      x2={lastStem + 1}
                      y2={yStemTop + 6.5}
                      stroke="var(--ink-primary)"
                      strokeWidth="3.8"
                    />
                  )}
                  {cell.cellId === 'rev_gallop' && stem1 !== undefined && (
                    <line
                      x1={firstStem - 1}
                      y1={yStemTop + 6.5}
                      x2={stem1 + 1}
                      y2={yStemTop + 6.5}
                      stroke="var(--ink-primary)"
                      strokeWidth="3.8"
                    />
                  )}
                  {cell.cellId === 'dot8_s' && (
                    <line
                      x1={lastStem - 10}
                      y1={yStemTop + 6.5}
                      x2={lastStem + 1}
                      y2={yStemTop + 6.5}
                      stroke="var(--ink-primary)"
                      strokeWidth="3.8"
                    />
                  )}
                  {cell.cellId === 'triplet_e' && (
                    <text
                      x={(firstStem + lastStem) / 2}
                      y={yStemTop - 6}
                      fontFamily="var(--font-sans)"
                      fontSize="11"
                      fontWeight="bold"
                      fontStyle="italic"
                      fill="var(--ink-primary)"
                      textAnchor="middle"
                    >
                      3
                    </text>
                  )}
                </g>
              );
            })();

            return (
              <g key={`beat-cell-${b}`}>
                {renderedEvents}
                {stemsAndBeams}
              </g>
            );
          })}

          {/* Visual Guidance on Note 0 in READY phase */}
          {snapshot.phase === 'READY' && renderedNotePositions[0] && (
            <g className="nnsr-rhythm-start-guide">
              <circle
                cx={renderedNotePositions[0].x}
                cy={baselineY}
                r={13}
                fill="none"
                stroke="var(--emerald)"
                strokeWidth={2.2}
                strokeDasharray="4 3"
              />
              <text
                x={renderedNotePositions[0].x}
                y={38}
                fontFamily="var(--font-sans)"
                fontSize="12"
                fontWeight="700"
                fill="var(--emerald)"
                textAnchor="middle"
              >
                ▼ 1st note
              </text>
            </g>
          )}

          {/* Active Target Ring on Current Note during PLAYING */}
          {snapshot.phase === 'PLAYING' &&
            renderedNotePositions[snapshot.currentNoteIndex] && (
              <circle
                cx={renderedNotePositions[snapshot.currentNoteIndex]!.x}
                cy={baselineY}
                r={12}
                fill="none"
                stroke="var(--emerald)"
                strokeWidth={2}
              />
            )}
        </svg>

        {/* Clear bottom status prompt */}
        <div className="nnsr-rhythm-status-prompt">
          <span>{statusPrompt}</span>
        </div>
      </div>

      {/* 2. Progress Bar (Matches Sight-Reading ProgressBar) */}
      <div className="nnsr-progress-bar-container" style={{ width: '840px', marginTop: '12px' }}>
        <div className="nnsr-progress-section" style={{ width: '100%', borderRight: 'none' }}>
          <div className="nnsr-progress-label">
            {snapshot.levelTitle} — Phrase{' '}
            {Math.min(snapshot.phrasesCompletedInLevel + 1, snapshot.phrasesRequiredForLevel)} of{' '}
            {snapshot.phrasesRequiredForLevel}
          </div>
          <div className="nnsr-progress-track">
            {Array.from({ length: snapshot.phrasesRequiredForLevel }).map((_, idx) => (
              <div
                key={`rhythm-step-${idx}`}
                className={`nnsr-progress-step ${
                  idx < snapshot.phrasesCompletedInLevel ? 'filled' : ''
                }`}
                style={{
                  backgroundColor:
                    idx < snapshot.phrasesCompletedInLevel
                      ? 'var(--emerald)'
                      : 'var(--surface-subtle)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
