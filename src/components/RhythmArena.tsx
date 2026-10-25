import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  playCellPreviewWithLanding,
  playLeftHandPulseThump,
  playMetricCountInClick,
  playRhythmNoteVoice,
} from '../audio/rhythmAudio';
import { RHYTHM_LEVELS, getRhythmLevelById } from '../rhythm/curriculum';
import { RhythmEngine } from '../rhythm/engine';
import {
  RhythmBeatCell,
  RhythmEngineSnapshot,
} from '../types/rhythm';

export interface RhythmArenaProps {
  initialLevelId?: string;
  initialPhraseIndex?: number;
}

export const RhythmArena: React.FC<RhythmArenaProps> = ({
  initialLevelId = 'rhythm-1',
  initialPhraseIndex = 0,
}) => {
  const defaultLevel = RHYTHM_LEVELS[0] ?? {
    id: 'rhythm-1',
    tier: 1,
    title: 'Tier 1: Pulse, Stride & Space',
    subtitle: '',
    description: '',
    featuredCellSymbols: [],
    phrases: [],
  };
  const initialLevel = getRhythmLevelById(initialLevelId) ?? defaultLevel;

  const engineRef = useRef<RhythmEngine>(
    new RhythmEngine(initialLevel, initialPhraseIndex)
  );
  const [snapshot, setSnapshot] = useState<RhythmEngineSnapshot>(() =>
    engineRef.current.getSnapshot()
  );

  // Sync snapshot
  const updateSnapshot = useCallback(() => {
    setSnapshot(engineRef.current.getSnapshot());
  }, []);

  // Animation / Ticking Loop
  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const snap = engineRef.current.getSnapshot();
      if (snap.phase === 'COUNT_IN' || snap.phase === 'PERFORM') {
        const res = engineRef.current.tick(now);
        if (res.countInClick) {
          playMetricCountInClick(res.countInClick.beatIndex, res.countInClick.totalBeats);
        }
        if (res.anchorClick) {
          playMetricCountInClick(0, snap.phrase.beatsPerBar);
        }
        setSnapshot(engineRef.current.getSnapshot());
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input or select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Rhythm tap (Space or J)
      if (e.code === 'Space' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (!e.repeat) {
          const res = engineRef.current.handleNotePress(performance.now());
          const beatSec = 60 / engineRef.current.getSnapshot().phrase.targetBpm;
          playRhythmNoteVoice(res.durationBeats * beatSec, res.isLanding);
          updateSnapshot();
        }
        return;
      }

      // Left-Hand Pulse (F)
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!e.repeat) {
          engineRef.current.handleLeftHandPulse(performance.now());
          playLeftHandPulseThump();
          updateSnapshot();
        }
        return;
      }

      // Start Count-In or Next Phrase (Enter)
      if (e.key === 'Enter') {
        e.preventDefault();
        const snap = engineRef.current.getSnapshot();
        if (snap.phase === 'SANDBOX') {
          engineRef.current.startCountIn(performance.now());
          playMetricCountInClick(0, snap.phrase.beatsPerBar);
          updateSnapshot();
        } else if (snap.phase === 'FEEDBACK') {
          if (!engineRef.current.advanceToNextPhrase()) {
            engineRef.current.resetToSandbox();
          }
          updateSnapshot();
        }
        return;
      }

      // Retry / Return to Sandbox (R)
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        engineRef.current.resetToSandbox();
        updateSnapshot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
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

  // Handlers
  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lvl = getRhythmLevelById(e.target.value);
    if (lvl) {
      engineRef.current.selectLevel(lvl, 0);
      updateSnapshot();
    }
  };

  const handlePhraseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    engineRef.current.selectPhraseById(e.target.value);
    updateSnapshot();
  };

  const handleMetricZoomToggle = () => {
    engineRef.current.toggleMetricZoom();
    updateSnapshot();
  };

  const handleWordBoxesToggle = () => {
    engineRef.current.toggleWordBoxes();
    updateSnapshot();
  };

  const handlePulseModeToggle = () => {
    const nextMode =
      snapshot.pulseMode === 'SILENT_CONTINUATION'
        ? 'BAR_DOWNBEAT_ANCHOR'
        : 'SILENT_CONTINUATION';
    engineRef.current.setPulseMode(nextMode);
    updateSnapshot();
  };

  const handleStartPerform = () => {
    engineRef.current.startCountIn(performance.now());
    playMetricCountInClick(0, snapshot.phrase.beatsPerBar);
    updateSnapshot();
  };

  const handleRetry = () => {
    engineRef.current.resetToSandbox();
    updateSnapshot();
  };

  const handleNextPhrase = () => {
    if (!engineRef.current.advanceToNextPhrase()) {
      engineRef.current.resetToSandbox();
    }
    updateSnapshot();
  };

  const handleBeatBoxClick = (cell: RhythmBeatCell) => {
    if (snapshot.phase === 'SANDBOX') {
      playCellPreviewWithLanding(cell, snapshot.phrase.targetBpm);
    }
  };

  const currentLevel =
    getRhythmLevelById(snapshot.levelId) ?? defaultLevel;

  // SVG Score Engraving Calculations
  const beats = snapshot.phrase.beatCells;
  const totalBeats = beats.length;
  const xStart = 85;
  const scoreWidth = 720;
  const wBeat = scoreWidth / Math.max(1, totalBeats);
  const baselineY = 110;

  // Track notehead evaluations for feedback coloring
  let noteheadCounter = 0;

  const timeSigParts = snapshot.phrase.timeSignature.split('/');
  const timeSigTop = timeSigParts[0] ?? '4';
  const timeSigBottom = timeSigParts[1] ?? '4';

  return (
    <div className="nnsr-rhythm-arena">
      {/* Top Toolbar */}
      <div className="nnsr-rhythm-toolbar">
        <div className="nnsr-rhythm-selectors">
          <select
            className="nnsr-rhythm-select"
            value={snapshot.levelId}
            onChange={handleTierChange}
            data-testid="rhythm-tier-select"
            aria-label="Select Rhythm Tier"
          >
            {RHYTHM_LEVELS.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.title}
              </option>
            ))}
          </select>

          <select
            className="nnsr-rhythm-select"
            value={snapshot.phrase.id}
            onChange={handlePhraseChange}
            data-testid="rhythm-phrase-select"
            aria-label="Select Rhythm Phrase"
          >
            {currentLevel.phrases.map((p, idx) => (
              <option key={p.id} value={p.id}>
                {idx + 1}. {p.title} ({p.targetBpm} BPM)
              </option>
            ))}
          </select>

          {snapshot.phrase.sourceComposer && (
            <span className="nnsr-rhythm-composer-badge">
              {snapshot.phrase.sourceComposer}
            </span>
          )}
        </div>

        <div className="nnsr-rhythm-toggles">
          {snapshot.phrase.zoomTwinPhraseId && (
            <button
              type="button"
              className="nnsr-rhythm-btn nnsr-rhythm-zoom-btn"
              onClick={handleMetricZoomToggle}
              data-testid="rhythm-metric-zoom-btn"
              title="Toggle between 1x and 2x metric scale representation of this groove"
            >
              ⚡ 2× Metric Zoom {snapshot.phrase.zoomScaleLabel ? `(${snapshot.phrase.zoomScaleLabel})` : ''}
            </button>
          )}

          <button
            type="button"
            className="nnsr-rhythm-btn nnsr-rhythm-secondary-btn"
            onClick={handleWordBoxesToggle}
            data-testid="rhythm-word-boxes-toggle"
          >
            Word Boxes: {snapshot.showWordBoxes ? 'On' : 'Off'}
          </button>

          <button
            type="button"
            className="nnsr-rhythm-btn nnsr-rhythm-secondary-btn"
            onClick={handlePulseModeToggle}
            data-testid="rhythm-pulse-mode-toggle"
          >
            Pulse: {snapshot.pulseMode === 'SILENT_CONTINUATION' ? 'Silent' : 'Bar Downbeat'}
          </button>
        </div>
      </div>

      {/* SVG Rhythm Notation Score */}
      <div className="nnsr-rhythm-score-container">
        <svg
          className="nnsr-rhythm-score"
          viewBox="0 0 840 220"
          role="img"
          aria-label={`Rhythm notation for ${snapshot.phrase.title}`}
        >
          {/* Percussion Clef (two vertical parallel bars) */}
          <rect x="34" y="85" width="4.5" height="50" rx="1.5" fill="var(--ink-primary)" />
          <rect x="43" y="85" width="4.5" height="50" rx="1.5" fill="var(--ink-primary)" />

          {/* Time Signature */}
          <text
            x="64"
            y="102"
            textAnchor="middle"
            fontFamily="var(--font-serif)"
            fontWeight="bold"
            fontSize="24"
            fill="var(--ink-primary)"
          >
            {timeSigTop}
          </text>
          <text
            x="64"
            y="126"
            textAnchor="middle"
            fontFamily="var(--font-serif)"
            fontWeight="bold"
            fontSize="24"
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
            const isLandingBar = b === totalBeats - 1;

            return (
              <g key={`barline-${b}`}>
                <line
                  x1={xBar}
                  y1={70}
                  x2={xBar}
                  y2={150}
                  stroke="var(--ink-primary)"
                  strokeWidth={isLandingBar ? '2.5' : '1.5'}
                />
                {isLandingBar && (
                  <text
                    x={xBar + 8}
                    y={64}
                    fontFamily="var(--font-sans)"
                    fontSize="11"
                    fontWeight="bold"
                    fill="var(--ink-secondary)"
                  >
                    +1 Landing
                  </text>
                )}
              </g>
            );
          })}

          {/* Final Double Barline */}
          <line
            x1={xStart + scoreWidth + 12}
            y1={70}
            x2={xStart + scoreWidth + 12}
            y2={150}
            stroke="var(--ink-primary)"
            strokeWidth="1.5"
          />
          <line
            x1={xStart + scoreWidth + 17}
            y1={70}
            x2={xStart + scoreWidth + 17}
            y2={150}
            stroke="var(--ink-primary)"
            strokeWidth="3.5"
          />

          {/* Beat Cells: Notes, Stems, Beams & Rests */}
          {beats.map((cell, b) => {
            const xBeat = xStart + b * wBeat;
            const beatMargin = Math.min(10, wBeat * 0.12);
            const innerW = wBeat - 2 * beatMargin;

            // Collect notes in this cell for beaming
            const cellNotes: {
              evtIdx: number;
              xNote: number;
              xStem: number;
              durationBeats: number;
              noteIndex: number;
              tiedFromPrev?: boolean;
            }[] = [];

            const renderedEvents = cell.events.map((evt, eIdx) => {
              const xEvt = xBeat + beatMargin + evt.offsetBeats * innerW;

              if (evt.kind === 'rest') {
                return (
                  <g key={`rest-${b}-${eIdx}`}>
                    {evt.durationBeats >= 1.0 ? (
                      // Quarter Rest 𝄽
                      <text
                        x={xEvt + 10}
                        y={baselineY + 12}
                        fontSize="32"
                        fontFamily="serif"
                        fill="var(--ink-primary)"
                        textAnchor="middle"
                      >
                        𝄽
                      </text>
                    ) : evt.durationBeats >= 0.5 ? (
                      // Eighth Rest 𝄾
                      <text
                        x={xEvt + 8}
                        y={baselineY + 10}
                        fontSize="26"
                        fontFamily="serif"
                        fill="var(--ink-primary)"
                        textAnchor="middle"
                      >
                        𝄾
                      </text>
                    ) : (
                      // Sixteenth Rest 𝄿
                      <text
                        x={xEvt + 6}
                        y={baselineY + 10}
                        fontSize="24"
                        fontFamily="serif"
                        fill="var(--ink-primary)"
                        textAnchor="middle"
                      >
                        𝄿
                      </text>
                    )}
                  </g>
                );
              }

              // It's a note!
              const currentNoteIndex = evt.tiedFromPrev
                ? Math.max(0, noteheadCounter - 1)
                : noteheadCounter++;

              const xNote = xEvt + 10;
              const xStem = xNote + 5.5;

              cellNotes.push({
                evtIdx: eIdx,
                xNote,
                xStem,
                durationBeats: evt.durationBeats,
                noteIndex: currentNoteIndex,
                tiedFromPrev: evt.tiedFromPrev,
              });

              // Feedback coloring
              let noteColor = 'var(--ink-primary)';
              if (snapshot.phase === 'FEEDBACK' && snapshot.feedback) {
                const evalRes = snapshot.feedback.noteEvaluations[currentNoteIndex];
                if (evalRes) {
                  if (evalRes.status === 'perfect') {
                    noteColor = '#10b981'; // Emerald
                  } else if (evalRes.status === 'loose') {
                    noteColor = '#f59e0b'; // Amber
                  } else {
                    noteColor = '#ee6055'; // Coral
                  }
                }
              }

              const isHalfNote = cell.cellId === 'h_start';

              return (
                <g key={`note-${b}-${eIdx}`}>
                  {/* Tie Arc from previous beat if tied */}
                  {evt.tiedFromPrev && (
                    <path
                      d={`M ${xNote - 22} ${baselineY + 8} Q ${xNote - 11} ${baselineY + 18} ${xNote - 2} ${baselineY + 8}`}
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

                  {/* Dot if dotted note (e.g. dot8_s first note, or scotch_snap second note) */}
                  {(cell.cellId === 'dot8_s' && eIdx === 0) ||
                  (cell.cellId === 'scotch_snap' && eIdx === 1) ? (
                    <circle cx={xNote + 13} cy={baselineY - 5} r="2.5" fill={noteColor} />
                  ) : null}

                  {/* Feedback relative error badge if in FEEDBACK phase */}
                  {snapshot.phase === 'FEEDBACK' && snapshot.feedback && !evt.tiedFromPrev && (
                    <text
                      x={xNote}
                      y={baselineY + 28}
                      fontSize="9"
                      fontFamily="var(--font-sans)"
                      fontWeight="bold"
                      fill={noteColor}
                      textAnchor="middle"
                    >
                      {snapshot.feedback.noteEvaluations[currentNoteIndex]?.status === 'perfect'
                        ? '★'
                        : snapshot.feedback.noteEvaluations[currentNoteIndex]?.status === 'loose'
                        ? '▲'
                        : '✕'}
                    </text>
                  )}
                </g>
              );
            });

            // Beams / Stems for this beat cell
            const yStemTop = 60;
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

              // Multi-note beam group in 1 beat cell
              const firstStem = cellNotes[0]?.xStem ?? 0;
              const lastStem = cellNotes[cellNotes.length - 1]?.xStem ?? 0;
              const stem1 = cellNotes[1]?.xStem;

              return (
                <g key={`beam-group-${b}`}>
                  {/* Vertical stems */}
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

                  {/* Primary Beam across whole group */}
                  <line
                    x1={firstStem - 1}
                    y1={yStemTop}
                    x2={lastStem + 1}
                    y2={yStemTop}
                    stroke="var(--ink-primary)"
                    strokeWidth="4"
                  />

                  {/* Secondary Beams for Sixteenths */}
                  {cell.cellId === 's4' && (
                    <line
                      x1={firstStem - 1}
                      y1={yStemTop + 7}
                      x2={lastStem + 1}
                      y2={yStemTop + 7}
                      stroke="var(--ink-primary)"
                      strokeWidth="4"
                    />
                  )}

                  {cell.cellId === 'gallop' && stem1 !== undefined && (
                    <line
                      x1={stem1 - 1}
                      y1={yStemTop + 7}
                      x2={lastStem + 1}
                      y2={yStemTop + 7}
                      stroke="var(--ink-primary)"
                      strokeWidth="4"
                    />
                  )}

                  {cell.cellId === 'rev_gallop' && stem1 !== undefined && (
                    <line
                      x1={firstStem - 1}
                      y1={yStemTop + 7}
                      x2={stem1 + 1}
                      y2={yStemTop + 7}
                      stroke="var(--ink-primary)"
                      strokeWidth="4"
                    />
                  )}

                  {cell.cellId === 'dot8_s' && (
                    <line
                      x1={lastStem - 10}
                      y1={yStemTop + 7}
                      x2={lastStem + 1}
                      y2={yStemTop + 7}
                      stroke="var(--ink-primary)"
                      strokeWidth="4"
                    />
                  )}

                  {cell.cellId === 'scotch_snap' && (
                    <line
                      x1={firstStem - 1}
                      y1={yStemTop + 7}
                      x2={firstStem + 10}
                      y2={yStemTop + 7}
                      stroke="var(--ink-primary)"
                      strokeWidth="4"
                    />
                  )}

                  {cell.cellId === 'sync_16_8_16' && (
                    <>
                      <line
                        x1={firstStem - 1}
                        y1={yStemTop + 7}
                        x2={firstStem + 8}
                        y2={yStemTop + 7}
                        stroke="var(--ink-primary)"
                        strokeWidth="4"
                      />
                      <line
                        x1={lastStem - 8}
                        y1={yStemTop + 7}
                        x2={lastStem + 1}
                        y2={yStemTop + 7}
                        stroke="var(--ink-primary)"
                        strokeWidth="4"
                      />
                    </>
                  )}

                  {cell.cellId === 'pickup_3s' && (
                    <line
                      x1={firstStem - 1}
                      y1={yStemTop + 7}
                      x2={lastStem + 1}
                      y2={yStemTop + 7}
                      stroke="var(--ink-primary)"
                      strokeWidth="4"
                    />
                  )}

                  {/* Triplet bracket & numeral "3" */}
                  {cell.cellId === 'triplet_e' && (
                    <text
                      x={(firstStem + lastStem) / 2}
                      y={yStemTop - 7}
                      fontFamily="var(--font-sans)"
                      fontSize="12"
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
              <g key={`beat-${b}`}>
                {renderedEvents}
                {stemsAndBeams}
              </g>
            );
          })}

          {/* 1-Beat Word Boxes (clickable preview in Sandbox) */}
          {snapshot.showWordBoxes &&
            beats.map((cell, b) => {
              const xBeat = xStart + b * wBeat;
              const boxW = wBeat - 8;
              const isLandingBeat = b === totalBeats - 1;

              return (
                <g
                  key={`word-box-${b}`}
                  className="nnsr-rhythm-word-box-group"
                  data-testid={`beat-box-${b}`}
                  onClick={() => handleBeatBoxClick(cell)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Beat ${b + 1}: ${cell.label}`}
                  style={{ cursor: snapshot.phase === 'SANDBOX' ? 'pointer' : 'default' }}
                >
                  <rect
                    x={xBeat + 4}
                    y={168}
                    width={boxW}
                    height={38}
                    rx="8"
                    className="nnsr-rhythm-word-box-rect"
                    fill={isLandingBeat ? 'rgba(96, 211, 148, 0.15)' : 'var(--surface-subtle)'}
                    stroke={isLandingBeat ? 'var(--emerald)' : 'var(--border-subtle)'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={xBeat + 4 + boxW / 2}
                    y={187}
                    fontFamily="var(--font-sans)"
                    fontSize="13"
                    fontWeight="600"
                    fill="var(--ink-primary)"
                    textAnchor="middle"
                  >
                    {cell.symbol}
                  </text>
                  <text
                    x={xBeat + 4 + boxW / 2}
                    y={199}
                    fontFamily="var(--font-sans)"
                    fontSize="9"
                    fill="var(--ink-secondary)"
                    textAnchor="middle"
                  >
                    {isLandingBeat ? 'Landing' : `Beat ${(b % snapshot.phrase.beatsPerBar) + 1}`}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      {/* Interactive Control & Status Bar */}
      <div className="nnsr-rhythm-status-bar">
        {snapshot.phase === 'SANDBOX' && (
          <div className="nnsr-rhythm-phase-box nnsr-rhythm-sandbox-box">
            <div className="nnsr-rhythm-guidance">
              <span className="nnsr-rhythm-badge">Sandbox Rehearsal</span>
              <p>
                Internalize the rhythm pattern at your own pace. Tap{' '}
                <kbd className="nnsr-kbd">Space</kbd> or <kbd className="nnsr-kbd">J</kbd> (or MIDI) to play,{' '}
                <kbd className="nnsr-kbd">F</kbd> for Left-Hand Pulse, or click any beat word to hear its groove + landing.
              </p>
            </div>
            <button
              type="button"
              className="nnsr-rhythm-btn nnsr-rhythm-primary-btn"
              onClick={handleStartPerform}
              data-testid="rhythm-start-perform-btn"
            >
              Count-In & Play (Enter) →
            </button>
          </div>
        )}

        {snapshot.phase === 'COUNT_IN' && (
          <div className="nnsr-rhythm-phase-box nnsr-rhythm-countin-box">
            <span className="nnsr-rhythm-badge nnsr-badge-accent">Count-In</span>
            <div className="nnsr-rhythm-gravity-meter">
              {Array.from({ length: snapshot.phrase.beatsPerBar }).map((_, bIdx) => {
                const isActive = snapshot.countInBeatIndex === bIdx;
                const isHeavy = bIdx === 0;
                const isLift = bIdx === snapshot.phrase.beatsPerBar - 1;
                return (
                  <div
                    key={`countin-dot-${bIdx}`}
                    className={`nnsr-countin-dot ${isActive ? 'active' : ''} ${
                      isHeavy ? 'heavy' : isLift ? 'lift' : ''
                    }`}
                  >
                    <span className="dot-num">{bIdx + 1}</span>
                    <span className="dot-label">
                      {isHeavy ? 'Schwer' : isLift ? 'Auftakt' : 'Leicht'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {snapshot.phase === 'PERFORM' && (
          <div className="nnsr-rhythm-phase-box nnsr-rhythm-perform-box">
            <div className="nnsr-rhythm-guidance">
              <span className="nnsr-rhythm-badge nnsr-badge-live">Live Performance</span>
              <p>
                External pulse muted. Perform the internalized phrase from your own internal clock (
                <kbd className="nnsr-kbd">Space</kbd> / <kbd className="nnsr-kbd">J</kbd> / MIDI).
              </p>
            </div>
            <div className="nnsr-rhythm-tap-progress">
              <span>
                Notes Tapped: {snapshot.performTapCount} / {snapshot.flattenedNotes.length}
              </span>
              {snapshot.leftHandPulseCount > 0 && (
                <span className="nnsr-lh-pulse-tag">
                  LH Pulses: {snapshot.leftHandPulseCount}
                </span>
              )}
            </div>
          </div>
        )}

        {snapshot.phase === 'FEEDBACK' && snapshot.feedback && (
          <div className="nnsr-rhythm-phase-box nnsr-rhythm-feedback-box">
            <div className="nnsr-rhythm-feedback-metrics">
              <div className="nnsr-metric-card">
                <span className="metric-title">Groove Shape</span>
                <span className="metric-val">{snapshot.feedback.grooveScorePct}%</span>
                <span className="metric-desc">Sub-beat IOI Accuracy</span>
              </div>
              <div className="nnsr-metric-card">
                <span className="metric-title">Hold & Articulation</span>
                <span className="metric-val">{snapshot.feedback.holdScorePct}%</span>
                <span className="metric-desc">Sustained Ties vs Rests</span>
              </div>
              <div className="nnsr-metric-card">
                <span className="metric-title">Internal Clock</span>
                <span className="metric-val">{snapshot.feedback.estimatedUserBpm} BPM</span>
                <span className="metric-desc">
                  {snapshot.feedback.pulseDriftPct >= 0 ? '+' : ''}
                  {snapshot.feedback.pulseDriftPct}% drift
                </span>
              </div>
            </div>

            <div className="nnsr-rhythm-feedback-actions">
              <span
                className={`nnsr-feedback-badge ${
                  snapshot.feedback.passed ? 'passed' : 'retry'
                }`}
              >
                {snapshot.feedback.passed ? '✓ Phrase Mastered' : 'Try Again'}
              </span>

              <div className="nnsr-feedback-btn-group">
                <button
                  type="button"
                  className="nnsr-rhythm-btn nnsr-rhythm-secondary-btn"
                  onClick={handleRetry}
                  data-testid="rhythm-retry-btn"
                >
                  ← Sandbox (R)
                </button>
                <button
                  type="button"
                  className="nnsr-rhythm-btn nnsr-rhythm-primary-btn"
                  onClick={handleNextPhrase}
                  data-testid="rhythm-next-phrase-btn"
                >
                  Next Phrase (Enter) →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
