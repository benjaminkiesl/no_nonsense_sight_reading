import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getLedgerLines, getStemDirection } from '../music/notation';
import { createTarget, getStaffStepOffset } from '../music/pitch';
import { KEY_SIGNATURES, KeySignatureId } from '../music/scales';
import { LetterName, Octave, StaffNoteTarget } from '../types/music';
import { ActiveKeyHighlight, PianoKeyboard } from './PianoKeyboard';

export interface AccelerandoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (selectedNotes: StaffNoteTarget[], startingBpm: number) => void;
  bestAccelerandoBpm: number | null;
  initialLevelNotes?: readonly StaffNoteTarget[];
}

// Full Treble range from A3 below Middle C up to C6
const BASE_TREBLE_NOTES: { letter: LetterName; octave: Octave }[] = [
  { letter: 'A', octave: 3 },
  { letter: 'B', octave: 3 },
  { letter: 'C', octave: 4 },
  { letter: 'D', octave: 4 },
  { letter: 'E', octave: 4 },
  { letter: 'F', octave: 4 },
  { letter: 'G', octave: 4 },
  { letter: 'A', octave: 4 },
  { letter: 'B', octave: 4 },
  { letter: 'C', octave: 5 },
  { letter: 'D', octave: 5 },
  { letter: 'E', octave: 5 },
  { letter: 'F', octave: 5 },
  { letter: 'G', octave: 5 },
  { letter: 'A', octave: 5 },
  { letter: 'B', octave: 5 },
  { letter: 'C', octave: 6 },
];

// Full Bass range from C2 up to E4 above Middle C
const BASE_BASS_NOTES: { letter: LetterName; octave: Octave }[] = [
  { letter: 'C', octave: 2 },
  { letter: 'D', octave: 2 },
  { letter: 'E', octave: 2 },
  { letter: 'F', octave: 2 },
  { letter: 'G', octave: 2 },
  { letter: 'A', octave: 2 },
  { letter: 'B', octave: 2 },
  { letter: 'C', octave: 3 },
  { letter: 'D', octave: 3 },
  { letter: 'E', octave: 3 },
  { letter: 'F', octave: 3 },
  { letter: 'G', octave: 3 },
  { letter: 'A', octave: 3 },
  { letter: 'B', octave: 3 },
  { letter: 'C', octave: 4 },
  { letter: 'D', octave: 4 },
  { letter: 'E', octave: 4 },
];

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
  const octave = (Math.floor(midi / 12) - 1) as Octave;
  const semitone = midi % 12;
  const name = SEMITONE_MAP[semitone] ?? 'C';
  const clef = midi >= 60 ? 'treble' : 'bass';
  return createTarget(clef, `${name}${octave}`);
}

