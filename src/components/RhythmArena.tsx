import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getRhythmLevelById, isRhythmLevelId, RHYTHM_LEVELS } from '../rhythm/curriculum';
import { RhythmEngine } from '../rhythm/engine';
import { RhythmEngineSnapshot, RhythmLevelSpec } from '../types/rhythm';
import { generateRhythmPhrase, RhythmConceptId } from '../rhythm/generator';

export interface RhythmStreamOptionsProp {
  readonly concepts: readonly RhythmConceptId[];
  readonly targetBpm: number;
  readonly accelerandoOnPass: boolean;
}

export interface RhythmArenaProps {
  levelId: string;
  onLevelComplete?: () => void;
  streamOptions?: RhythmStreamOptionsProp | null;
  onExitStream?: () => void;
}

export const RhythmArena: React.FC<RhythmArenaProps> = ({
  levelId,
  onLevelComplete,
  streamOptions,
  onExitStream,
}) => {
  const initialSpec = isRhythmLevelId(levelId)
    ? getRhythmLevelById(levelId)
    : RHYTHM_LEVELS[0]!;
  const engineRef = useRef<RhythmEngine>(new RhythmEngine(initialSpec, 0));
  const [snapshot, setSnapshot] = useState<RhythmEngineSnapshot>(() =>
    engineRef.current.getSnapshot()
  );

  // Sync snapshot
  const updateSnapshot = useCallback(() => {
    setSnapshot(engineRef.current.getSnapshot());
  }, []);

  // When levelId or streamOptions prop changes, update engine
  useEffect(() => {
    if (streamOptions) {
      const supplier = () =>
        generateRhythmPhrase({
          concepts: streamOptions.concepts,
          targetBpm: streamOptions.targetBpm,
        });
      const initialPhrase = supplier();
      const streamSpec: RhythmLevelSpec = {
        id: 'rhythm-stream',
        tier: 1,
        title: 'Infinite Rhythm Stream',
        subtitle: 'Procedural non-repeating groove stream',
        motif: 'rag_sync',
        prerequisiteIds: [],
        nextIds: [],
        phrases: [initialPhrase],
      };
      engineRef.current.selectLevel(streamSpec, 0);
      engineRef.current.setStreamOptions({
        isStreamMode: true,
        phraseSupplier: supplier,
        accelerandoOnPass: streamOptions.accelerandoOnPass,
      });
      updateSnapshot();
    } else if (isRhythmLevelId(levelId)) {
      const spec = getRhythmLevelById(levelId);
      engineRef.current.setStreamOptions({ isStreamMode: false });
      engineRef.current.selectLevel(spec, 0);
      updateSnapshot();
    }
  }, [levelId, streamOptions, updateSnapshot]);

  // Check if level completed
  useEffect(() => {
    if (snapshot.phase === 'LEVEL_COMPLETE') {
      onLevelComplete?.();
    }
  }, [snapshot.phase, onLevelComplete]);

  // Animation / Ticking Loop for count-in progression and phrase timeout
  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const snap = engineRef.current.getSnapshot();
      if (snap.phase === 'COUNT_IN' || snap.phase === 'PLAYING') {
        const res = engineRef.current.tick(now);
        if (
          res.transitionedToReadyToPlay ||
          res.transitionedToFeedback ||
          res.advancedPhrase ||
          res.levelComplete
        ) {
          updateSnapshot();
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [updateSnapshot]);

  const handleStartCountIn = useCallback(() => {
    engineRef.current.startCountIn(performance.now());
    updateSnapshot();
  }, [updateSnapshot]);

  const handleNextPhrase = useCallback(() => {
    const advanced = engineRef.current.advanceToNextPhrase();
    if (!advanced && engineRef.current.getSnapshot().phase === 'LEVEL_COMPLETE') {
      onLevelComplete?.();
    }
    updateSnapshot();
  }, [onLevelComplete, updateSnapshot]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: exit stream if in stream mode, or reset phrase in standard practice
      if (e.key === 'Escape') {
        e.preventDefault();
        if (streamOptions && onExitStream) {
          onExitStream();
          return;
        }
        engineRef.current.resetForPhrase();
        updateSnapshot();
        return;
      }

      // 'M' or 'T': Repeat the metronome count-in at any time
      if (e.key === 'm' || e.key === 'M' || e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleStartCountIn();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab') {
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const snap = engineRef.current.getSnapshot();

      // In STUDY phase, Enter or Space starts count-in
      if (snap.phase === 'STUDY') {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleStartCountIn();
          return;
        }
      }

      // In FEEDBACK phase:
      if (snap.phase === 'FEEDBACK') {
        if (snap.feedback?.passed) {
          if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleNextPhrase();
            return;
          }
        } else {
          // Failed phrase: ALWAYS tap in with metronome, triggered simply with Space or Enter
          if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleStartCountIn();
            return;
          }
        }
        // In FEEDBACK phase, ignore other keys so they never bypass count-in
        return;
      }

      // Play keys for READY_TO_PLAY or PLAYING (or retry on feedback)
      const isPlayKey =
        e.code === 'Space' ||
        e.key === ' ' ||
        e.key === 'Enter' ||
        (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey);

      if (isPlayKey) {
        e.preventDefault();
        if (!e.repeat) {
          engineRef.current.handleNotePress(performance.now());
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
  }, [handleStartCountIn, handleNextPhrase, updateSnapshot, streamOptions, onExitStream]);

  // Staff Layout: Authentic Optical Engraving Spacing
  const beats = snapshot.phrase.beatCells;
  const totalBeats = beats.length;
  const xStart = 85;
  const scoreWidth = 720;
  const baselineY = 100;
  const beatsPerBar = snapshot.phrase.beatsPerBar;

  const numBarlines = Math.floor((totalBeats - 1) / beatsPerBar);
  const barlinePaddingTotal = numBarlines * 32; // 14px before + 18px after
  const availableStaffWidth = Math.max(100, scoreWidth - barlinePaddingTotal);

  // Compute optical weight for each cell: sum (d_e^0.65)
  const cellWeights = beats.map((cell) => {
    if (cell.cellId === 'hold_q') return 1.0;
    let sum = 0;
    for (const evt of cell.events) {
      sum += Math.pow(evt.durationBeats, 0.65);
    }
    return Math.max(0.4, sum);
  });
  const totalWeight = cellWeights.reduce((a, b) => a + b, 0);

  const beatX: number[] = [];
  const cellW: number[] = [];
  const barlinePositions: number[] = [];

  let curStaffX = xStart;
  for (let b = 0; b < totalBeats; b++) {
    if (b > 0 && b % beatsPerBar === 0) {
      curStaffX += 14;
      barlinePositions.push(curStaffX);
      curStaffX += 18;
    }
    beatX.push(curStaffX);
    const w = ((cellWeights[b] ?? 1.0) / totalWeight) * availableStaffWidth;
    cellW.push(w);
    curStaffX += w;
  }

  const timeSigParts = snapshot.phrase.timeSignature.split('/');
  const timeSigTop = timeSigParts[0] ?? '4';
  const timeSigBottom = timeSigParts[1] ?? '4';

  const renderedNotePositions: {
    noteIndex: number;
    x: number;
    y: number;
    color: string;
    errorHint: string | null;
  }[] = [];

  let noteCounter = 0;

  return (
    <div className="nnsr-rhythm-practice-container" data-testid="rhythm-arena" style={{ width: '840px' }}>
      {/* Stream Mode Top Bar */}
      {snapshot.isStreamMode && (
        <div
          data-testid="rhythm-stream-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            marginBottom: '10px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e0ded8',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'var(--emerald)',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              Stream Mode
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-primary)' }}>
              🔥 Streak:{' '}
              <strong data-testid="rhythm-stream-streak-val" style={{ color: 'var(--emerald)' }}>
                {snapshot.streamStreak ?? 0}
              </strong>
            </span>
            <span style={{ fontSize: '13px', color: 'var(--ink-subtle)' }}>•</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-primary)' }}>
              Tempo:{' '}
              <strong data-testid="rhythm-stream-tempo-val" style={{ color: 'var(--emerald)' }}>
                {snapshot.streamBpm ?? snapshot.phrase.targetBpm} BPM
              </strong>
            </span>
          </div>

          <button
            onClick={onExitStream}
            data-testid="exit-rhythm-stream-btn"
            style={{
              border: '1px solid #d4d0c7',
              background: '#faf9f6',
              color: 'var(--ink-primary)',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Exit Stream [Esc]
          </button>
        </div>
      )}

      {/* 1. Rhythm Staff Card (Optically Engraved) */}
      <div className="nnsr-rhythm-canvas-card">
        <svg
          className="nnsr-rhythm-svg"
          viewBox="0 0 840 200"
          role="img"
          aria-label={`Rhythm notation for ${snapshot.phrase.id}`}
        >
          {/* Percussion Clef */}
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
            x2={curStaffX + 18}
            y2={baselineY}
            stroke="var(--ink-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Optical Barlines across measures */}
          {barlinePositions.map((xBar, bIdx) => (
            <line
              key={`barline-${bIdx}`}
              x1={xBar}
              y1={65}
              x2={xBar}
              y2={135}
              stroke="var(--ink-primary)"
              strokeWidth="1.6"
            />
          ))}

          {/* Final Double Barline */}
          <line
            x1={curStaffX + 12}
            y1={65}
            x2={curStaffX + 12}
            y2={135}
            stroke="var(--ink-primary)"
            strokeWidth="1.5"
          />
          <line
            x1={curStaffX + 17}
            y1={65}
            x2={curStaffX + 17}
            y2={135}
            stroke="var(--ink-primary)"
            strokeWidth="3.5"
          />

          {/* Beat Cells: Notes, Stems, Beams & Rests */}
          {beats.map((cell, b) => {
            const xBeat = beatX[b] ?? xStart;
            const innerW = cellW[b] ?? 60;

            const cellNotes: {
              xNote: number;
              xStem: number;
              durationBeats: number;
              noteIndex: number;
              hasFlag: boolean;
            }[] = [];

            if (cell.cellId === 'hold_q') {
              return <g key={`beat-cell-${b}`} />;
            }

            const nextCell = beats[b + 1];
            const isDottedQuarterStart =
              cell.cellId === 'q' && nextCell?.cellId === 'tie_e_note_e';

            const renderedEvents = cell.events.map((evt, eIdx) => {
              if (cell.cellId === 'tie_e_note_e' && eIdx === 0 && beats[b - 1]?.cellId === 'q') {
                return null;
              }

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

              const currentNoteIndex = evt.tiedFromPrev
                ? Math.max(0, noteCounter - 1)
                : noteCounter++;

              const xNote = xEvt;
              const xStem = xNote + 5.5;

              // Color determination: NEVER color green until FEEDBACK!
              let noteColor = 'var(--ink-primary)';
              let errorHint: string | null = null;

              if (snapshot.phase === 'FEEDBACK' && snapshot.feedback) {
                const evalRes = snapshot.feedback.noteEvaluations[currentNoteIndex];
                if (evalRes) {
                  if (evalRes.status === 'perfect' || evalRes.status === 'loose') {
                    noteColor = '#04724d';
                  } else {
                    noteColor = '#e05a47';
                  }
                  errorHint = evalRes.errorHint;
                }
              }

              if (!evt.tiedFromPrev) {
                renderedNotePositions.push({
                  noteIndex: currentNoteIndex,
                  x: xNote,
                  y: baselineY,
                  color: noteColor,
                  errorHint,
                });
              }

              const needsEighthFlag =
                evt.durationBeats === 0.5 &&
                (cell.cellId === 'upbeat_e' ||
                  cell.cellId === 'note_e_rest_e' ||
                  (cell.cellId === 'tie_e_note_e' && beats[b - 1]?.cellId === 'q'));

              cellNotes.push({
                xNote,
                xStem,
                durationBeats: evt.durationBeats,
                noteIndex: currentNoteIndex,
                hasFlag: needsEighthFlag,
              });

              const isHalfNote = cell.cellId === 'h_start';
              const prevNotePos = renderedNotePositions[renderedNotePositions.length - 1];
              const tieStartX = prevNotePos ? prevNotePos.x + 4 : xNote - 28;

              return (
                <g key={`note-${b}-${eIdx}`}>
                  {evt.tiedFromPrev && (
                    <path
                      d={`M ${tieStartX} ${baselineY + 8} Q ${(tieStartX + xNote - 4) / 2} ${baselineY + 18} ${xNote - 4} ${baselineY + 8}`}
                      fill="none"
                      stroke={noteColor}
                      strokeWidth="2"
                    />
                  )}

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

                  {(evt.dotted ||
                    isDottedQuarterStart ||
                    (cell.cellId === 'dot8_s' && eIdx === 0)) && (
                    <circle cx={xNote + 13} cy={baselineY - 5} r="2.5" fill={noteColor} />
                  )}
                </g>
              );
            });

            const yStemTop = 55;
            const stemsAndBeams = (() => {
              if (cellNotes.length === 0) return null;

              if (cellNotes.length === 1) {
                const singleNote = cellNotes[0];
                if (!singleNote) return null;
                return (
                  <g key={`single-stem-${b}`}>
                    <line
                      x1={singleNote.xStem}
                      y1={baselineY}
                      x2={singleNote.xStem}
                      y2={yStemTop}
                      stroke="var(--ink-primary)"
                      strokeWidth="1.8"
                    />
                    {singleNote.hasFlag && (
                      <path
                        d={`M ${singleNote.xStem} ${yStemTop} C ${singleNote.xStem + 7} ${yStemTop + 5}, ${singleNote.xStem + 10} ${yStemTop + 12}, ${singleNote.xStem + 7} ${yStemTop + 21}`}
                        fill="none"
                        stroke="var(--ink-primary)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    )}
                  </g>
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
                  <line
                    x1={firstStem - 1}
                    y1={yStemTop}
                    x2={lastStem + 1}
                    y2={yStemTop}
                    stroke="var(--ink-primary)"
                    strokeWidth="3.8"
                  />
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

          {/* Visual Guidance on Note 0 in READY_TO_PLAY phase (Subtle dark ink, NOT green) */}
          {snapshot.phase === 'READY_TO_PLAY' && renderedNotePositions[0] && (
            <g className="nnsr-rhythm-start-guide">
              <circle
                cx={renderedNotePositions[0].x}
                cy={baselineY}
                r={13}
                fill="none"
                stroke="var(--ink-primary)"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
              <text
                x={renderedNotePositions[0].x}
                y={38}
                fontFamily="var(--font-sans)"
                fontSize="12"
                fontWeight="700"
                fill="var(--ink-primary)"
                textAnchor="middle"
              >
                ▼ 1st note
              </text>
            </g>
          )}
        </svg>

        {/* 2. Linear Time-Proportion Comparison Bar (Visible ONLY in FEEDBACK) */}
        {snapshot.phase === 'FEEDBACK' && snapshot.feedback && (
          <div
            className="nnsr-rhythm-linear-comparison"
            style={{
              padding: '10px 16px 14px 16px',
              borderTop: '1px solid #e0ded8',
              backgroundColor: '#faf9f6',
            }}
          >
            <svg
              data-testid="rhythm-linear-comparison-bar"
              viewBox="0 0 840 96"
              style={{ width: '100%', height: '96px', display: 'block' }}
              role="img"
              aria-label="Linear Time-Proportion Comparison"
            >
              {(() => {
                const timelineStart = 110;
                const timelineWidth = 690;
                const wBeatLinear = timelineWidth / Math.max(1, totalBeats);

                // Grid lines & ticks
                const gridElements: React.JSX.Element[] = [];
                for (let b = 0; b <= totalBeats; b++) {
                  const x = timelineStart + b * wBeatLinear;
                  const isBar = b % beatsPerBar === 0;
                  gridElements.push(
                    <line
                      key={`lin-beat-${b}`}
                      x1={x}
                      y1={14}
                      x2={x}
                      y2={82}
                      stroke={isBar ? '#1f2421' : '#b0aba2'}
                      strokeWidth={isBar ? 1.6 : 1.0}
                      strokeDasharray={isBar ? undefined : '2 3'}
                    />
                  );

                  if (b < totalBeats) {
                    for (const sub of [0.25, 0.5, 0.75]) {
                      const xSub = timelineStart + (b + sub) * wBeatLinear;
                      gridElements.push(
                        <line
                          key={`lin-sub-${b}-${sub}`}
                          x1={xSub}
                          y1={44}
                          x2={xSub}
                          y2={52}
                          stroke="#dcdad5"
                          strokeWidth={1}
                        />
                      );
                    }
                  }
                }

                // Row 1: Expected Notes
                const expectedElements = snapshot.flattenedNotes.map((n) => {
                  const xExp = timelineStart + n.startBeat * wBeatLinear;
                  const wExp = Math.max(6, n.durationBeats * wBeatLinear - 3);
                  return (
                    <g key={`exp-note-${n.noteIndex}`}>
                      <rect x={xExp} y={24} width={wExp} height={12} rx={3} fill="#5a625d" />
                      <circle cx={xExp + 3.5} cy={30} r={3.5} fill="#1f2421" />
                    </g>
                  );
                });

                // Row 2: You Played (Shifted Taps) + Connector Lines
                const tapElements: React.JSX.Element[] = [];
                snapshot.feedback.shiftedTaps.forEach((tap) => {
                  const xTap = timelineStart + tap.startBeat * wBeatLinear;
                  const wTap = Math.max(6, tap.durationBeats * wBeatLinear - 3);
                  const color = tap.status === 'missed' ? '#e05a47' : '#04724d';

                  if (tap.matchedNoteIndex !== null) {
                    const matched = snapshot.flattenedNotes[tap.matchedNoteIndex];
                    if (matched) {
                      const xMatched = timelineStart + matched.startBeat * wBeatLinear + 3.5;
                      tapElements.push(
                        <line
                          key={`connector-${tap.tapIndex}`}
                          x1={xMatched}
                          y1={36}
                          x2={xTap + 3.5}
                          y2={60}
                          stroke={color}
                          strokeWidth={1.2}
                          strokeDasharray="2 2"
                        />
                      );
                    }
                  }

                  tapElements.push(
                    <g key={`played-tap-${tap.tapIndex}`}>
                      <rect x={xTap} y={60} width={wTap} height={12} rx={3} fill={color} />
                      <circle cx={xTap + 3.5} cy={66} r={3.5} fill={color} />
                    </g>
                  );
                });

                return (
                  <g>
                    {/* Row Labels */}
                    <text
                      x={100}
                      y={33}
                      textAnchor="end"
                      fontSize="11"
                      fontWeight="700"
                      fill="var(--ink-primary)"
                      fontFamily="var(--font-sans)"
                    >
                      Expected
                    </text>
                    <text
                      x={100}
                      y={69}
                      textAnchor="end"
                      fontSize="11"
                      fontWeight="700"
                      fill="var(--ink-primary)"
                      fontFamily="var(--font-sans)"
                    >
                      You Played
                    </text>

                    {gridElements}
                    {expectedElements}
                    {tapElements}
                  </g>
                );
              })()}
            </svg>
          </div>
        )}

        {/* 3. Action Controls Across the 4 Stages */}
        <div
          className="nnsr-rhythm-status-prompt"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor:
              snapshot.phase === 'FEEDBACK'
                ? snapshot.feedback?.passed
                  ? '#e6f5ee'
                  : '#fdecea'
                : undefined,
            color:
              snapshot.phase === 'FEEDBACK'
                ? snapshot.feedback?.passed
                  ? '#04724d'
                  : '#c0392b'
                : undefined,
          }}
        >
          {snapshot.phase === 'STUDY' && (
            <button
              data-testid="hear-tempo-button"
              onClick={handleStartCountIn}
              style={{
                border: 'none',
                background: 'var(--emerald)',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Hear Tempo ({snapshot.phrase.beatsPerBar} Beats) [Enter / Space]
            </button>
          )}

          {snapshot.phase === 'COUNT_IN' && (
            <span>
              {snapshot.countInBeatIndex !== undefined && snapshot.countInBeatIndex >= 0 ? (
                <>
                  Tempo ({snapshot.phrase.targetBpm} BPM): Beat {snapshot.countInBeatIndex + 1} of{' '}
                  {snapshot.phrase.beatsPerBar}...
                </>
              ) : (
                <>Tempo ({snapshot.phrase.targetBpm} BPM): Count-in starting...</>
              )}
            </span>
          )}

          {snapshot.phase === 'READY_TO_PLAY' && (
            <span>Play the 1st note (Space or any piano key) whenever you&apos;re ready</span>
          )}

          {snapshot.phase === 'PLAYING' && (
            <span>Playing... keep the tempo steady through the final note</span>
          )}

          {snapshot.phase === 'FEEDBACK' && snapshot.feedback && (
            <>
              {snapshot.feedback.passed ? (
                <>
                  <span>
                    {snapshot.isStreamMode ? (
                      <>
                        ✓ Phrase Passed! Streak:{' '}
                        <strong>{snapshot.streamStreak ?? snapshot.phrasesCompletedInLevel}</strong> (
                        {snapshot.feedback.overallScorePct}%)
                      </>
                    ) : (
                      <>
                        ✓ Phrase {snapshot.phrasesCompletedInLevel} of{' '}
                        {snapshot.phrasesRequiredForLevel} Passed ({snapshot.feedback.overallScorePct}%)
                      </>
                    )}
                  </span>
                  <button
                    data-testid="next-phrase-button"
                    onClick={handleNextPhrase}
                    style={{
                      border: 'none',
                      background: '#04724d',
                      color: '#ffffff',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {!snapshot.isStreamMode &&
                    snapshot.phrasesCompletedInLevel >= snapshot.phrasesRequiredForLevel
                      ? 'Complete Level →'
                      : 'Next Phrase [Enter / Space]'}
                  </button>
                </>
              ) : (
                <>
                  <span>✗ Compare your timing on the linear grid below:</span>
                  <button
                    data-testid="hear-tempo-button"
                    onClick={handleStartCountIn}
                    style={{
                      border: 'none',
                      background: '#1f2421',
                      color: '#ffffff',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Retry [Space / Enter]
                  </button>
                </>
              )}
            </>
          )}

          {snapshot.phase === 'LEVEL_COMPLETE' && <span>✓ Level Complete!</span>}
        </div>
      </div>

      {/* 4. Progress Bar */}
      <div className="nnsr-progress-bar-container" style={{ width: '840px', marginTop: '12px' }}>
        <div className="nnsr-progress-section" style={{ width: '100%', borderRight: 'none' }}>
          {snapshot.isStreamMode ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="nnsr-progress-label">
                Infinite Stream — Current Streak: {snapshot.streamStreak ?? 0}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--emerald)' }}>
                {snapshot.streamBpm ?? snapshot.phrase.targetBpm} BPM
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
