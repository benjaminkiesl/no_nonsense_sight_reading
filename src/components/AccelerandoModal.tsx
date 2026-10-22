import React, { useState, useEffect, useMemo } from 'react';
import { getLedgerLines, getStemDirection } from '../music/notation';
import { createTarget, getStaffStepOffset } from '../music/pitch';
import { StaffNoteTarget } from '../types/music';
import { ActiveKeyHighlight, PianoKeyboard } from './PianoKeyboard';

export interface AccelerandoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (selectedNotes: StaffNoteTarget[], startingBpm: number) => void;
  bestAccelerandoBpm: number | null;
  initialLevelNotes?: readonly StaffNoteTarget[];
}

const SEMITONE_MAP: Record<number, string> = {
  0: 'C',
  1: 'C#',
  2: 'D',
  3: 'Eb',
  4: 'E',
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'Ab',
  9: 'A',
  10: 'Bb',
  11: 'B',
};

function midiToTarget(midi: number): StaffNoteTarget {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi % 12;
  const name = SEMITONE_MAP[semitone] ?? 'C';
  const clef = midi >= 60 ? 'treble' : 'bass';
  return createTarget(clef, `${name}${octave}`);
}

// Diatonic staff notes across treble and bass
const TREBLE_STAFF_PITCH_IDS = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6',
];
const BASS_STAFF_PITCH_IDS = [
  'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4',
];

const ALL_TREBLE_TARGETS = TREBLE_STAFF_PITCH_IDS.map((p) => createTarget('treble', p));
const ALL_BASS_TARGETS = BASS_STAFF_PITCH_IDS.map((p) => createTarget('bass', p));
const ALL_DEFAULT_STAFF_TARGETS = [...ALL_BASS_TARGETS, ...ALL_TREBLE_TARGETS];