function getScaleTargets(keySigId: KeySignatureId): StaffNoteTarget[] {
  const altered = KEY_SIGNATURES[keySigId].alteredLetters;
  const trebleTargets = BASE_TREBLE_NOTES.map(({ letter, octave }) => {
    const acc = altered[letter] ?? 0;
    const accStr = acc === 1 ? '#' : acc === -1 ? 'b' : '';
    return createTarget('treble', `${letter}${accStr}${octave}`);
  });
  const bassTargets = BASE_BASS_NOTES.map(({ letter, octave }) => {
    const acc = altered[letter] ?? 0;
    const accStr = acc === 1 ? '#' : acc === -1 ? 'b' : '';
    return createTarget('bass', `${letter}${accStr}${octave}`);
  });
  return [...bassTargets, ...trebleTargets];
}

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
  const [selectedScale, setSelectedScale] = useState<KeySignatureId>('C_MAJOR');
  const [selectedTargets, setSelectedTargets] = useState<StaffNoteTarget[]>(() => {
    if (initialLevelNotes && initialLevelNotes.length > 0) {
      return [...initialLevelNotes];
    }
    return getScaleTargets('C_MAJOR');
  });

  // Re-sync startingBpm and notes whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStartingBpm(computedDefaultBpm);
      if (initialLevelNotes && initialLevelNotes.length > 0) {
        setSelectedTargets([...initialLevelNotes]);
      } else {
        setSelectedTargets(getScaleTargets(selectedScale));
      }
    }
  }, [isOpen, computedDefaultBpm, initialLevelNotes]);

  const handleScaleChange = useCallback((scale: KeySignatureId) => {
    setSelectedScale(scale);
    setSelectedTargets(getScaleTargets(scale));
  }, []);

  const isTargetSelected = useCallback(
    (targetId: string) => {
      return selectedTargets.some((t) => t.targetId === targetId);
    },
    [selectedTargets]
  );

  const toggleTarget = useCallback(
    (target: StaffNoteTarget) => {
      if (isTargetSelected(target.targetId)) {
        setSelectedTargets((prev) => prev.filter((t) => t.targetId !== target.targetId));
      } else {
        setSelectedTargets((prev) => [...prev, target]);
      }
    },
    [isTargetSelected]
  );

  // Keyboard note toggle
  const handlePianoKeyPress = useCallback(
    (midi: number) => {
      const hasTargetWithMidi = selectedTargets.some((t) => t.pitch.midi === midi);
      if (hasTargetWithMidi) {
        setSelectedTargets((prev) => prev.filter((t) => t.pitch.midi !== midi));
      } else {
        const currentScaleNotes = getScaleTargets(selectedScale);
        const matchesInScale = currentScaleNotes.filter((t) => t.pitch.midi === midi);
        if (matchesInScale.length > 0) {
          const preferred =
            midi >= 60
              ? matchesInScale.find((t) => t.clef === 'treble') ?? matchesInScale[0]!
              : matchesInScale.find((t) => t.clef === 'bass') ?? matchesInScale[0]!;
          setSelectedTargets((prev) => [...prev, preferred]);
        } else {
          setSelectedTargets((prev) => [...prev, midiToTarget(midi)]);
        }
      }
    },
    [selectedTargets, selectedScale]
  );

  // Highlights for PianoKeyboard
  const activeHighlights: ActiveKeyHighlight[] = useMemo(
    () =>
      selectedTargets.map((t) => ({
        midi: t.pitch.midi,
        status: 'correct',
      })),
    [selectedTargets]
  );

  const handleStart = () => {
    if (selectedTargets.length === 0) return;
    onStart(selectedTargets, startingBpm);
  };

  const currentTrebleNotes = useMemo(() => {
    const altered = KEY_SIGNATURES[selectedScale].alteredLetters;
    return BASE_TREBLE_NOTES.map(({ letter, octave }) => {
      const acc = altered[letter] ?? 0;
      const accStr = acc === 1 ? '#' : acc === -1 ? 'b' : '';
      return createTarget('treble', `${letter}${accStr}${octave}`);
    });
  }, [selectedScale]);

  const currentBassNotes = useMemo(() => {
    const altered = KEY_SIGNATURES[selectedScale].alteredLetters;
    return BASE_BASS_NOTES.map(({ letter, octave }) => {
      const acc = altered[letter] ?? 0;
      const accStr = acc === 1 ? '#' : acc === -1 ? 'b' : '';
      return createTarget('bass', `${letter}${accStr}${octave}`);
    });
  }, [selectedScale]);

  const keySigSpec = KEY_SIGNATURES[selectedScale];
  const accSymbol = keySigSpec.accidentalType === 'sharp' ? '♯' : '♭';

  if (!isOpen) return null;

  return (
    <div
      className="nnsr-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accelerando-modal-title"
    >
      <div className="nnsr-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Minimal Header */}
        <div className="nnsr-modal-header">
          <h2 id="accelerando-modal-title" className="nnsr-modal-title">
            Infinite Speed-Up
          </h2>
          <button
            className="nnsr-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Minimal Scale Picker Toolbar */}
        <div className="nnsr-modal-toolbar">
          <div className="nnsr-scale-picker">
            <label htmlFor="nnsr-scale-select" className="nnsr-scale-label">
              Scale:
            </label>
            <select
              id="nnsr-scale-select"
              value={selectedScale}
              onChange={(e) => handleScaleChange(e.target.value as KeySignatureId)}
              className="nnsr-scale-select"
              aria-label="Scale Selector"
            >
              <option value="C_MAJOR">C Major</option>
              <option value="G_MAJOR">G Major (1♯)</option>
              <option value="D_MAJOR">D Major (2♯)</option>
              <option value="F_MAJOR">F Major (1♭)</option>
              <option value="BB_MAJOR">B♭ Major (2♭)</option>
            </select>
          </div>
          <div className="nnsr-modal-note-count">
            {selectedTargets.length} selected
          </div>
        </div>

        {/* Interactive Grand Staff SVG */}
        <div className="nnsr-modal-staff-container">
          <svg
            viewBox="0 0 780 230"
            width="100%"
            height="230"
            style={{ display: 'block', userSelect: 'none' }}
          >
            {/* Grand Staff Lines */}
            {[35, 45, 55, 65, 75].map((y) => (
              <line key={`t-line-${y}`} x1={30} y1={y} x2={760} y2={y} stroke="#232b26" strokeWidth={1} />
            ))}
            {[145, 155, 165, 175, 185].map((y) => (
              <line key={`b-line-${y}`} x1={30} y1={y} x2={760} y2={y} stroke="#232b26" strokeWidth={1} />
            ))}

            {/* Vertical connector bar */}
            <line x1={30} y1={35} x2={30} y2={185} stroke="#232b26" strokeWidth={1.5} />

            {/* Clef symbols */}
            <text x={45} y={58} fontSize="34px" fontFamily="serif" textAnchor="middle" fill="#1f2421">
              𝄞
            </text>
            <text x={45} y={155} fontSize="26px" fontFamily="serif" textAnchor="middle" fill="#1f2421">
              𝄢
            </text>

            {/* Key Signature Accidentals */}
            {keySigSpec.accidentalType !== 'none' && (
              <>
                {keySigSpec.trebleStepOffsets.map((offset, idx) => {
                  const x = 58 + idx * 10;
                  const ny = 75 - offset * 5;
                  return (
                    <text
                      key={`t-ks-${idx}`}
                      x={x}
                      y={ny + 4}
                      fontSize="14px"
                      fontFamily="serif"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="#1f2421"
                    >
                      {accSymbol}
                    </text>
                  );
                })}
                {keySigSpec.bassStepOffsets.map((offset, idx) => {
                  const x = 58 + idx * 10;
                  const ny = 185 - offset * 5;
                  return (
                    <text
                      key={`b-ks-${idx}`}
                      x={x}
                      y={ny + 4}
                      fontSize="14px"
                      fontFamily="serif"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="#1f2421"
                    >
                      {accSymbol}
                    </text>
                  );
                })}
              </>
            )}

            {/* Treble Staff Notes (A3 to C6 across top staff) */}
            {currentTrebleNotes.map((target, i) => {
              const isSelected = isTargetSelected(target.targetId);
              const stepOffset = getStaffStepOffset(target.pitch, 'treble');
              const bottomY = 75;
              const stepScale = 5;
              const ny = bottomY - stepOffset * stepScale;
              const nx = 88 + i * 38;
              const ledgers = getLedgerLines(stepOffset);
              const stemDir = getStemDirection(stepOffset);
              const displayLetter =
                target.pitch.letter +
                (target.pitch.accidental === 1 ? '♯' : target.pitch.accidental === -1 ? '♭' : '');

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
                  <rect
                    x={nx - 14}
                    y={ny - 15}
                    width={28}
                    height={30}
                    fill="transparent"
                  />
                  {ledgers.map((lOffset) => {
                    const ly = bottomY - lOffset * stepScale;
                    return (
                      <line
                        key={`l-${lOffset}`}
                        x1={nx - 9}
                        y1={ly}
                        x2={nx + 9}
                        y2={ly}
                        stroke={isSelected ? '#52b788' : '#232b26'}
                        strokeWidth={1}
                      />
                    );
                  })}
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
                  <line
                    x1={stemDir === 'up' ? nx + 4.5 : nx - 4.5}
                    y1={ny}
                    x2={stemDir === 'up' ? nx + 4.5 : nx - 4.5}
                    y2={stemDir === 'up' ? ny - 20 : ny + 20}
                    stroke={isSelected ? '#183324' : '#8c948f'}
                    strokeWidth={1.2}
                  />
                  <text
                    x={nx}
                    y={ny + (stemDir === 'up' ? 14 : -12)}
                    textAnchor="middle"
                    fontSize="9.5px"
                    fontWeight={isSelected ? '700' : '500'}
                    fill={isSelected ? '#183324' : '#8c948f'}
                  >
                    {displayLetter}
                  </text>
                </g>
              );
            })}

            {/* Bass Staff Notes (C2 to E4 across bottom staff) */}
            {currentBassNotes.map((target, i) => {
              const isSelected = isTargetSelected(target.targetId);
              const stepOffset = getStaffStepOffset(target.pitch, 'bass');
              const bottomY = 185;
              const stepScale = 5;
              const ny = bottomY - stepOffset * stepScale;
              const nx = 88 + i * 38;
              const ledgers = getLedgerLines(stepOffset);
              const stemDir = getStemDirection(stepOffset);
              const displayLetter =
                target.pitch.letter +
                (target.pitch.accidental === 1 ? '♯' : target.pitch.accidental === -1 ? '♭' : '');

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
                  <rect
                    x={nx - 14}
                    y={ny - 15}
                    width={28}
                    height={30}
                    fill="transparent"
                  />
                  {ledgers.map((lOffset) => {
                    const ly = bottomY - lOffset * stepScale;
                    return (
                      <line
                        key={`b-l-${lOffset}`}
                        x1={nx - 9}
                        y1={ly}
                        x2={nx + 9}
                        y2={ly}
                        stroke={isSelected ? '#52b788' : '#232b26'}
                        strokeWidth={1}
                      />
                    );
                  })}
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
                  <line
                    x1={stemDir === 'up' ? nx + 4.5 : nx - 4.5}
                    y1={ny}
                    x2={stemDir === 'up' ? nx + 4.5 : nx - 4.5}
                    y2={stemDir === 'up' ? ny - 20 : ny + 20}
                    stroke={isSelected ? '#183324' : '#8c948f'}
                    strokeWidth={1.2}
                  />
                  <text
                    x={nx}
                    y={ny + (stemDir === 'up' ? 14 : -12)}
                    textAnchor="middle"
                    fontSize="9.5px"
                    fontWeight={isSelected ? '700' : '500'}
                    fill={isSelected ? '#183324' : '#8c948f'}
                  >
                    {displayLetter}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Interactive Piano Keyboard */}
        <div className="nnsr-modal-piano-wrap">
          <PianoKeyboard
            onKeyPress={handlePianoKeyPress}
            activeHighlights={activeHighlights}
          />
        </div>

        {/* Tempo Picker & Start Button */}
        <div className="nnsr-modal-footer">
          <div className="nnsr-modal-bpm-control">
            <label htmlFor="nnsr-start-bpm-slider" className="nnsr-modal-bpm-label">
              Start Tempo:
            </label>
            <input
              id="nnsr-start-bpm-slider"
              type="range"
              min={20}
              max={200}
              step={5}
              value={startingBpm}
              onChange={(e) => setStartingBpm(Number(e.target.value))}
              className="nnsr-modal-bpm-slider"
              aria-label="Starting BPM Slider"
            />
            <div className="nnsr-modal-bpm-input-wrap">
              <input
                type="number"
                min={20}
                max={240}
                value={startingBpm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setStartingBpm(Math.max(15, Math.min(240, val)));
                  }
                }}
                className="nnsr-modal-bpm-number"
                aria-label="Starting BPM Input"
              />
              <span className="nnsr-modal-bpm-unit">BPM</span>
            </div>
          </div>

          <button
            className="nnsr-modal-start-btn"
            onClick={handleStart}
            disabled={selectedTargets.length === 0}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
};