export const AccelerandoModal: React.FC<AccelerandoModalProps> = ({
  isOpen,
  onClose,
  onStart,
  bestAccelerandoBpm,
  initialLevelNotes,
}) => {
  // Default starting tempo: 10% below previous best BPM, or 40 BPM if no best recorded
  const computedDefaultBpm = useMemo(() => {
    if (bestAccelerandoBpm && bestAccelerandoBpm > 0) {
      return Math.max(15, Math.min(240, Math.round(bestAccelerandoBpm * 0.9)));
    }
    return 40;
  }, [bestAccelerandoBpm]);

  const [startingBpm, setStartingBpm] = useState<number>(computedDefaultBpm);
  const [selectedTargets, setSelectedTargets] = useState<StaffNoteTarget[]>(() => {
    if (initialLevelNotes && initialLevelNotes.length > 0) {
      return [...initialLevelNotes];
    }
    return [
      createTarget('treble', 'C4'),
      createTarget('treble', 'D4'),
      createTarget('treble', 'E4'),
      createTarget('treble', 'F4'),
      createTarget('treble', 'G4'),
    ];
  });

  // Re-sync startingBpm and notes whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStartingBpm(computedDefaultBpm);
      if (initialLevelNotes && initialLevelNotes.length > 0) {
        setSelectedTargets([...initialLevelNotes]);
      }
    }
  }, [isOpen, computedDefaultBpm, initialLevelNotes]);

  if (!isOpen) return null;

  const isTargetSelected = (targetId: string) => {
    return selectedTargets.some((t) => t.targetId === targetId);
  };

  const toggleTarget = (target: StaffNoteTarget) => {
    if (isTargetSelected(target.targetId)) {
      setSelectedTargets((prev) => prev.filter((t) => t.targetId !== target.targetId));
    } else {
      setSelectedTargets((prev) => [...prev, target]);
    }
  };

  // Keyboard note toggle
  const handlePianoKeyPress = (midi: number) => {
    const hasTargetWithMidi = selectedTargets.some((t) => t.pitch.midi === midi);
    if (hasTargetWithMidi) {
      setSelectedTargets((prev) => prev.filter((t) => t.pitch.midi !== midi));
    } else {
      const newTarget = midiToTarget(midi);
      setSelectedTargets((prev) => [...prev, newTarget]);
    }
  };

  // Highlights for PianoKeyboard
  const activeHighlights: ActiveKeyHighlight[] = selectedTargets.map((t) => ({
    midi: t.pitch.midi,
    status: 'correct',
  }));

  const handleStart = () => {
    if (selectedTargets.length === 0) return;
    onStart(selectedTargets, startingBpm);
  };

  return (
    <div
      className="nnsr-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accelerando-modal-title"
    >
      <div className="nnsr-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="nnsr-modal-header">
          <div className="nnsr-modal-title-row">
            <span className="nnsr-modal-badge">⚡ SPEED TRAINING</span>
            <h2 id="accelerando-modal-title" className="nnsr-modal-title">
              Accelerando Perpetuo
            </h2>
            <p className="nnsr-modal-desc">
              Continuous tempo acceleration up to 240 BPM (+0.2 BPM per correct hit).
            </p>
          </div>
          <button
            className="nnsr-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Note Selection on Grand Staff & Piano */}
        <div className="nnsr-modal-section">
          <div className="nnsr-section-header-row">
            <h3 className="nnsr-section-title">
              1. Select Notes ({selectedTargets.length} selected)
            </h3>
            <div className="nnsr-preset-buttons">
              {initialLevelNotes && initialLevelNotes.length > 0 && (
                <button
                  type="button"
                  className="nnsr-preset-btn"
                  onClick={() => setSelectedTargets([...initialLevelNotes])}
                >
                  Current Level Notes
                </button>
              )}
              <button
                type="button"
                className="nnsr-preset-btn"
                onClick={() => setSelectedTargets(ALL_TREBLE_TARGETS)}
              >
                Treble Notes
              </button>
              <button
                type="button"
                className="nnsr-preset-btn"
                onClick={() => setSelectedTargets(ALL_BASS_TARGETS)}
              >
                Bass Notes
              </button>
              <button
                type="button"
                className="nnsr-preset-btn"
                onClick={() => setSelectedTargets(ALL_DEFAULT_STAFF_TARGETS)}
              >
                All Notes
              </button>
              <button
                type="button"
                className="nnsr-preset-btn nnsr-preset-clear"
                onClick={() => setSelectedTargets([])}
              >
                Clear
              </button>
            </div>
          </div>

          <p className="nnsr-instruction-subtext">
            Click any note on the staff or key on the piano to toggle. Selected notes are highlighted in green.
          </p>

          {/* Interactive Grand Staff SVG */}
          <div className="nnsr-modal-staff-container">
            <svg
              viewBox="0 0 780 200"
              width="100%"
              height="200"
              style={{ display: 'block', userSelect: 'none' }}
            >
              {/* Grand Staff Lines */}
              {/* Treble staff lines */}
              {[40, 50, 60, 70, 80].map((y) => (
                <line key={`t-line-${y}`} x1={30} y1={y} x2={760} y2={y} stroke="#232b26" strokeWidth={1} />
              ))}
              {/* Bass staff lines */}
              {[120, 130, 140, 150, 160].map((y) => (
                <line key={`b-line-${y}`} x1={30} y1={y} x2={760} y2={y} stroke="#232b26" strokeWidth={1} />
              ))}

              {/* Vertical connector bar */}
              <line x1={30} y1={40} x2={30} y2={160} stroke="#232b26" strokeWidth={2} />

              {/* Clef symbols */}
              <text x={44} y={65} fontSize="34px" fontFamily="serif" textAnchor="middle" fill="#1f2421">
                𝄞
              </text>
              <text x={44} y={135} fontSize="26px" fontFamily="serif" textAnchor="middle" fill="#1f2421">
                𝄢
              </text>

              {/* Treble Staff Notes (C4 to C6) */}
              {TREBLE_STAFF_PITCH_IDS.map((pitchId, i) => {
                const target = createTarget('treble', pitchId);
                const isSelected = isTargetSelected(target.targetId);
                const stepOffset = getStaffStepOffset(target.pitch, 'treble');
                const bottomY = 80; // E4 line is y=80
                const stepScale = 5; // 10px per diatonic interval (line to line)
                const ny = bottomY - stepOffset * stepScale;
                const nx = 72 + i * 22;
                const ledgers = getLedgerLines(stepOffset);
                const stemDir = getStemDirection(stepOffset);

                return (
                  <g
                    key={target.targetId}
                    role="button"
                    tabIndex={0}
                    aria-label={`Toggle ${target.targetId}`}
                    onClick={() => toggleTarget(target)}
                    style={{ cursor: 'pointer' }}
                    className="nnsr-staff-clickable-note"
                  >
                    {/* Click Hitbox */}
                    <rect
                      x={nx - 10}
                      y={ny - 15}
                      width={20}
                      height={30}
                      fill="transparent"
                    />

                    {/* Ledger lines */}
                    {ledgers.map((lOffset) => {
                      const ly = bottomY - lOffset * stepScale;
                      return (
                        <line
                          key={`l-${lOffset}`}
                          x1={nx - 8}
                          y1={ly}
                          x2={nx + 8}
                          y2={ly}
                          stroke={isSelected ? '#52b788' : '#232b26'}
                          strokeWidth={1}
                        />
                      );
                    })}

                    {/* Notehead */}
                    <ellipse
                      cx={nx}
                      cy={ny}
                      rx={5.5}
                      ry={3.8}
                      transform={`rotate(-20 ${nx} ${ny})`}
                      fill={isSelected ? 'var(--emerald)' : 'rgba(35, 43, 38, 0.08)'}
                      stroke={isSelected ? '#183324' : '#8c948f'}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />

                    {/* Stem */}
                    <line
                      x1={stemDir === 'up' ? nx + 4.5 : nx - 4.5}
                      y1={ny}
                      x2={stemDir === 'up' ? nx + 4.5 : nx - 4.5}
                      y2={stemDir === 'up' ? ny - 22 : ny + 22}
                      stroke={isSelected ? '#183324' : '#8c948f'}
                      strokeWidth={1.2}
                    />

                    {/* Note name tag */}
                    <text
                      x={nx}
                      y={ny + (stemDir === 'up' ? 14 : -12)}
                      textAnchor="middle"
                      fontSize="9px"
                      fontWeight={isSelected ? '700' : '500'}
                      fill={isSelected ? '#183324' : '#8c948f'}
                    >
                      {target.pitch.letter}
                    </text>
                  </g>
                );
              })}

              {/* Bass Staff Notes (C2 to C4) */}
              {BASS_STAFF_PITCH_IDS.map((pitchId, i) => {
                const target = createTarget('bass', pitchId);
                const isSelected = isTargetSelected(target.targetId);
                const stepOffset = getStaffStepOffset(target.pitch, 'bass');
                const bottomY = 160; // G2 line is y=160
                const stepScale = 5;
                const ny = bottomY - stepOffset * stepScale;
                const nx = 420 + i * 22;
                const ledgers = getLedgerLines(stepOffset);
                const stemDir = getStemDirection(stepOffset);

                return (
                  <g
                    key={target.targetId}
                    role="button"
                    tabIndex={0}
                    aria-label={`Toggle ${target.targetId}`}
                    onClick={() => toggleTarget(target)}
                    style={{ cursor: 'pointer' }}
                    className="nnsr-staff-clickable-note"
                  >
                    {/* Click Hitbox */}
                    <rect
                      x={nx - 10}
                      y={ny - 15}
                      width={20}
                      height={30}
                      fill="transparent"
                    />

                    {/* Ledger lines */}
                    {ledgers.map((lOffset) => {
                      const ly = bottomY - lOffset * stepScale;
                      return (
                        <line
                          key={`b-l-${lOffset}`}
                          x1={nx - 8}
                          y1={ly}
                          x2={nx + 8}
                          y2={ly}
                          stroke={isSelected ? '#52b788' : '#232b26'}
                          strokeWidth={1}
                        />
                      );
                    })}

                    {/* Notehead */}
                    <ellipse
                      cx={nx}
                      cy={ny}
                      rx={5.5}
                      ry={3.8}
                      transform={`rotate(-20 ${nx} ${ny})`}
                      fill={isSelected ? 'var(--emerald)' : 'rgba(35, 43, 38, 0.08)'}
                      stroke={isSelected ? '#183324' : '#8c948f'}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />

                    {/* Stem */}
                    <line
                      x1={stemDir === 'up' ? nx + 4.5 : nx - 4.5}
                      y1={ny}
                      x2={stemDir === 'up' ? nx + 4.5 : nx - 4.5}
                      y2={stemDir === 'up' ? ny - 22 : ny + 22}
                      stroke={isSelected ? '#183324' : '#8c948f'}
                      strokeWidth={1.2}
                    />

                    {/* Note name tag */}
                    <text
                      x={nx}
                      y={ny + (stemDir === 'up' ? 14 : -12)}
                      textAnchor="middle"
                      fontSize="9px"
                      fontWeight={isSelected ? '700' : '500'}
                      fill={isSelected ? '#183324' : '#8c948f'}
                    >
                      {target.pitch.letter}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Piano Keyboard with Green Highlights */}
          <div className="nnsr-modal-piano-wrap">
            <PianoKeyboard
              onKeyPress={handlePianoKeyPress}
              activeHighlights={activeHighlights}
            />
          </div>
        </div>

        {/* Section 2: Starting Tempo */}
        <div className="nnsr-modal-section">
          <div className="nnsr-section-header-row">
            <h3 className="nnsr-section-title">2. Starting Tempo</h3>
            <div className="nnsr-best-bpm-tag">
              Best Recorded:{' '}
              <strong>
                {bestAccelerandoBpm ? `${bestAccelerandoBpm.toFixed(1)} BPM` : 'None'}
              </strong>
            </div>
          </div>

          <div className="nnsr-tempo-controls">
            <div className="nnsr-tempo-slider-wrap">
              <input
                type="range"
                min={15}
                max={240}
                step={1}
                value={startingBpm}
                onChange={(e) => setStartingBpm(Number(e.target.value))}
                className="nnsr-tempo-range"
                aria-label="Starting BPM Slider"
              />
            </div>
            <div className="nnsr-tempo-input-wrap">
              <input
                type="number"
                min={15}
                max={240}
                step={1}
                value={startingBpm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setStartingBpm(Math.max(15, Math.min(240, val)));
                  }
                }}
                className="nnsr-tempo-number-input"
                aria-label="Starting BPM Input"
              />
              <span className="nnsr-tempo-unit">BPM</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="nnsr-modal-footer">
          <button type="button" className="nnsr-modal-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="nnsr-modal-start-btn"
            onClick={handleStart}
            disabled={selectedTargets.length === 0}
          >
            Start Accelerando Perpetuo ({startingBpm} BPM) →
          </button>
        </div>
      </div>
    </div>
  );
};
